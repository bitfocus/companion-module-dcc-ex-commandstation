import { InstanceBase, InstanceStatus, Regex, runEntrypoint, TCPHelper } from '@companion-module/base'
import { updateActions } from './actions.js'
// import { updateVariables } from './variables.js'
import { updateFeedbacks } from './feedback.js'
import { updatePresets } from './presets.js'

class DCCEX extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.updateActions = updateActions.bind(this)
		this.updateFeedbacks = updateFeedbacks.bind(this)
		this.updatePresets = updatePresets.bind(this)
		// this.updateVariables = updateVariables.bind(this)
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module is for DCC-EX Command Station (Version 5)',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Device IP',
				width: 6,
				regex: Regex.IP,
				required: true,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Control Port',
				width: 6,
				default: '2560',
				regex: Regex.Port,
				required: true,
			},
			// {
			// 	type: 'checkbox',
			// 	id: 'debuglog',
			// 	label: 'Show all return values in debug log',
			// 	width: 6,
			// 	default: false,
			// },
		]
	}

	async destroy() {
		this.log('debug', 'destroy ' + this.id + ' ' + this.label)

		var self = this

		if (self.socket !== undefined) {
			self.socket.destroy()
		}
	}

	async init(config) {
		console.log('init ' + this.label)

		this.config = config

		this.locos = []
		this.speedTable = []
		this.locoVariables = []
		this.powerState = null

		this.variables = [
			{
				name: 'Device Model',
				variableId: 'model',
			},
			{
				name: 'Motor Shield',
				variableId: 'motor',
			},
			{
				name: 'DCC-EX Version',
				variableId: 'version',
			},
			{
				name: 'Power Status',
				variableId: 'power',
			},
			{
				name: 'Selected Loco DCC Address',
				variableId: 'locoAddress',
			},
			// {
			// 	name: 'Throttle Direction',
			// 	variableId: 'throttleDirection',
			// },
		]

		this.createSpeedTable()
		this.updateActions()
		this.setVariableDefinitions(this.variables)
		this.updateFeedbacks()
		this.updatePresets()

		this.initTCP()
	}

	async configUpdated(config) {
		console.log('configUpdated')

		let resetConnection = false

		if (this.config.host != config.host) {
			resetConnection = true
		}

		this.config = config

		this.updateActions()
		this.setVariableDefinitions(this.variables)
		this.updateFeedbacks()
		this.updatePresets()

		if (resetConnection === true || this.socket === undefined) {
			this.initTCP()
		}
	}

	initTCP() {
		console.log('initTCP ' + this.config.host + ':' + this.config.port)
		console.log

		this.receiveBuffer = ''

		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		if (this.config.host) {
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.socket.on('status_change', (status, message) => {
				this.updateStatus(status, message)
			})

			this.socket.on('error', (err) => {
				console.log('Network error', err)
				this.log('error', 'Network error: ' + err.message)
				this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
				// this.poll = false
			})

			this.socket.on('connect', () => {
				this.log('info', 'Connected')
				this.socket.receivebuffer = ''
				// get command station status
				this.sendCmd('<s>')
				// poll every second
				// this.poll = true
				// this.timer = setInterval(this.dataPoller.bind(this), 1000)
			})

			// separate buffered stream into lines with responses
			this.socket.on('data', (chunk) => {
				var i = 0
				var line = ''
				var offset = 0

				// console.log("incomming:" + chunk)

				this.socket.receivebuffer += chunk

				// console.log("buffer:" + this.socket.receivebuffer)
				// console.log('indexof:' + this.socket.receivebuffer.indexOf('\n'))

				while ((i = this.socket.receivebuffer.indexOf('\n', offset)) !== -1) {
					// console.log(i)
					// console.log(offset)
					// console.log('index of ' + this.socket.receivebuffer.indexOf('\n', offset))
					line = this.socket.receivebuffer.substr(offset, i - offset)
					// console.log(line)
					offset = i + 1
					this.socket.emit('receiveline', line.toString())
				}
				this.socket.receivebuffer = this.socket.receivebuffer.substr(offset)
			})

			this.socket.on('receiveline', (line) => {
				// console.log('receiveline: ' + line)
				this.processDeviceInformation(line)
			})
		}
	}

	processDeviceInformation(line) {
		this.log('debug', 'process: ' + line)

		// strip < from start and > from end
		line = line.replace('<', '')
		line = line.replace('>', '')

		if (line.length > 0) {
			switch (line.substr(0, 1)) {
				// examine first character only
				case 'H': {
					// defined turnouts/Points
					break
				}
				case 'i': {
					// command station info
					this.log('info', line.substr(1).trim())
					let infoArr = line.substr(1).split('/')
					this.setVariableValues({ version: infoArr[0].trim() })
					this.setVariableValues({ model: infoArr[1].trim() })
					this.setVariableValues({ motor: infoArr[2].trim() })
					break
				}
				case 'l': {
					// loco data broadcast
					this.updateLocoData(line)
					this.checkFeedbacks('functionFeedback')
					break
				}
				case 'p': {
					// power status broadcast
					this.powerState = line.substr(1).trim()
					this.setVariableValues({ power: this.powerState })
					this.checkFeedbacks('powerFeedback')
					this.checkFeedbacks('joinFeedback')
					break
				}
				case 'q': {
					// defined sensors
					break
				}
				case 'Q': {
					// defined sensors
					break
				}
				case 'X': {
					// nothing defined
					this.log('info', 'Command failed')
					break
				}
				default: {
					this.log('debug', line)
				}
			}
		}
	}

	updateLocoData(rawData) {
		//  <l cab reg speedByte functMap>
		var locoArr = rawData.split(' ')
		var locoVariableKey = 'locoThrottle_' + locoArr[1]

		var speedText = this.decodeSpeedByte(locoArr[3])

		// find loco in array and try to update
		for (var i = 0; i < this.locos.length; i++) {
			if (this.locos[i].address === locoArr[1]) {
				// update existing
				this.locos[i].speedByte = locoArr[3]
				this.locos[i].speed = speedText
				this.locos[i].function = locoArr[4]
				this.setVariableValues({ [locoVariableKey]: speedText })
				// console.log(this.locos)
				return
			}
		}

		// or if not found add new
		var newLoco = { address: locoArr[1], speedByte: locoArr[3], speed: speedText, function: locoArr[4] }
		this.locos.push(newLoco)
		// console.log(this.locos)

		this.variables.push({
			name: 'Loco ' + locoArr[1] + ' Throttle',
			variableId: 'locoThrottle_' + locoArr[1],
		})

		// console.log(this.variables)

		this.setVariableDefinitions(this.variables)
		this.setVariableValues({ [locoVariableKey]: speedText })
	}

	decodeSpeedByte(value) {
		console.log('decode: ' + value)
		var index = Number(value)
		return this.speedTable[index].text
	}

	createSpeedTable() {
		this.speedTable[0] = { index: 0, speed: 0, speedSet: 0, dir: 0, text: '0 Reverse (Idle)' }
		this.speedTable[1] = { index: 1, speed: -1, speedSet: 1, dir: 0, text: 'Stop' }
		for (var j = 2; j < 128; j++) {
			this.speedTable[j] = { index: j, speed: j - 1, speedSet: j, dir: 0, text: [j - 1] + ' Reverse' }
		}

		this.speedTable[128] = { index: 128, speed: 0, speedSet: 0, dir: 1, text: '0 Forward (Idle)' }
		this.speedTable[129] = { index: 129, speed: -1, speedSet: 1, dir: 1, text: 'Stop' }

		for (var k = 130; k < 256; k++) {
			this.speedTable[k] = { index: k, speed: k - 129, speedSet: k - 128, dir: 1, text: [k - 129] + ' Forward' }
		}

		// for (var i = 0; i < this.speedTable.length; i++) {
		//	console.log(this.speedTable[i])
		// }
	}

	sendCmd(cmd) {
		this.log('debug', 'sending: ' + cmd)

		cmd = unescape(cmd)
		var end = '\r'

		var sendBuf = Buffer.from(cmd + end, 'latin1')

		if (sendBuf !== undefined) {
			// this.log('info','sending ',sendBuf,'to',self.config.host);

			if (this.socket !== undefined) {
				this.socket.send(sendBuf)
			} else {
				this.log('warn', 'Socket not connected')
			}
		}
	}
}

runEntrypoint(DCCEX, [])
