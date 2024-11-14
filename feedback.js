import { combineRgb } from '@companion-module/base'

export function updateFeedbacks() {
	let feedbacks = {}

	feedbacks['powerFeedback'] = {
		type: 'boolean',
		name: 'Track Power Status',
		description: 'Change background colour on track power state',
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
			// console.log('checking ' + this.powerState + ' ' + options.feedbackPowerState)
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
		description: 'Change background colour on track join state',
		defaultSyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(0, 204, 0),
		},
		options: [],
		callback: ({ options }) => {
			console.log('checking ' + this.powerState + ' ' + options.feedbackJoinState)
			if (this.powerState === '1 JOIN') {
				return true
			} else {
				return false
			}
		},
	}

	this.setFeedbackDefinitions(feedbacks)
}
