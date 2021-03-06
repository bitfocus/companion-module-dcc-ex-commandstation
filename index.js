var instance_skel = require('../../instance_skel');
var presets       = require('./presets.js')
var tcp           = require('../../tcp');

var debug;
var log;

function instance(system, id, config) {
	var self = this
	
	self.powerOptions = [
		{ id: '1 MAIN', label: 'On Main'}, 
		{ id: '1 PROG', label: 'On Prog'},
		{ id: '1 JOIN', label: 'On Join'},
		{ id: '1', label: 'On Both'},
		{ id: '!', label: 'All Stop'},
		{ id: '0', label: 'Off'},
		]

	// super-constructor
	instance_skel.apply(this, arguments)

	return self
}

instance.prototype.updateConfig = function (config) {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	self.setVariable('Version',null)
	self.setVariable('Power',null)
	self.setVariable('DirectionPst',self.direction)
	
	self.config = config
	self.init_tcp()
	self.actions()
};

instance.prototype.init = function () {
	var self = this;

	debug = self.debug;
	log = self.log;

	self.setVariableDefinitions( [
		{
			label: 'Command Station Version',
			name: 'Version',
		},
		{
			label: 'Track Power State',
			name: 'Power',
		},
		{
			label: 'Direction Preset',
			name: 'DirectionPst',
		},
	])
	
	self.direction = 0

	// setup
	self.actions()
	self.init_presets()
	self.init_feedbacks()
	self.init_tcp()

};

instance.prototype.init_presets = function () {
	var self = this
	self.setPresetDefinitions(presets.get_presets(self.label))
}

instance.prototype.init_feedbacks = function (system) {
	var self = this
	
	var feedbacks = {}
	
	feedbacks['powerFeedback'] = {
		label: 'Track Power Status',
		description: 'Change background colour on track power state',
		options: [
			{
				type: 'colorpicker',
				label: 'Foreground colour',
				id: 'fg',
				default: self.rgb(255, 255, 255),
			},
			{
				type: 'colorpicker',
				label: 'Background colour',
				id: 'bg',
				default: self.rgb(102, 153, 0),
			},
			{
				type: 'dropdown',
				label: 'Power State',
				id: 'powerState',
				default: '1',
				choices: [
					{ id: '1', label: 'Power On' },
					{ id: '0', label: 'Power Off' }, 
				]
			},
		],
	}
	
	self.setFeedbackDefinitions(feedbacks)
}

instance.prototype.init_tcp = function() {
	var self = this;
	var receivebuffer = '';
	
	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	self.status(self.STATE_WARNING, 'Connecting');

	var options = { reconnect_interval: 5000 }

	if (self.config.host) {
		self.socket = new tcp(self.config.host, self.config.port, options);

		self.socket.on('status_change', function (status, message) {
			console.log(message)
			self.status(status, message);
		});

		self.socket.on('error', function (err) {
			console.log('Network error', err);
			self.status(self.STATE_ERROR, err);
			self.log('error','Network error: ' + err.message);
		});

		self.socket.on('connect', function () {
			self.status(self.STATE_OK);
			console.log('Connected');
			
			self.sendCmd('<s>')
		})

		self.socket.on('data', function (chunk) {
			console.log('DCC Received ' + chunk.length + ' bytes ', chunk)
			
			var i = 0, line = '', offset = 0;
			receivebuffer += chunk;
			
			// Split up Lines with new line and Process
			while ( (i = receivebuffer.indexOf('\n', offset)) !== -1) {
				line = receivebuffer.substr(offset, i - offset)
				offset = i + 1
				console.log(line.toString())
				line = line.replace('<','')
				line = line.replace('>','')
				if (self.config.debuglog === true) {
					self.log('debug','Received: ' + line)
				}
				self.socket.emit('receiveline', line.toString())
			}
			receivebuffer = receivebuffer.substr(offset)
		});
		
		self.socket.on('receiveline', function (line) {
			if (line.length > 0)
			{
				switch (line.substr(0,1))
				{
					case 'X': {
						// nothing defined
						self.log('info','No data found')
						break;
					}
					case 'p': {
						// power status
						self.setVariable('Power',line.substr(1).trim())
						// take only first char (0 or 1)
						self.powerState = line.substr(1,1).trim()
						self.checkFeedbacks('powerFeedback')
						break;
					}
					case 'i': {
						// command station info
						self.log('info',line.substr(1).trim())
						var infoArr = line.substr(1).split('/')
						self.setVariable('Version',infoArr[0].trim())
						break
					}
					case 'Q': {
						// sensors
						self.log('info','Sensor: ' + line.trim())
						break;
					}
					case 'q': {
						// sensors
						self.log('info','Sensor: ' + line.trim())
						break;
					}
					case 'H': {
						// turnouts
						self.log('info','Turnout: ' + line.trim())
						break;
					}
					case 'Y': {
						// output pins
						self.log('info','Output: ' + line.trim())
						break;
					}
					case 'c': {
						// track current
						self.log('info',line.substr(1).trim())
						break;
					}
					default:
						break;
				}
			}
		});
	}
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module is for DCC++EX Command Station (Version 3)'
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Device IP',
			width: 6,
			regex: self.REGEX_IP
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Control port',
			width: 6,
			default: '2560',
			regex: self.REGEX_PORT
		},
		{
			type: 'checkbox',
			id: 'debuglog',
			label: 'Show all return values in debug log',
			width: 6,
			default: false,
		}
	]
};

// When module gets deleted
instance.prototype.destroy = function () {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
	}
};

instance.prototype.feedback = function (event, bank) {
	var self = this
	
	console.log('checking feedback: ' + event.type)
	
	switch (event.type) {
		case 'powerFeedback': {
			console.log(self.powerState + ' ' + event.options.powerState)
			if (self.powerState === event.options.powerState) {
				return {
					color: event.options.fg,
					bgcolor: event.options.bg,
				}
			}
			break
		}
	}
}

