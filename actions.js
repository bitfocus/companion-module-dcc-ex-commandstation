export function updateActions() {
	let actions = {}

	actions['power'] = {
		name: 'Power Control',
		options: [
			{
				type: 'dropdown',
				label: 'Power Control',
				id: 'power',
				default: '0',
				choices: [
					{ id: '1 MAIN', label: 'On Main' },
					{ id: '1 PROG', label: 'On Prog' },
					{ id: '1 JOIN', label: 'On Join' },
					{ id: '1', label: 'On Both Tracks' },
					{ id: '0 MAIN', label: 'Off Main' },
					{ id: '0 PROG', label: 'Off Prog' },
					// { id: '0 JOIN', label: 'Off Join' }, not implemented?
					{ id: '0', label: 'Off Both Tracks' },
				],
			},
		],
		callback: ({ options }) => {
			var cmd = '<' + options.power + '>'
			this.sendCmd(cmd)
		},
	}

	actions['stop'] = {
		name: 'Emergency Stop',
		options: [],
		callback: () => {
			var cmd = '<!>'
			this.sendCmd(cmd)
		},
	}

	actions['reset'] = {
		name: 'Reset Command Station',
		options: [],
		callback: () => {
			var cmd = '<D RESET>'
			this.sendCmd(cmd)
		},
	}

	actions['throttle'] = {
		name: 'Throttle',
		options: [
			{
				type: 'textinput',
				label: 'DCC Address',
				id: 'address',
				default: 3,
				useVariables: true,
				tooltip:
					'Use $(' +
					this.label +
					':locoAddress) if you want to change the DCC address using a separate select loco action button',
			},
			{
				type: 'number',
				label: 'Speed',
				id: 'speed',
				default: 0,
				min: 0,
				max: 126,
			},
			{
				type: 'dropdown',
				label: 'Direction',
				id: 'direction',
				default: '1',
				choices: [
					{ id: '1', label: 'Forward' },
					{ id: '0', label: 'Reverse' },
				],
			},
		],
		callback: async (action, context) => {
			var dcc = await context.parseVariablesInString(action.options.address)
			if (Number(dcc) > 0 && Number(dcc) < 10294) {
				var cmd = '<t ' + dcc + ' ' + action.options.speed + ' ' + action.options.direction + '>'
				this.sendCmd(cmd)
			} else {
				this.log('warn', dcc + ' is not a valid DCC address')
			}
		},
	}

	actions['direction'] = {
		name: 'Throttle Direction',
		options: [
			{
				type: 'textinput',
				label: 'DCC Address',
				id: 'address',
				default: 3,
				useVariables: true,
				tooltip:
					'Use $(' +
					this.label +
					':locoAddress) if you want to change the DCC address using a separate select loco action button',
			},
			{
				type: 'dropdown',
				label: 'Direction',
				id: 'direction',
				default: 1,
				choices: [
					{ id: 1, label: 'Forward' },
					{ id: 0, label: 'Reverse' },
					{ id: 2, label: 'Toggle' },
				],
			},
		],
		callback: async (action, context) => {
			var dcc = await context.parseVariablesInString(action.options.address)
			var currentSpeed = undefined
			var currentDirection = undefined
			var newDirection = undefined

			if (Number(dcc) > 0 && Number(dcc) < 10294) {
				for (var i = 0; i < this.locos.length; i++) {
					if (this.locos[i].address == dcc) {
						currentSpeed = this.speedTable[Number(this.locos[i].speedByte)].speed
						currentDirection = this.speedTable[Number(this.locos[i].speedByte)].dir
						// console.log('currentSpeed: ' + currentSpeed)
						// console.log('currentDirection: ' + currentDirection)
					}
					if (currentSpeed == -1) {
						// stopped
						return
					}
				}
				if (action.options.direction == 2) {
					// toggle
					newDirection = currentDirection ? 0 : 1
				} else {
					newDirection = action.options.direction
				}
				var cmd = '<t ' + dcc + ' ' + currentSpeed + ' ' + newDirection + '>'
				this.sendCmd(cmd)
			} else {
				this.log('warn', dcc + ' is not a valid DCC address')
			}
		},
	}

	actions['throttleRotary'] = {
		name: 'Throttle Speed (Rotary)',
		options: [
			{
				type: 'textinput',
				label: 'DCC Address',
				id: 'address',
				default: 3,
				useVariables: true,
				tooltip:
					'Use $(' +
					this.label +
					':locoAddress) if you want to change the DCC address using a separate select loco action button',
			},
			{
				type: 'number',
				label: 'Step',
				id: 'step',
				default: 1,
				min: 1,
				max: 10,
				tooltip: 'Adjust throttle speed by this number',
			},
			{
				type: 'dropdown',
				label: 'Direction',
				id: 'direction',
				default: 1,
				choices: [
					{ id: 1, label: 'Increment (rotate right)' },
					{ id: 0, label: 'Decrement (rotate left)' },
				],
			},
		],
		callback: async (action, context) => {
			var dcc = await context.parseVariablesInString(action.options.address)
			var newSpeed = undefined
			var newDirection = undefined
			var newIndex = undefined

			if (Number(dcc) > 0 && Number(dcc) < 10294) {
				// console.log(this.locos)
				for (var i = 0; i < this.locos.length; i++) {
					// console.log(this.locos[i].address)
					if (this.locos[i].address == dcc) {
						var currentIndex = Number(this.locos[i].speedByte)

						console.log('currentIndex: ' + this.locos[i].speedByte)

						if (action.options.direction == 1) {
							// increment turn right
							if (currentIndex == 127 || currentIndex == 255) {
								// maximum for increase throttle
								newIndex = currentIndex
							} else if (currentIndex == 128) {
								// skip 129
								newIndex = 130
							} else if (currentIndex == 0) {
								// skip
								newIndex = 2
							} else {
								// increase
								newIndex = currentIndex + action.options.step
							}
						}

						if (action.options.direction == 0) {
							// decrement turn left
							if (currentIndex == 0 || currentIndex == 128 || currentIndex == 129) {
								// minimum for decrease throttle
								newIndex = currentIndex
							} else if (currentIndex == 130) {
								// skip 129
								newIndex = 128
							} else if (currentIndex == 2) {
								// skip 1
								newIndex = 0
							} else {
								// decrease
								newIndex = currentIndex - action.options.step
							}
						}

						if (newIndex == 1) {
							// exclude stop
							newIndex = 0
						}

						if (newIndex == 129) {
							// exclude stop
							newIndex = 128
						}

						newIndex = clamp(newIndex, 0, 255)

						console.log('newIndex:' + newIndex)
						newSpeed = this.speedTable[newIndex].speed
						newDirection = this.speedTable[newIndex].dir

						console.log('newSpeed: ' + newSpeed)
						console.log('newDirection: ' + newDirection)
					}
				}
				if (newSpeed != undefined && newDirection != undefined) {
					var cmd = '<t ' + dcc + ' ' + newSpeed + ' ' + newDirection + '>'
					this.sendCmd(cmd)
				} else {
					this.log('warn', 'Unable to adjust speed')
				}
			} else {
				this.log('warn', dcc + ' is not a valid DCC address')
			}
		},
	}

	actions['function'] = {
		name: 'Decoder Function',
		options: [
			{
				type: 'textinput',
				label: 'DCC Address',
				id: 'address',
				default: 3,
				useVariables: true,
				tooltip:
					'Use $(' +
					this.label +
					':locoAddress) if you want to change the DCC address using a separate select loco action button',
			},
			{
				type: 'number',
				label: 'Function',
				id: 'decoderFunction',
				default: 0,
				min: 0,
				max: 68,
			},
			{
				type: 'checkbox',
				label: 'State',
				id: 'functionState',
				default: false,
			},
		],
		callback: async (action, context) => {
			var dcc = await context.parseVariablesInString(action.options.address)
			if (Number(dcc) > 0 && Number(dcc) < 10294) {
				var cmd = '<F ' + dcc + ' ' + action.options.decoderFunction + ' ' + Number(action.options.functionState) + '>'
				this.sendCmd(cmd)
			} else {
				this.log('warn', dcc + ' is not a valid DCC address')
			}
		},
	}

	actions['accessorySubAddress'] = {
		name: 'Accessory (address and sub-address)',
		options: [
			{
				type: 'number',
				label: 'Address',
				id: 'address',
				default: 0,
				min: 0,
				max: 511,
			},
			{
				type: 'number',
				label: 'Sub-Address',
				id: 'subAddress',
				default: 0,
				min: 0,
				max: 3,
			},
			{
				type: 'checkbox',
				label: 'State',
				id: 'functionState',
				default: false,
			},
		],
		callback: ({ options }) => {
			var cmd = '<a ' + options.address + ' ' + options.subAddress + ' ' + Number(options.functionState) + '>'
			this.sendCmd(cmd)
		},
	}

	actions['accessoryLinear'] = {
		name: 'Accessory (linear address)',
		options: [
			{
				type: 'number',
				label: 'Address',
				id: 'address',
				default: 1,
				min: 1,
				max: 2044,
				useVariables: true,
			},
			{
				type: 'checkbox',
				label: 'State',
				id: 'functionState',
				default: false,
			},
		],
		callback: ({ options }) => {
			var cmd = '<a ' + options.address + ' ' + Number(options.functionState) + '>'
			this.sendCmd(cmd)
		},
	}

	actions['turnout'] = {
		name: this.config.region + ' Control',
		options: [
			{
				type: 'number',
				label: 'Address',
				id: 'address',
				default: 0,
				min: 0,
				max: 32767,
				useVariables: false,
			},
			{
				type: 'dropdown',
				label: 'State',
				id: 'state',
				default: 1,
				choices: [
					{ id: 1, label: 'Throw' },
					{ id: 0, label: 'Close' },
				],
			},
		],
		callback: ({ options }) => {
			var cmd = '<T ' + options.address + ' ' + options.state + '>'
			this.sendCmd(cmd)
		},
	}

	actions['locoSelect'] = {
		name: 'Set Loco Address Variable',
		options: [
			{
				type: 'dropdown',
				label: 'Loco address variable (A, B, C, D)',
				id: 'loco',
				default: 'A',
				choices: [
					{ id: 'A', label: 'A' },
					{ id: 'B', label: 'B' },
					{ id: 'C', label: 'C' },
					{ id: 'D', label: 'D' },
				],
			},
			{
				type: 'number',
				label: 'DCC address for currently selected loco variable',
				id: 'address',
				default: 3,
				min: 1,
				max: 10293,
			},
		],
		callback: ({ options }) => {
			this.setVariableValues({ ['locoAddress_' + options.loco]: options.address })
			// request update on selected loco status
			this.sendCmd('<t ' + options.address + '>')
			this.checkFeedbacks('addressFeedback')
		},
	}

	actions['custom'] = {
		name: 'Custom Command',
		options: [
			{
				type: 'textinput',
				label: 'Custom command string',
				id: 'customCommand',
			},
		],
		callback: ({ options }) => {
			var cmd = options.customCommand
			this.sendCmd(cmd)
		},
	}

	this.setActionDefinitions(actions)

	function clamp(val, min, max) {
		// limit val between min and max
		return val > max ? max : val < min ? min : val
	}
}
