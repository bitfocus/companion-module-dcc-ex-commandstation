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
		callback: (feedback) => {
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

	this.setFeedbackDefinitions(feedbacks)
}
