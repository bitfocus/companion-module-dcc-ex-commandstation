export function updateActions() {
	let actions = {}

	actions['power'] = {
		name: 'Track Power Control',
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
				max: 127,
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

	actions['locoSelect'] = {
		name: 'Set Loco Address',
		options: [
			{
				type: 'number',
				label: 'Set DCC address for currently selected loco variable',
				id: 'address',
				default: 3,
				min: 1,
				max: 10293,
			},
		],
		callback: ({ options }) => {
			this.setVariableValues({ locoAddress: options.address })
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
}

// 		'direction': {
// 			label: 'Direction Preset',
// 			options: [
// 				{
// 					type: 'dropdown',
// 					label: 'Direction',
// 					id: 'direction_preset',
// 					default: '1',
// 					choices: [
// 					{ id: '1', label: 'Forward'},
// 					{ id: '0', label: 'Reverse'},
// 					{ id: 'toggle', label: 'Toggle'}]
// 				}
// 			]
// 		},

// 		'info': {
// 			label: 'Get State',
// 			options: [
// 				{
// 				type: 'dropdown',
// 				label: 'Information to display in Companion log',
// 				id: 'infoCommand',
// 				default: 'c',
// 				choices: [
// 					{ id: 'c', label: 'Show main track current'},
// 					{ id: 's', label: 'Show command station status'},
// 					{ id: 'Q', label: 'List status of all sensors'},
// 					{ id: 'S', label: 'List all defined sensors'},
// 					{ id: 'T', label: 'List all defined turnouts'},
// 					{ id: 'Z', label: 'List all defined output pins'},
// 					]
// 				}
// 			]
// 		},

// 	});
// };
//
// 	switch (action.action) {
//

// 		case 'direction': {
//
// 			if (opt.direction_preset === 'toggle') {
// 				self.direction = self.direction ? 0 : 1
// 			} else {
// 				self.direction = opt.direction_preset
// 			}
// 			self.setVariable('DirectionPst',self.direction)
// 			console.log('direction preset: ' + self.direction)
// 		}
// 		case 'throttle': {
//
// 			if (opt.direction === 'pst') {
// 				self.sendCmd('<t 1 ' + opt.dccAddress + ' ' + opt.speed + ' ' + self.direction + '>')
// 				console.log('throttle: ' + opt.dccAddress + ' ' + opt.speed + ' ' + self.direction)
// 			} else {
// 				self.sendCmd('<t 1 ' + opt.dccAddress + ' ' + opt.speed + ' ' + opt.direction + '>')
// 				console.log('throttle: ' + opt.dccAddress + ' ' + opt.speed + ' ' + opt.direction)
// 			}
// 			break
// 		}

// 		case 'info': {
// 			console.log('info: ' + opt.infoCommand)
// 			self.sendCmd('<' + opt.infoCommand + '>')
// 			break
// 		}
