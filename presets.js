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

	for (let j = 0; j <= 68; j++) {
		presets['F' + j] = {
			type: 'button',
			category: 'Decoder Function',
			name: 'Button to toggle F' + j,
			style: {
				text: 'F' + j,
				size: '24',
				bgcolor: combineRgb(0, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			steps: [
				{
					down: [
						{
							actionId: 'function',
							options: {
								address: '$(' + this.label + ':locoAddress)',
								decoderFunction: j,
								functionState: true,
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'function',
							options: {
								address: '$(' + this.label + ':locoAddress)',
								decoderFunction: j,
								functionState: false,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'functionFeedback',
					options: {
						feedbackAddress: '$(' + this.label + ':locoAddress)',
						feedbackFunction: j,
					},
					style: {
						bgcolor: combineRgb(255, 255, 192),
						color: combineRgb(255, 255, 255),
					},
				},
			],
		}
	}

	for (let k = 0; k <= 9; k++) {
		presets['TurnoutThrow' + k] = {
			type: 'button',
			category: this.config.region + 's',
			name: 'Throw ' + this.config.region + ' ' + k,
			style: {
				text: 'Throw ' + k,
				size: '18',
				bgcolor: combineRgb(0, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			steps: [
				{
					down: [
						{
							actionId: 'turnout',
							options: {
								address: k,
								state: 1,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'turnoutFeedback',
					options: {
						turnoutId: k,
						state: 1,
					},
					style: {
						bgcolor: combineRgb(64, 64, 255),
						color: combineRgb(255, 255, 255),
					},
				},
			],
		}
	}

	for (let k = 0; k <= 9; k++) {
		presets['TurnoutClose' + k] = {
			type: 'button',
			category: this.config.region + 's',
			name: 'Close ' + this.config.region + ' ' + k,
			style: {
				text: 'Close ' + k,
				size: '18',
				bgcolor: combineRgb(0, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			steps: [
				{
					down: [
						{
							actionId: 'turnout',
							options: {
								address: k,
								state: 0,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'turnoutFeedback',
					options: {
						turnoutId: k,
						state: 0,
					},
					style: {
						bgcolor: combineRgb(64, 64, 255),
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

	presets['Toggle Direction'] = {
		type: 'button',
		category: 'Loco',
		name: 'Toggle Direction',
		style: {
			text: '\u{23EA}\u{23E9}',
			size: '30',
			bgcolor: combineRgb(0, 0, 0),
			color: combineRgb(255, 255, 255),
		},
		steps: [
			{
				down: [
					{
						actionId: 'direction',
						options: {
							address: '$(' + this.label + ':locoAddress)',
							direction: 2,
						},
					},
				],
				up: [],
			},
		],
	}

	presets['Forward Direction'] = {
		type: 'button',
		category: 'Loco',
		name: 'Forward Direction',
		style: {
			text: '\u{23E9}',
			size: '30',
			bgcolor: combineRgb(0, 0, 0),
			color: combineRgb(255, 255, 255),
		},
		steps: [
			{
				down: [
					{
						actionId: 'direction',
						options: {
							address: '$(' + this.label + ':locoAddress)',
							direction: 1,
						},
					},
				],
				up: [],
			},
		],
	}

	presets['Reverse Direction'] = {
		type: 'button',
		category: 'Loco',
		name: 'Reverse Direction',
		style: {
			text: '\u{23EA}',
			size: '30',
			bgcolor: combineRgb(0, 0, 0),
			color: combineRgb(255, 255, 255),
		},
		steps: [
			{
				down: [
					{
						actionId: 'direction',
						options: {
							address: '$(' + this.label + ':locoAddress)',
							direction: 0,
						},
					},
				],
				up: [],
			},
		],
	}

	presets['Throttle (Rotary Control)'] = {
		type: 'button',
		category: 'Loco',
		name: 'Throttle (Rotary Control)',
		options: {
			rotaryActions: true,
		},
		style: {
			text: '\u{1F501}',
			size: 'auto',
			bgcolor: combineRgb(0, 0, 0),
			color: combineRgb(255, 255, 255),
		},
		steps: [
			{
				down: [
					{
						actionId: 'direction',
						options: {
							address: '$(' + this.label + ':locoAddress)',
							direction: 2,
						},
					},
				],
				up: [],
				rotate_left: [
					{
						actionId: 'throttleRotary',
						options: {
							address: '$(' + this.label + ':locoAddress)',
							step: 1,
							direction: 0,
						},
					},
				],
				rotate_right: [
					{
						actionId: 'throttleRotary',
						options: {
							address: '$(' + this.label + ':locoAddress)',
							step: 1,
							direction: 1,
						},
					},
				],
			},
		],
	}

	this.setPresetDefinitions(presets)
}
