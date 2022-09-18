(function ($global) { "use strict";
var $estr = function() { return js_Boot.__string_rec(this,''); },$hxEnums = $hxEnums || {},$_;
function $extend(from, fields) {
	var proto = Object.create(from);
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var BSHead = function() {
	this.bitIndex = 0;
	this.blockIndex = 0;
};
BSHead.__name__ = true;
BSHead.prototype = {
	read: function(data) {
		if(data.length <= this.blockIndex) {
			return haxe_ds_Option.None;
		} else {
			return haxe_ds_Option.Some((data[this.blockIndex] >> this.bitIndex & 1) == 1);
		}
	}
	,write: function(data,value) {
		while(data.length <= this.blockIndex) data.push(0);
		if(value) {
			data[this.blockIndex] |= 1 << this.bitIndex;
		}
	}
	,increment: function() {
		this.bitIndex += 1;
		if(this.bitIndex > 5) {
			this.bitIndex = 0;
			this.blockIndex += 1;
		}
	}
};
var BSWriter = function() {
	this.head = new BSHead();
	this.data = [];
};
BSWriter.__name__ = true;
BSWriter.prototype = {
	toString: function() {
		var str = "";
		var _g = 0;
		var _g1 = this.data;
		while(_g < _g1.length) {
			var digit = _g1[_g];
			++_g;
			str += haxe_crypto_Base64.CHARS.charAt(digit);
		}
		return str;
	}
	,writeInt: function(value,bits) {
		var _g = 0;
		var _g1 = bits;
		while(_g < _g1) {
			var i = _g++;
			this.write([(value >> i & 1) == 1]);
		}
	}
	,write: function(values) {
		var _g = 0;
		while(_g < values.length) {
			var value = values[_g];
			++_g;
			this.head.write(this.data,value);
			this.head.increment();
		}
	}
};
var BSReader = function(encoded) {
	this.head = new BSHead();
	this.data = [];
	var _g = 0;
	var _g1 = encoded.length;
	while(_g < _g1) {
		var i = _g++;
		this.data.push(this.charToInt(encoded.charAt(i)));
	}
};
BSReader.__name__ = true;
BSReader.prototype = {
	charToInt: function(char) {
		var _g = 0;
		while(_g < 64) {
			var i = _g++;
			if(haxe_crypto_Base64.CHARS.charAt(i) == char) {
				return i;
			}
		}
		throw haxe_Exception.thrown("base64 out of bounds");
	}
	,read: function(length) {
		var bits = [];
		var _g = 0;
		var _g1 = length;
		while(_g < _g1) {
			var i = _g++;
			var _g2 = this.head.read(this.data);
			switch(_g2._hx_index) {
			case 0:
				var bit = _g2.v;
				bits.push(bit);
				break;
			case 1:
				return haxe_ds_Option.None;
			}
			this.head.increment();
		}
		return haxe_ds_Option.Some(bits);
	}
	,readInt: function(length) {
		var _g = this.read(length);
		switch(_g._hx_index) {
		case 0:
			var bits = _g.v;
			var sum = 0;
			var _g = 0;
			var _g1 = length;
			while(_g < _g1) {
				var i = _g++;
				sum += (bits[i] ? 1 : 0) << i;
			}
			return haxe_ds_Option.Some(sum);
		case 1:
			return haxe_ds_Option.None;
		}
	}
};
var EReg = function(r,opt) {
	this.r = new RegExp(r,opt.split("u").join(""));
};
EReg.__name__ = true;
EReg.prototype = {
	match: function(s) {
		if(this.r.global) {
			this.r.lastIndex = 0;
		}
		this.r.m = this.r.exec(s);
		this.r.s = s;
		return this.r.m != null;
	}
	,matched: function(n) {
		if(this.r.m != null && n >= 0 && n < this.r.m.length) {
			return this.r.m[n];
		} else {
			throw haxe_Exception.thrown("EReg::matched");
		}
	}
};
var PlayControl = function() {
	this.silent = false;
	this.speed = 0;
	this.paused = false;
	this.frame = 0;
};
PlayControl.__name__ = true;
PlayControl.prototype = {
	pause: function() {
		this.paused = true;
		this.speed = 0;
	}
};
var Engine = function() {
	this.initialDirection = 0;
	this.pausedCallback = haxe_ds_Option.None;
	this.fullgameLevelCounter = 0;
	this.fullgameVideo = null;
	this.recording = new VideoRecorder(0);
	this.playback = haxe_ds_Option.None;
	this.control = new PlayControl();
	this.frameLength = 16.66666666;
	var _gthis = this;
	this._requestAnimationFrame = ($_=window,$bind($_,$_.requestAnimationFrame));
	window.requestAnimationFrame = $bind(this,this.requestAnimationFrame);
	window.coffee = { };
	window.coffee._onScene = $bind(this,this.onScene);
	window.coffee._onReset = $bind(this,this.onReset);
	window.coffee._keyup = $bind(this,this.keyup);
	window.coffee._keydown = $bind(this,this.keydown);
	window.coffee.load = function(string,slot) {
		if(slot == null || slot > 9 || slot < 0) {
			slot = 0;
		}
		_gthis.slots[slot] = new Video(string);
	};
	window.coffee.loadFullGame = function(strings) {
		var result = new Array(strings.length);
		var _g = 0;
		var _g1 = strings.length;
		while(_g < _g1) {
			var i = _g++;
			result[i] = new Video(strings[i]);
		}
		_gthis.fullgameVideo = result;
		_gthis.control.speed = 1;
		_gthis.control.paused = false;
		_gthis.triggerPausedCallback();
	};
	window.coffee.clearFullGame = function() {
		_gthis.fullgameVideo = null;
	};
	this.slots = [];
	this.slots.push(new Video());
	this.slots.push(new Video());
	this.slots.push(new Video());
	this.slots.push(new Video());
	this.slots.push(new Video());
	this.slots.push(new Video());
	this.slots.push(new Video());
	this.slots.push(new Video());
	this.slots.push(new Video());
	this.slots.push(new Video());
	this.control.speed = 1;
	this.calculateFps();
};
Engine.__name__ = true;
Engine.prototype = {
	wrapCallback: function(callback) {
		var _gthis = this;
		return function() {
			var _g = _gthis.playback;
			switch(_g._hx_index) {
			case 0:
				var player = _g.v;
				var _g = 0;
				var _g1 = player.getActions(_gthis.control.frame);
				while(_g < _g1.length) {
					var action = _g1[_g];
					++_g;
					_gthis.sendGameInput(action.code,action.down);
				}
				if(_gthis.control.frame + 1 >= player.video.pauseFrame) {
					if(_gthis.fullgameVideo == null) {
						_gthis.control.pause();
						console.log("tas_haxe_files/Engine.hx:106:","[PAUSE ] @ " + (_gthis.control.frame + 1));
						_gthis.control.silent = false;
					} else {
						_gthis.control.frame = 0;
						_gthis.primeControls();
					}
					_gthis.playback = haxe_ds_Option.None;
				}
				callback();
				break;
			case 1:
				callback();
				break;
			}
			_gthis.control.frame += 1;
		};
	}
	,requestAnimationFrame: function(callback) {
		var wrappedCallback = this.wrapCallback(callback);
		if(!this.control.paused) {
			switch(this.control.speed) {
			case 0:
				window.setTimeout(wrappedCallback,100);
				break;
			case 1:
				if(this.fps >= 58 && this.fps <= 62) {
					this._requestAnimationFrame(wrappedCallback);
				} else {
					window.setTimeout(wrappedCallback,this.frameLength);
				}
				break;
			default:
				window.setTimeout(wrappedCallback,0);
			}
		} else {
			this.pausedCallback = haxe_ds_Option.Some(wrappedCallback);
		}
	}
	,triggerPausedCallback: function() {
		var _g = this.pausedCallback;
		switch(_g._hx_index) {
		case 0:
			var cb = _g.v;
			this.pausedCallback = haxe_ds_Option.None;
			cb();
			break;
		case 1:
			break;
		}
	}
	,keyup: function(callback) {
		var _gthis = this;
		this.keyupHandler = callback;
		window.onkeyup = function(key) {
			_gthis.onKey(key,false);
		};
	}
	,keydown: function(callback) {
		var _gthis = this;
		this.keydownHandler = callback;
		window.onkeydown = function(key) {
			_gthis.onKey(key,true);
		};
	}
	,onKey: function(event,down) {
		if(!Util.isSome(this.playback)) {
			var suppress = [83,87,65,68,82];
			if(suppress.indexOf(event.keyCode) == -1) {
				this.sendGameInput(event.keyCode,down);
			}
		}
		if(down && this.fullgameVideo == null) {
			var _g = KeyBindings.fromKeyCode(event.keyCode);
			if(_g._hx_index == 0) {
				var input = _g.v;
				if(this.handleInterfaceInput(input,event.ctrlKey,event.altKey)) {
					event.preventDefault();
				}
			}
		}
	}
	,sendGameInput: function(keyCode,down) {
		this.recording.recordKey(this.control.frame,keyCode,down,this.control.silent);
		var event = { which : keyCode, key : KeyCodes.toKey(keyCode), preventDefault : function() {
		}, stopPropagation : function() {
		}};
		if(down) {
			this.keydownHandler(event);
		} else {
			this.keyupHandler(event);
		}
	}
	,primeControls: function() {
		var _g = 0;
		var _g1 = Video.keyCodes;
		while(_g < _g1.length) {
			var code = _g1[_g];
			++_g;
			this.sendGameInput(code,false);
		}
	}
	,resetLevel: function(slot,replay) {
		var _gthis = this;
		if(replay == null) {
			replay = false;
		}
		console.log("tas_haxe_files/Engine.hx:219:","[" + (replay ? "REPLAY" : "RESET to") + " " + (slot == null ? "start" : "slot " + (slot == null ? "null" : "" + slot) + "...") + "]");
		this.sendGameInput(82,true);
		window.setTimeout(function() {
			_gthis.sendGameInput(82,false);
		},100);
		this.recording = new VideoRecorder(this.initialDirection);
		this.control = new PlayControl();
		this.primeControls();
	}
	,loadPlayback: function(video) {
		this.playback = haxe_ds_Option.Some(new VideoPlayer(video));
		this.initialDirection = video.initialDirection;
		this.recording = new VideoRecorder(this.initialDirection);
	}
	,handleInterfaceInput: function(input,ctrlKey,altKey) {
		var oldControl = JSON.parse(JSON.stringify(this.control));
		if(input == CoffeeInput.StepFrame && this.control.paused) {
			console.log("tas_haxe_files/Engine.hx:248:","[STEP  ] @ " + (this.control.frame + 1));
			this.triggerPausedCallback();
			return true;
		}
		if(input == CoffeeInput.Pause) {
			if(!oldControl.paused) {
				console.log("tas_haxe_files/Engine.hx:256:","[PAUSE ] @ " + (this.control.frame + 1));
			}
			this.control.pause();
			return true;
		}
		var playAction = true;
		switch(input._hx_index) {
		case 2:
			this.control.speed = 0;
			break;
		case 3:
			this.control.speed = 1;
			break;
		case 4:
			this.control.speed = 2;
			break;
		default:
			playAction = false;
		}
		if(playAction) {
			this.control.paused = false;
			if(oldControl.paused) {
				console.log("tas_haxe_files/Engine.hx:277:","[PLAY  ] @ " + this.control.frame);
			}
			this.triggerPausedCallback();
			return true;
		}
		if(input == CoffeeInput.Reset) {
			this.playback = haxe_ds_Option.None;
			this.resetLevel();
			this.control.pause();
			this.triggerPausedCallback();
			return true;
		}
		if(input == CoffeeInput.Replay) {
			this.loadPlayback(this.slots[0]);
			this.resetLevel(0,true);
			this.control.speed = 1;
			this.triggerPausedCallback();
			return true;
		}
		if(input._hx_index == 7) {
			var slot = input.code;
			if(!ctrlKey) {
				this.loadPlayback(this.slots[slot]);
				this.resetLevel(slot);
				this.control.speed = 2;
				if(altKey) {
					this.control.pause();
				}
				this.control.silent = true;
				this.triggerPausedCallback();
				return true;
			}
			if(ctrlKey && !altKey) {
				this.control.pause();
				var video = this.recording.saveVideo(this.control.frame);
				console.log("tas_haxe_files/Engine.hx:320:","[SAVE slot " + slot + "] @ " + this.control.frame);
				console.log("tas_haxe_files/Engine.hx:321:","data: " + video.toString());
				this.slots[slot] = video;
				return true;
			}
		}
		return false;
	}
	,onScene: function(levelNum) {
		console.log("tas_haxe_files/Engine.hx:335:","[SCENE " + levelNum + "]");
		if(this.fullgameVideo != null && this.fullgameVideo.length >= levelNum) {
			this.fullgameLevelCounter = levelNum;
			this.loadPlayback(this.fullgameVideo[this.fullgameLevelCounter - 1]);
			this.control.paused = false;
			this.control.frame = 0;
			this.control.speed = 1;
			this.primeControls();
		}
	}
	,onReset: function() {
		var _gthis = this;
		var count = 0;
		var advanceFrameInterval = window.setInterval(function() {
			_gthis.triggerPausedCallback();
			count += 1;
			if(count >= 19) {
				clearInterval(advanceFrameInterval);
			}
		},this.frameLength);
	}
	,truncateFloat: function(number,digits) {
		var re = new EReg("(\\d+\\.\\d{" + digits + "})(\\d)","i");
		var isMatched = re.match(number == null ? "null" : "" + number);
		if(isMatched) {
			return parseFloat(re.matched(1));
		} else {
			return number;
		}
	}
	,calculateFps: function() {
		var _gthis = this;
		var times = [];
		var calculatedFps;
		var refreshLoop = null;
		refreshLoop = function() {
			var now = window.performance.now();
			while(times.length > 0 && times[0] <= now - 1000) times.shift();
			times.push(now);
			calculatedFps = times.length;
			_gthis._requestAnimationFrame(refreshLoop);
		};
		window.setInterval(function() {
			_gthis.fps = calculatedFps;
		},1000);
		refreshLoop();
	}
};
var CoffeeInput = $hxEnums["CoffeeInput"] = { __ename__:true,__constructs__:null
	,StepFrame: {_hx_name:"StepFrame",_hx_index:0,__enum__:"CoffeeInput",toString:$estr}
	,Pause: {_hx_name:"Pause",_hx_index:1,__enum__:"CoffeeInput",toString:$estr}
	,PlaySlow: {_hx_name:"PlaySlow",_hx_index:2,__enum__:"CoffeeInput",toString:$estr}
	,PlayNormal: {_hx_name:"PlayNormal",_hx_index:3,__enum__:"CoffeeInput",toString:$estr}
	,PlayFast: {_hx_name:"PlayFast",_hx_index:4,__enum__:"CoffeeInput",toString:$estr}
	,Replay: {_hx_name:"Replay",_hx_index:5,__enum__:"CoffeeInput",toString:$estr}
	,Reset: {_hx_name:"Reset",_hx_index:6,__enum__:"CoffeeInput",toString:$estr}
	,Slot: ($_=function(code) { return {_hx_index:7,code:code,__enum__:"CoffeeInput",toString:$estr}; },$_._hx_name="Slot",$_.__params__ = ["code"],$_)
};
CoffeeInput.__constructs__ = [CoffeeInput.StepFrame,CoffeeInput.Pause,CoffeeInput.PlaySlow,CoffeeInput.PlayNormal,CoffeeInput.PlayFast,CoffeeInput.Replay,CoffeeInput.Reset,CoffeeInput.Slot];
var KeyBindings = function() { };
KeyBindings.__name__ = true;
KeyBindings.fromKeyCode = function(code) {
	switch(code) {
	case 13:
		return haxe_ds_Option.Some(CoffeeInput.Replay);
	case 65:
		return haxe_ds_Option.Some(CoffeeInput.Pause);
	case 68:
		return haxe_ds_Option.Some(CoffeeInput.PlayNormal);
	case 70:
		return haxe_ds_Option.Some(CoffeeInput.PlayFast);
	case 82:
		return haxe_ds_Option.Some(CoffeeInput.Reset);
	case 83:
		return haxe_ds_Option.Some(CoffeeInput.PlaySlow);
	case 90:
		return haxe_ds_Option.Some(CoffeeInput.StepFrame);
	default:
		if(code >= 48 && code <= 57) {
			return haxe_ds_Option.Some(CoffeeInput.Slot(code - 48));
		} else {
			return haxe_ds_Option.None;
		}
	}
};
var KeyCodes = function() { };
KeyCodes.__name__ = true;
KeyCodes.toKey = function(keyCode) {
	switch(keyCode) {
	case 27:
		return "Escape";
	case 32:
		return " ";
	case 37:
		return "ArrowLeft";
	case 38:
		return "ArrowUp";
	case 39:
		return "ArrowRight";
	case 40:
		return "ArrowDown";
	case 65:
		return "a";
	case 66:
		return "b";
	case 67:
		return "c";
	case 68:
		return "d";
	case 69:
		return "e";
	case 70:
		return "f";
	case 71:
		return "g";
	case 72:
		return "h";
	case 73:
		return "i";
	case 74:
		return "j";
	case 75:
		return "k";
	case 76:
		return "l";
	case 77:
		return "m";
	case 78:
		return "n";
	case 79:
		return "o";
	case 80:
		return "p";
	case 81:
		return "q";
	case 82:
		return "r";
	case 83:
		return "s";
	case 84:
		return "t";
	case 85:
		return "u";
	case 86:
		return "v";
	case 87:
		return "w";
	case 88:
		return "x";
	case 89:
		return "y";
	case 90:
		return "z";
	default:
		return "";
	}
};
var Main = function() { };
Main.__name__ = true;
Main.infoTrace = function(str) {
	console.log("tas_haxe_files/Main.hx:5:","    " + str);
};
Main.main = function() {
	console.log("tas_haxe_files/Main.hx:9:","  _____           _              _      _____       __  __          \r\n |_   _|         | |            | |    / ____|     / _|/ _|         \r\n   | |  _ __  ___| |_ __ _ _ __ | |_  | |     ___ | |_| |_ ___  ___ \r\n   | | | '_ \\/ __| __/ _` | '_ \\| __| | |    / _ \\|  _|  _/ _ \\/ _ \\\r\n  _| |_| | | \\__ \\ || (_| | | | | |_  | |___| (_) | | | ||  __/  __/\r\n |_____|_| |_|___/\\__\\__,_|_| |_|\\__|  \\_____\\___/|_| |_| \\___|\\___|");
	console.log("tas_haxe_files/Main.hx:15:","Instant Coffee is enabled.");
	Main.infoTrace("[r] to reset and pause.");
	Main.infoTrace("[a-s-d-f] to adjust playback speed.");
	Main.infoTrace("[z] to step frame.");
	Main.infoTrace("[0-9] to reset and play back video in the respective slot (used for save states).");
	Main.infoTrace("Ctrl + [0-9] to save video in the respective slot.");
	Main.infoTrace("Alt + [0-9] to play back video in the respective slot, pausing on frame 1.");
	Main.infoTrace("[Enter] to reset and play the video in slot 0 in normal speed.");
	Main.infoTrace("`coffee.load(string, int)` to load a video into the chosen slot.");
	Main.infoTrace("`coffee.loadFullGame(array<string>)` to play a full game of several levels. Parameter is array of video codes.");
	Main.infoTrace("`coffee.clearFullGame()` to delete the current loaded full game video.");
	var engine = new Engine();
};
Math.__name__ = true;
var Util = function() { };
Util.__name__ = true;
Util.isSome = function(x) {
	switch(x._hx_index) {
	case 0:
		var _g = x.v;
		return true;
	case 1:
		return false;
	}
};
var Video = function(save) {
	this.initialDirection = 0;
	this.pauseFrame = 0;
	this.actions = [];
	if(save != null) {
		var reader = new BSReader(save);
		var saveSize = this.getOption(reader.readInt(12));
		this.initialDirection = this.getOption(reader.readInt(12));
		this.pauseFrame = this.getOption(reader.readInt(Video.headerSize));
		var frame = 0;
		var _g = 0;
		var _g1 = saveSize;
		while(_g < _g1) {
			var i = _g++;
			var longDelay = this.getOption(reader.read(1))[0];
			var delay = this.getOption(reader.readInt(longDelay ? Video.longDelaySize : Video.delaySize));
			var code = this.getOption(reader.readInt(3));
			var down = this.getOption(reader.read(1));
			frame += delay;
			this.actions.push({ frame : frame, code : code, down : down[0]});
		}
	}
};
Video.__name__ = true;
Video.toActionCode = function(keyCode) {
	var _g = 0;
	var _g1 = Video.keyCodes.length;
	while(_g < _g1) {
		var i = _g++;
		if(Video.keyCodes[i] == keyCode) {
			return haxe_ds_Option.Some(i);
		}
	}
	return haxe_ds_Option.None;
};
Video.fromActionCode = function(actionCode) {
	return Video.keyCodes[actionCode];
};
Video.showActionCode = function(actionCode) {
	switch(actionCode) {
	case 0:
		return "Left   ";
	case 1:case 4:case 5:
		return "Jump   ";
	case 2:
		return "Right  ";
	case 3:
		return "Down   ";
	case 6:
		return "Pause  ";
	}
	return "???    ";
};
Video.prototype = {
	getOption: function(x) {
		switch(x._hx_index) {
		case 0:
			var x1 = x.v;
			return x1;
		case 1:
			throw haxe_Exception.thrown("Invalid video string.");
		}
	}
	,toString: function() {
		var writer = new BSWriter();
		writer.writeInt(this.actions.length,12);
		writer.writeInt(this.initialDirection,12);
		writer.writeInt(this.pauseFrame,Video.headerSize);
		var lastFrame = 0;
		var _g = 0;
		var _g1 = this.actions;
		while(_g < _g1.length) {
			var action = _g1[_g];
			++_g;
			var delay = action.frame - lastFrame;
			lastFrame = action.frame;
			var longDelay = delay >= 32;
			writer.write([longDelay]);
			writer.writeInt(delay,longDelay ? Video.longDelaySize : Video.delaySize);
			writer.writeInt(action.code,3);
			writer.write([action.down]);
		}
		return writer.toString();
	}
	,copy: function() {
		var video = new Video();
		video.actions = this.actions.slice();
		video.pauseFrame = this.pauseFrame;
		video.initialDirection = this.initialDirection;
		return video;
	}
};
var VideoRecorder = function(initialDirection) {
	this.video = new Video();
	this.keyStates = [];
	var _g = 0;
	var _g1 = Video.keyCodes.length;
	while(_g < _g1) {
		var i = _g++;
		this.keyStates.push(false);
	}
	this.video.initialDirection = initialDirection;
};
VideoRecorder.__name__ = true;
VideoRecorder.prototype = {
	recordKey: function(frame,keyCode,down,silent) {
		var _g = Video.toActionCode(keyCode);
		switch(_g._hx_index) {
		case 0:
			var action = _g.v;
			var oldState = this.keyStates[action];
			if(down == oldState) {
				return;
			}
			this.keyStates[action] = down;
			if(frame > 0) {
				this.video.actions.push({ frame : frame, code : action, down : down});
			}
			if(!silent) {
				console.log("tas_haxe_files/Video.hx:129:","---> " + Video.showActionCode(action) + " " + (down ? "down" : "up  ") + " @ " + frame);
			}
			break;
		case 1:
			return;
		}
	}
	,saveVideo: function(frame) {
		var res = this.video.copy();
		res.pauseFrame = frame;
		return res;
	}
};
var VideoPlayer = function(video) {
	this.video = video.copy();
};
VideoPlayer.__name__ = true;
VideoPlayer.prototype = {
	getActions: function(frame) {
		var res = [];
		while(this.video.actions.length > 0 && this.video.actions[0].frame == frame) {
			var action = this.video.actions.shift();
			res.push({ code : Video.fromActionCode(action.code), down : action.down});
		}
		return res;
	}
};
var haxe_Exception = function(message,previous,native) {
	Error.call(this,message);
	this.message = message;
	this.__previousException = previous;
	this.__nativeException = native != null ? native : this;
};
haxe_Exception.__name__ = true;
haxe_Exception.thrown = function(value) {
	if(((value) instanceof haxe_Exception)) {
		return value.get_native();
	} else if(((value) instanceof Error)) {
		return value;
	} else {
		var e = new haxe_ValueException(value);
		return e;
	}
};
haxe_Exception.__super__ = Error;
haxe_Exception.prototype = $extend(Error.prototype,{
	get_native: function() {
		return this.__nativeException;
	}
});
var haxe_ValueException = function(value,previous,native) {
	haxe_Exception.call(this,String(value),previous,native);
	this.value = value;
};
haxe_ValueException.__name__ = true;
haxe_ValueException.__super__ = haxe_Exception;
haxe_ValueException.prototype = $extend(haxe_Exception.prototype,{
});
var haxe_crypto_Base64 = function() { };
haxe_crypto_Base64.__name__ = true;
var haxe_ds_Option = $hxEnums["haxe.ds.Option"] = { __ename__:true,__constructs__:null
	,Some: ($_=function(v) { return {_hx_index:0,v:v,__enum__:"haxe.ds.Option",toString:$estr}; },$_._hx_name="Some",$_.__params__ = ["v"],$_)
	,None: {_hx_name:"None",_hx_index:1,__enum__:"haxe.ds.Option",toString:$estr}
};
haxe_ds_Option.__constructs__ = [haxe_ds_Option.Some,haxe_ds_Option.None];
var haxe_iterators_ArrayIterator = function(array) {
	this.current = 0;
	this.array = array;
};
haxe_iterators_ArrayIterator.__name__ = true;
haxe_iterators_ArrayIterator.prototype = {
	hasNext: function() {
		return this.current < this.array.length;
	}
	,next: function() {
		return this.array[this.current++];
	}
};
var js_Boot = function() { };
js_Boot.__name__ = true;
js_Boot.__string_rec = function(o,s) {
	if(o == null) {
		return "null";
	}
	if(s.length >= 5) {
		return "<...>";
	}
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) {
		t = "object";
	}
	switch(t) {
	case "function":
		return "<function>";
	case "object":
		if(o.__enum__) {
			var e = $hxEnums[o.__enum__];
			var con = e.__constructs__[o._hx_index];
			var n = con._hx_name;
			if(con.__params__) {
				s = s + "\t";
				return n + "(" + ((function($this) {
					var $r;
					var _g = [];
					{
						var _g1 = 0;
						var _g2 = con.__params__;
						while(true) {
							if(!(_g1 < _g2.length)) {
								break;
							}
							var p = _g2[_g1];
							_g1 = _g1 + 1;
							_g.push(js_Boot.__string_rec(o[p],s));
						}
					}
					$r = _g;
					return $r;
				}(this))).join(",") + ")";
			} else {
				return n;
			}
		}
		if(((o) instanceof Array)) {
			var str = "[";
			s += "\t";
			var _g = 0;
			var _g1 = o.length;
			while(_g < _g1) {
				var i = _g++;
				str += (i > 0 ? "," : "") + js_Boot.__string_rec(o[i],s);
			}
			str += "]";
			return str;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( _g ) {
			return "???";
		}
		if(tostr != null && tostr != Object.toString && typeof(tostr) == "function") {
			var s2 = o.toString();
			if(s2 != "[object Object]") {
				return s2;
			}
		}
		var str = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		var k = null;
		for( k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str.length != 2) {
			str += ", \n";
		}
		str += s + k + " : " + js_Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str += "\n" + s + "}";
		return str;
	case "string":
		return o;
	default:
		return String(o);
	}
};
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $global.$haxeUID++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = m.bind(o); o.hx__closures__[m.__id__] = f; } return f; }
$global.$haxeUID |= 0;
String.__name__ = true;
Array.__name__ = true;
js_Boot.__toStr = ({ }).toString;
Video.headerSize = 24;
Video.delaySize = 5;
Video.longDelaySize = 10;
Video.keyCodes = [37,38,39,40,32,85,80];
haxe_crypto_Base64.CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
Main.main();
})(typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : this);
