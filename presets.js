import { combineRgb } from '@companion-module/base'

export function updatePresets() {
	let presets = {}
	let tracks = {}

	tracks['main'] = { preset: 'Main Power', name: 'Main Power On & Off', label: 'Main On', on: '1 MAIN', off: '0 MAIN' }
	tracks['prog'] = { preset: 'Prog Power', name: 'Prog Power On & Off', label: 'Prog On', on: '1 PROG', off: '0 PROG' }

	for (let x in tracks) {
		presets[tracks[x].preset] = {
			type: 'button',
			category: 'Power',
			name: tracks[x].name,
			style: {
				text: tracks[x].label,
				size: '24',
				bgcolor: combineRgb(0, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			steps: [
				{
					down: [
						{
							actionId: 'power',
							options: {
								power: tracks[x].on,
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'power',
							options: {
								power: tracks[x].off,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'powerFeedback',
					options: {
						feedbackPowerState: tracks[x].on,
					},
					style: {
						bgcolor: combineRgb(0, 128, 0),
						color: combineRgb(255, 255, 255),
					},
				},
			],
		}
	}

	presets['All Stop'] = {
		type: 'button',
		category: 'Loco',
		name: 'All Stop',
		style: {
			text: 'All Stop',
			size: '24',
			bgcolor: combineRgb(128, 0, 0),
			color: combineRgb(255, 255, 255),
		},
		steps: [
			{
				down: [
					{
						actionId: 'stop',
						options: {},
					},
				],
				up: [],
			},
		],
	}

	this.setPresetDefinitions(presets)
}
