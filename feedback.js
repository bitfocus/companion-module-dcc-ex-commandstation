import { combineRgb } from '@companion-module/base'

export function updateFeedbacks() {
	let feedbacks = {}

	feedbacks['powerFeedback'] = {
		type: 'boolean',
		name: 'Track Power Status',
		description: 'Indicates track power state',
		defaultSyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(0, 204, 0),
		},
		options: [
			{
				type: 'dropdown',
				label: 'Power State',
				id: 'feedbackPowerState',
				default: '1',
				choices: [
					{ id: '1 MAIN', label: 'Main Power On' },
					{ id: '1 PROG', label: 'Prog Power On' },
					{ id: '1', label: 'Both Power On' },
				],
			},
		],
		callback: ({ options }) => {
			if (this.powerState === options.feedbackPowerState || this.powerState === '1') {
				return true
			} else {
				return false
			}
		},
	}

	feedbacks['joinFeedback'] = {
		type: 'boolean',
		name: 'Track Join Status',
		description: 'Indicates track join state',
		defaultSyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(0, 204, 0),
		},
		options: [],
		callback: () => {
			if (this.powerState === '1 JOIN') {
				return true
			} else {
				return false
			}
		},
	}

	feedbacks['addressFeedback'] = {
		type: 'boolean',
		name: 'Selected Loco',
		description: 'Indicates selected loco DCC address',
		defaultSyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(0, 204, 0),
		},
		options: [
			{
				type: 'number',
				label: 'Set DCC address for currently selected loco feedback',
				id: 'feedbackAddress',
				default: 3,
				min: 1,
				max: 10293,
			},
		],
		callback: ({ options }) => {
			if (this.getVariableValue('locoAddress') == options.feedbackAddress) {
				return true
			} else {
				return false
			}
		},
	}

	feedbacks['functionFeedback'] = {
		type: 'boolean',
		name: 'Enabled Function',
		description: 'Indicates loco decoder function state',
		defaultSyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(0, 204, 0),
		},
		options: [
			{
				type: 'textinput',
				label: 'DCC Address',
				id: 'feedbackAddress',
				default: 3,
				useVariables: true,
				tooltip:
					'Use $(' +
					this.label +
					':locoAddress) if you want to change the DCC address using a separate select loco action button',
			},
			{
				type: 'number',
				label: 'Set function number feedback',
				id: 'feedbackFunction',
				default: 0,
				min: 0,
				max: 68,
			},
		],
		callback: async (feedback, context) => {
			var dcc = await context.parseVariablesInString(feedback.options.feedbackAddress)
			if (Number(dcc) > 0 && Number(dcc) < 10294) {
				// console.log('checking... ' + options.feedbackAddress + ' ' + options.feedbackFunction)
				for (var i = 0; i < this.locos.length; i++) {
					// console.log(this.locos[i].address)
					if (this.locos[i].address == dcc) {
						// calculate 2 ^ feedback function number
						var feedbackFunctionBin = 2 ** feedback.options.feedbackFunction
						// console.log(feedbackFunctionBin)
						// console.log(this.locos[i].function)
						// bitwise AND to compare values
						if ((this.locos[i].function & feedbackFunctionBin) != 0) {
							return true
						}
					}
				}
			}
		},
	}

	feedbacks['turnoutFeedback'] = {
		type: 'boolean',
		name: 'Turnout/Point Status',
		description: 'Indicates turnout/point state',
		defaultSyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(0, 204, 0),
		},
		options: [
			{
				type: 'number',
				label: 'Set turnout/point number feedback',
				id: 'turnoutId',
				default: 0,
				min: 0,
				max: 32767,
			},
		],
		callback: ({ options }) => {
			for (var j = 0; j < this.turnouts.length; j++) {
				if (this.turnouts[j].id == options.turnoutId) {
					if (this.turnouts[j].state == 1) {
						return true
					} else {
						return false
					}
				}
			}
		},
	}

	this.setFeedbackDefinitions(feedbacks)
}