instance.prototype.actions = function (system) {
	var self = this;

	self.setActions({
		'power': {
			label: 'Power Control',
			options: [
				{
					type: 'dropdown',
					label: 'Function',
					id: 'selectedFunction',
					default: '0',
					choices: self.powerOptions,
				},
			],
		},
		'direction': {
			label: 'Direction Preset',
			options: [
				{
					type: 'dropdown',
					label: 'Direction',
					id: 'direction_preset',
					default: '1',
					choices: [
					{ id: '1', label: 'Forward'},
					{ id: '0', label: 'Reverse'},
					{ id: 'toggle', label: 'Toggle'}]
				}
			]
		},
		'throttle': {
			label: 'Throttle',
			options: [
				{
					type: 'number',
					label: 'Address',
					id: 'dccAddress',
					min: 1,
					max: 10293,
					default: 3
				},
				{
					type: 'number',
					label: 'Speed',
					id: 'speed',
					min: -1,
					max: 126,
					default: 0
				},
				{
					type: 'dropdown',
					label: 'Direction',
					id: 'direction',
					default: '1',
					choices: [
					{ id: '1', label: 'Forward'},
					{ id: '0', label: 'Reverse'},
					{ id: 'pst', label: 'Preset'}]
				}
			]
		},
		'functions': {
			label: 'Functions',
			options: [
				{
					type: 'number',
					label: 'Address',
					id: 'dccAddress',
					min: 1,
					max: 10293,
					default: 3
				},			
				{
					type: 'number',
					label: 'Function',
					id: 'f',
					min: 0,
					max: 28,
					default: 0
				},
				{
					type: 'checkbox',
					label: 'State',
					id: 'state',
					default: false
				}				
			]
		},
		'accessory': {
			label: 'Accessory',
			options: [
				{
					type: 'number',
					label: 'Address',
					id: 'acAddress',
					min: 0,
					max: 2044,
					default: 0
				},
				{
					type: 'checkbox',
					label: 'State',
					id: 'acState',
					default: false
				}			
			]
		},
		'info': {
			label: 'Get State',
			options: [
				{
				type: 'dropdown',
				label: 'Information to display in Companion log',
				id: 'infoCommand',
				default: 'c',
				choices: [
					{ id: 'c', label: 'Show main track current'},
					{ id: 's', label: 'Show command station status'},
					{ id: 'Q', label: 'List status of all sensors'},
					{ id: 'S', label: 'List all defined sensors'},
					{ id: 'T', label: 'List all defined turnouts'},
					{ id: 'Z', label: 'List all defined output pins'},
					]
				}
			]
		},
		'custom': {
			label: 'Custom',
			options: [
				{
					type: 'textinput',
					label: 'Custom command string excluding start and end brackets',
					id: 'customCommand'
				}
			]
		}
	});
};

instance.prototype.action = function (action) {
	var self = this
	const opt = action.options
	console.log('action: ' + action.action)
	
	switch (action.action) {
		
		case 'power': {
			console.log('power: ' + opt.selectedFunction)
			self.sendCmd('<' + opt.selectedFunction + '>')
			break
		}
		case 'direction': {
			
			if (opt.direction_preset === 'toggle') {
				self.direction = self.direction ? 0 : 1
			} else {
				self.direction = opt.direction_preset
			}
			self.setVariable('DirectionPst',self.direction)
			console.log('direction preset: ' + self.direction)
		}
		case 'throttle': {
			
			if (opt.direction === 'pst') {
				self.sendCmd('<t 1 ' + opt.dccAddress + ' ' + opt.speed + ' ' + self.direction + '>')
				console.log('throttle: ' + opt.dccAddress + ' ' + opt.speed + ' ' + self.direction)
			} else {
				self.sendCmd('<t 1 ' + opt.dccAddress + ' ' + opt.speed + ' ' + opt.direction + '>')
				console.log('throttle: ' + opt.dccAddress + ' ' + opt.speed + ' ' + opt.direction)
			}
			break
		}	
		case 'functions': {
			var fnCmd = opt.dccAddress + ' ' + opt.f + ' ' + Number(opt.state)
			console.log('function: ' + fnCmd)
			self.sendCmd('<F ' + fnCmd + '>')
			break
		}
		case 'accessory': {
			var acCmd = opt.acAddress + ' ' + Number(opt.acState)
			console.log('accessory: ' + acCmd)
			self.sendCmd('<a ' + acCmd + '>')
			break
		}		
		case 'info': {
			console.log('info: ' + opt.infoCommand)
			self.sendCmd('<' + opt.infoCommand + '>')
			break
		}
		case 'custom': {
			console.log('custom: ' + opt.customCommand)
			self.sendCmd('<' + opt.customCommand + '>')
			break
		}		
		default:
			break;
	}
};

instance.prototype.sendCmd = function(cmdStr) {
	var self = this;
	var cmd;
	var end;

	cmd = unescape(cmdStr);
	end = '\r';
	
	console.log(cmd);

	/* 
	 * create a binary buffer pre-encoded 'latin1' (8bit no change bytes)
	 * sending a string assumes 'utf8' encoding 
	 * which then escapes character values over 0x7F
	 * and destroys the 'binary' content
	 */
	var sendBuf = Buffer.from(cmd + end, 'latin1');
	
	console.log(sendBuf);

	if (sendBuf != '') {
		// self.log('info','sending ',sendBuf,'to',self.config.host);

		if (self.socket !== undefined && self.socket.connected) {
			self.socket.send(sendBuf);
		}
		else {
			self.log('error','Socket not connected :(');
		}
	}
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;