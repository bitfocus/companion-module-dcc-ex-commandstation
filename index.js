import { InstanceBase, InstanceStatus, Regex, runEntrypoint, TCPHelper } from '@companion-module/base'
import { updateActions } from './actions.js'
import { updateVariables } from './variables.js'
import { updateFeedbacks } from './feedback.js'
import { updatePresets } from './presets.js'

class DCCEX extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.updateActions = updateActions.bind(this)
		this.updateFeedbacks = updateFeedbacks.bind(this)
		this.updatePresets = updatePresets.bind(this)
		this.updateVariables = updateVariables.bind(this)
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
			{
				type: 'checkbox',
				id: 'debuglog',
				label: 'Show all return values in debug log',
				width: 6,
				default: false,
			},
		]
	}

	async destroy() {
		debug('destroy', this.id)

		var self = this

		if (self.socket !== undefined) {
			self.socket.destroy()
		}
	}

	async init(config) {
		console.log('init ' + this.label)

		this.config = config

		this.stash = []
		this.locos = []
		this.powerState = null

		this.updateActions()
		this.updateVariables()
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
		this.updateVariables()
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
				// get command station status
				this.sendCmd('<s>')
				// poll every second
				// this.poll = true
				// this.timer = setInterval(this.dataPoller.bind(this), 1000)
			})

			// separate buffered stream into lines with responses
			this.socket.on('data', (chunk) => {
				// this.log('debug', 'receiving: ' + chunk)

				var i = 0,
					line = '',
					offset = 0
				this.receiveBuffer += chunk

				while ((i = this.receiveBuffer.indexOf('\n', offset)) !== -1) {
					line = this.receiveBuffer.substr(offset, i - offset)
					offset = i + 1
				}

				this.receiveBuffer = this.receiveBuffer.substr(offset)
			})

			this.socket.on('receiveline', (line) => {
				// if (this.command === null && line.match(/:/)) {
				// 				this.command = line
				// 			} else if (this.command !== null && line.length > 0) {
				// 				this.stash.push(line.trim())
				// 			} else if (line.length === 0 && this.command !== null) {
				// 				var cmd = this.command.trim().split(/:/)[0]
				// 				var obj = {}
				// 				this.stash.forEach(function (val) {
				// 					var info = val.split(/\s*:\s*/)
				// 					obj[info.shift()] = info.join(':')
				// 				})
				//
				this.processDeviceInformation(line)

				// 	this.stash = []
				// 	this.command = null
				// } else if (line.length > 0) {
				// 	console.log('weird response from device: ' + line.toString() + ' ' + line.length)
				// }
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
				case 'i': {
					// command station info
					this.log('info', line.substr(1).trim())
					let infoArr = line.substr(1).split('/')
					this.setVariableValues({ version: infoArr[0] })
					this.setVariableValues({ model: infoArr[1] })
					this.setVariableValues({ motor: infoArr[2] })
					break
				}
				case 'l': {
					// loco data broadcast
					let locoArr = line.split(' ')
					console.log(locoArr)
					this.locos.push(locoArr)
					console.log(this.locos)
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
				case 'X': {
					// nothing defined
					this.log('info', 'No data found')
					break
				}
			}
		}
	}

	// 	self.status(self.STATE_WARNING, 'Connecting');
	//
	// 	var options = { reconnect_interval: 5000 }
	//
	// 	if (self.config.host) {
	// 		self.socket = new tcp(self.config.host, self.config.port, options);
	//
	// 		self.socket.on('status_change', function (status, message) {
	// 			console.log(message)
	// 			self.status(status, message);
	// 		});
	//
	// 		self.socket.on('error', function (err) {
	// 			console.log('Network error', err);
	// 			self.status(self.STATE_ERROR, err);
	// 			self.log('error','Network error: ' + err.message);
	// 		});
	//
	// 		self.socket.on('connect', function () {
	// 			self.status(self.STATE_OK);
	// 			console.log('Connected');
	//
	// 			self.sendCmd('<s>')
	// 		})
	//
	// 		self.socket.on('data', function (chunk) {
	// 			console.log('DCC Received ' + chunk.length + ' bytes ', chunk)
	//
	// 			var i = 0, line = '', offset = 0;
	// 			receivebuffer += chunk;
	//
	// 			// Split up Lines with new line and Process
	// 			while ( (i = receivebuffer.indexOf('\n', offset)) !== -1) {
	// 				line = receivebuffer.substr(offset, i - offset)
	// 				offset = i + 1
	// 				console.log(line.toString())
	// 				line = line.replace('<','')
	// 				line = line.replace('>','')
	// 				if (self.config.debuglog === true) {
	// 					self.log('debug','Received: ' + line)
	// 				}
	// 				self.socket.emit('receiveline', line.toString())
	// 			}
	// 			receivebuffer = receivebuffer.substr(offset)
	// 		});
	//
	// 		self.socket.on('receiveline', function (line) {
	// 			if (line.length > 0)
	// 			{
	// 				switch (line.substr(0,1))
	// 				{



	// 					case 'Q': {
	// 						// sensors
	// 						self.log('info','Sensor: ' + line.trim())
	// 						break;
	// 					}
	// 					case 'q': {
	// 						// sensors
	// 						self.log('info','Sensor: ' + line.trim())
	// 						break;
	// 					}
	// 					case 'H': {
	// 						// turnouts
	// 						self.log('info','Turnout: ' + line.trim())
	// 						break;
	// 					}
	// 					case 'Y': {
	// 						// output pins
	// 						self.log('info','Output: ' + line.trim())
	// 						break;
	// 					}
	// 					case 'c': {
	// 						// track current
	// 						self.log('info',line.substr(1).trim())
	// 						break;
	// 					}
	// 					default:
	// 						break;
	// 				}
	// 			}
	// 		});
	// 	}

	sendCmd(cmd) {
		this.log('debug', 'sending: ' + cmd)

		var cmd = unescape(cmd)
		var end = '\r'

		/*
		 * create a binary buffer pre-encoded 'latin1' (8bit no change bytes)
		 * sending a string assumes 'utf8' encoding
		 * which then escapes character values over 0x7F
		 * and destroys the 'binary' content
		 */
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
