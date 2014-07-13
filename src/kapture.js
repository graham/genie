/*
Copyright [2014] [Graham Abbott <graham.abbott@gmail.com>]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var Kapture = function() {
    this.initialize();
};

Kapture.prototype.initialize = function() {
    this.stop_event = 0;
    this.last_event = null;
    this.last_guess = null;
    this.safe_input = false;
    this.game_mode = false;
    this.game_mode_cache = [];
    this.bailout_func = function(name) { 
        if (name.slice(0, 5) == 'meta-') {
            return true;
        }
    };

    this.capture_all = false;
    this.capture_buffer = [];
    this.capture_final = 'enter';

    this.training_mode = false;
    this.take_everything = false;
    this.documentation = {};
    
  this.keys_dict = {
    "48": "0", "49": "1", "50": "2", "51": "3", "52": "4", "53": "5", "54": "6", "55": "7", 
    "56": "8", "57": "9", "65": "a", "66": "b", "67": "c", "68": "d", "69": "e", "70": "f", 
    "71": "g", "72": "h", "73": "i", "74": "j", "75": "k", "76": "l", "77": "m", "78": "n",
    "79": "o", "80": "p", "81": "q", "82": "r", "83": "s", "84": "t", "85": "u", "86": "v", 
    "87": "w", "88": "x", "89": "y", "90": "z", "186": ";", "187": "=", "188": ",", 
    "189": "-", "190": ".", "191": "/", "192": "`", "219": "[", "220": "\\", "221": "]", 
    "222": "'", "229": "q", "9":"tab", "27":"esc", "32":"space", "8":"backspace", 
    "13":"enter", '229':'q', '37':'left', '38':'up', '39':'right', '40':'down',
    "96":'num0', "97":"num1", "98":"num2", "99":"num3", "100":"num4", "101":"num5",
    "102":"num6", "103":"num7", "104":"num8", "105":"num9","106":"num*",
    "12":"numclear", "112":"f1", "113":"f2", "114":"f3", "115":"f4", "116":"f5", "117":"f6",
    "118":"f7", "119":"f8", "120":"f9", "121":"f10", "122":"f11", "123":"f12", "124":"f13", 
    "125":"f14", "126":"f15", "127":"f16", "128":"f17", "129":"f18", "130":"f19",
    "91":"command", "18":"option", "93":"command", "17":"control"
  };

    this.modified_dict = {
        "shift-1":"!", "shift-2":"@", 'shift-3':'#', 'shift-4':'$', 'shift-5':'%',
        'shift-6':'^', 'shift-7':'&', 'shift-8':'*', 'shift-9':'(', 'shift-0':')',
        'shift--':'_', 'shift-=':'+', 'shift-`':'~', 'shift-a':'A', 'shift-b':'B', 
        'shift-c':'C', 'shift-d':'D', 'shift-e':'E', 'shift-f':'F', 'shift-g':'G', 
        'shift-h':'H', 'shift-i':'I', 'shift-j':'J', 'shift-k':'K', 'shift-l':'L', 
        'shift-m':'M', 'shift-n':'N', 'shift-o':'O', 'shift-p':'P', 'shift-q':'Q', 
        'shift-r':'R', 'shift-s':'S', 'shift-t':'T', 'shift-u':'U', 'shift-v':'V', 
        'shift-w':'W', 'shift-x':'X', 'shift-y':'Y', 'shift-z':'Z', 'shift-,':'<', 
        'shift-.':'>', 'shift-;':':', 
        'shift-quote':'"', 'shift-[':'{', 'shift-]':'}', 'shift-/':'?',
    };
    
    this.key_view_dict = {
        ' ':'&nbsp;',
        '>':'&gt;',
        '<':'&lt;',
    };
    
    this.commands = {};
    this.passive_commands = {};
    this.non_passive_commands = {};
    this.anyevent_commands = [];
    this.pushes = {};
    this.cancel_keybinding = 'control-g';

    this.add_push('control-x');

    this.add_command(this.cancel_keybinding, function(term) { term.command_cancel(); });
    this.add_command('control-x control-v', function(term) { alert("Version 0.2 Kapture written by Graham Abbott <graham.abbott@gmail.com>"); });
    this.add_command('` h', function(term) { term.show_help(term); } );
    this.add_passive_command('control-x control-n', function(term) { alert("this will not happen while focused on a textfield"); } );

    this.history = [];
    this.command_stack = [];
};

Kapture.prototype.log = function(message) {
    if (this.training_mode) {
        console.log("log - " + message);
    }
};

Kapture.prototype.key_event = function(event, type) {
    this.last_event = event;
    var modifier = '';
    this.stop_event = 0;
    
    if (event.metaKey) {
        modifier += 'meta-';
    }
    if (event.shiftKey) {
        modifier += 'shift-';
    }
    if (event.altKey) {
        modifier += 'alt-';
    }
    if (event.ctrlKey) {
        modifier += 'control-';
    }

    var name = this.keys_dict[event.keyCode];
    var guess = name;
    var full_modifier = modifier;

    if (name == undefined) {
        this.log('missing key: ' + event.keyCode);
    } else {
        this.log('hit: ' + name);
    }

    if (this.command_stack.length && (modifier+guess) != this.cancel_keybinding) {
        full_modifier = this.command_stack.join(' ') + ' ' + modifier;
    }
    
    var mod_name = full_modifier + name;

  if (this.game_mode) {
	if (type == "KEYDOWN") {
	  if (this.game_mode_cache.indexOf(mod_name) != -1) {
		return;
	  } else {
		this.game_mode_cache.push(mod_name);
	  }
	} else if (type == "KEYUP") {
	  var index = this.game_mode_cache.indexOf(mod_name);
	  if (index != -1) {
		this.game_mode_cache.splice(index, 1);
	  }
	}
	mod_name += ' ' + type;
  }

    var result = [];
    var something_was_called = true;

    if (this.bailout_func) {
        if (this.bailout_func(mod_name)) {
            return true;
        }
    }

    if (this.capture_all) {
        if (mod_name == this.capture_final) {
            this.capture_all = false;
            var c = this.capture_buffer.join('');
            this.capture_buffer = [];
            if (this.commands[c] !== undefined) {
                result = this.commands[c](this);
            }
            event.preventDefault();
        } else {
            this.capture_buffer.push(mod_name);
            this.on_capture(mod_name);
            event.preventDefault();
            return;
        }
    }

    if (full_modifier || this.modified_dict[guess] !== undefined) {
        result = this.modified_dict[mod_name];
    }
    
    if (this.pushes[mod_name] !== undefined) {
        if (this.pushes[mod_name] == "!push!") {
            this.command_stack.push( modifier + name );
            this.on_push(modifier+name);
        } else if (this.pushes[mod_name].substring(0, 12) == "!push_until!") {
            this.capture_final = this.pushes[mod_name].substring(12);
            this.capture_all = true;
        }
        this.stop_event = 1;
    } else if (this.commands[mod_name] !== undefined) {
        this.command_stack = [];
        this.stop_event = 1;
        var commands = this.commands[mod_name];
        var retain = [];
        for( var f=0; f < commands.length; f++ ) {
            var fc = commands[f];
            var r = fc(this);
            if (r != -1) {
                retain.push(fc);
            }
        }
        this.commands[mod_name] = retain;
    } else if (this.passive_commands[mod_name] !== undefined && this.passive_allowed()) {
        this.command_stack = [];
        this.stop_event = 1;
        var commands = this.passive_commands[mod_name];
        var retain = [];
        for( var f=0; f < commands.length; f++ ) {
            var fc = commands[f];
            var r = fc(this);
            if (r != -1) {
                retain.push(fc);
            }
        }
        this.passive_commands[mod_name] = retain;
    } else if (this.non_passive_commands[mod_name] !== undefined && !this.passive_allowed()) {
        this.command_stack = [];
        this.stop_event = 1;
        var commands = this.non_passive_commands[mod_name];
        var retain = [];
        for( var f=0; f < commands.length; f++ ) {
            var fc = commands[f];
            var r = fc(this);
            if (r != -1) {
                retain.push(fc);
            }
        }
        this.non_passive_commands[mod_name] = retain;
    } else {
        this.command_stack = [];
        something_was_called = false;
    }

    if (this.take_everything && !something_was_called) {
        this.insert_at_cursor(guess || result);
    }

    if (this.stop_event) {
        event.preventDefault();
    }
    last_guess = modifier + name;

    if (this.anyevent_commands.length) {
        for(var i = 0; i < this.anyevent_commands.length; i++) {
          var f = this.anyevent_commands[i];
          f(this);
        }
    }
    
    if (something_was_called) {
        return true;
    } else { 
        return false;
    }
};

Kapture.prototype.key_down = function(event) {
    return this.key_event(event, "KEYDOWN");
};

Kapture.prototype.key_up = function(event) {
    return this.key_event(event, "KEYUP");
};

Kapture.prototype.insert_at_cursor = function(guess) {
    // pass, do nothing here, you could over ride so that you can make a terminal or
    // faux text area if you wanted, i'm assuming that if they get here you just
    // want things to be passed on, basically this means the event will not be
    // stopped in anyway.
    this.log("press: " + guess);
};

Kapture.prototype.command_cancel = function() {
    this.command_stack = [];
    this.log('Cancelled!');
};

Kapture.prototype.add_command = function(key, func, doc) {
    if (this.commands[key] === undefined) {
        this.commands[key] = [];
    }
    this.commands[key].push(func);
};

Kapture.prototype.add_passive_command = function(key, func, doc) {
    if (this.passive_commands[key] === undefined) {
        this.passive_commands[key] = [];
    }
    this.passive_commands[key].push(func);
};

Kapture.prototype.add_non_passive_command = function(key, func, doc) {
    if (this.non_passive_commands[key] === undefined) {
        this.non_passive_commands[key] = [];
    }
    this.non_passive_commands[key].push(func);
    this.documentation[key] = doc;
};

Kapture.prototype.anyevent_command = function(func, doc) {
    this.anyevent_commands.push(func);
};

Kapture.prototype.on_push = function(key) {
    this.log("Push: " + key);
};

Kapture.prototype.on_capture = function(key) {
    this.log("Captured: " + this.capture_buffer.join('') + " - waiting for " + this.capture_final);
};

Kapture.prototype.show_help = function(term) {
    var d = document.getElementById('___helpdiv') || document.createElement('div');
    d.id = '___helpdiv';
    d.style.cssText = 'position: fixed; top: 10%; right: 10%; bottom: 10%; left: 10%; background-color: rgba(0, 0, 0, 0.86); color: white; padding: 30px; border-radius: 15px;';
    d.innerHTML = 'You have found the Kapture Help, nice work!<br><br>press space to close.';
    document.body.appendChild(d);
    
    term.add_command('space', function() { 
            console.log('removing help thing');
            var d = document.getElementById('___helpdiv');
            d.parentElement.removeChild(d);
            return -1;
        });
};

Kapture.prototype.passive_allowed = function() {
    var t = document.activeElement.type;
    if (t == "textarea" || t == "text" || t == "password") {
        return false;
    } else { 
        return true;
    }
};

Kapture.prototype.add_push = function(key, until) {
    if (until === undefined) {
        // normal push.
        this.pushes[key] = '!push!';
    } else {
        this.pushes[key] = '!push_until!' + until;
    }
};


