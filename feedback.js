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
				id: 'powerState',
				default: '1',
				choices: [
					{ id: '1', label: 'Power On' },
					{ id: '0', label: 'Power Off' }, 
				],
			},
		],
	}
	
	this.setFeedbackDefinitions(feedbacks)
}

// instance.prototype.feedback = function (event, bank) {
// 	var self = this
// 	
// 	console.log('checking feedback: ' + event.type)
// 	
// 	switch (event.type) {
// 		case 'powerFeedback': {
// 			console.log(self.powerState + ' ' + event.options.powerState)
// 			if (self.powerState === event.options.powerState) {
// 				return {
// 					color: event.options.fg,
// 					bgcolor: event.options.bg,
// 				}
// 			}
// 			break
// 		}
// 	}
// }