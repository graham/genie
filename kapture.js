var Kapture = function() {
    this.initialize();
};

Kapture.prototype.initialize = function() {
    this.stop_event = 0;
    this.last_event = null;
    this.last_guess = null;
    
    this.keys_dict = {
        "48": "0", "49": "1", "50": "2", "51": "3", "52": "4", "53": "5", "54": "6", "55": "7", 
        "56": "8", "57": "9", "65": "a", "66": "b", "67": "c", "68": "d", "69": "e", "70": "f", 
        "71": "g", "72": "h", "73": "i", "74": "j", "75": "k", "76": "l", "77": "m", "78": "n",
        "79": "o", "80": "p", "81": "q", "82": "r", "83": "s", "84": "t", "85": "u", "86": "v", 
        "87": "w", "88": "x", "89": "y", "90": "z", "186": ";", "187": "=", "188": ",", "189": "-", 
        "190": ".", "191": "/", "192": "`", "219": "[", "220": "\\", "221": "]", "222": "'",
        "229": "q", "9":"tab", "27":"esc", "32":"space", "8":"backspace", "13":"enter", '229':'q',
        '37':'left', '38':'up', '39':'right', '40':'down',
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
    
    this.modified_dict['control-g'] = function(term) { term.command_cancel(); };
    this.modified_dict['control-x'] = '!push!';
    this.modified_dict['esc'] = '!push!';

    this.modified_dict['control-x control-v'] = function(term) { alert("Version 0.2 Kapture written by Graham Abbott <graham.abbott@gmail.com>"); };
    this.modified_dict['control-x control-r'] = function(term) { document.location.reload(); };
    this.modified_dict['control-x control-s'] = function(term) { document.body.innerHTML += 'SAVED<br>';};
    this.modified_dict['control-x control-i'] = function(term) { term.log(term.last_event); term.log(term.last_guess);};
    this.modified_dict['esc x'] = function(term) { alert('dope!'); };
    this.history = [];
    this.command_stack = [];
    this.log("Testing Log");
};

Kapture.prototype.log = function(message) {
    // fuck you firefox

};

Kapture.prototype.keydown = function(event) {
    this.last_event = event;
    var modifier = '';
    this.stop_event = 0;
    
    if (event.shiftKey) {
        modifier += 'shift-';
    }
    if (event.altKey) {
        modifier += 'alt-';
    }
    if (event.ctrlKey) {
        modifier += 'control-';
    }
    if (event.metaKey) {
        modifier += 'meta-';
    }

    //if (event.keyCode == 16 || event.keyCode == 17 || event.keyCode == 18 || event.keyCode == 91) {
    //    this.refresh_line();
    //    return;
    //}
    
    var name = this.keys_dict[event.keyCode];
    var key = this.keys_dict[event.keyCode];
    var guess = key;
    var full_modifier = modifier;
    
    if (typeof guess == 'function' && !modifier) {
        try {
            guess = guess(this);
        } catch (e) {
            this.log(e);
        }
    }
    
    if (this.command_stack.length && (modifier+guess) != 'control-g') {
        full_modifier = this.command_stack.join(' ') + ' ' + modifier;
    } 
    
    if (full_modifier || this.modified_dict[guess] !== undefined) {
        var mod_name = full_modifier + name;
        guess = this.modified_dict[mod_name];

        if (typeof guess == 'function') {
            guess = guess(this);
            if (guess == undefined) {
                guess = '';
            }
        }

        if (guess == '!push!') {
            this.command_stack.push( modifier + key );
            this.on_push(modifier+key);
            this.stop_event = 1;
        } else {
            this.command_stack = [];
            if (guess != undefined) {
                this.insert_at_cursor(guess);
            } else {
                this.log(full_modifier + name + ' is not defined. <br>(' + mod_name +') ['+event.keyCode+']');
            }
        }
    } else {
        if (guess != undefined) {
            this.insert_at_cursor(guess);
        } else { 
            //this.log('Could not find: ' + event.keyCode);
        }
    }

    if (this.stop_event) {
	event.stopPropagation();
    }
    last_guess = modifier + key;
};

Kapture.prototype.insert_at_cursor = function(guess) {
    // pass, do nothing here, you could over ride so that you can make a terminal or
    // faux text area if you wanted, i'm assuming that if they get here you just
    // want things to be passed on, basically this means the event will not be
    // stopped in anyway.
};

Kapture.prototype.command_cancel = function() {
    this.command_stack = [];
    this.log('Cancelled!');
};

Kapture.prototype.add_command = function(key, func) {
    this.modified_dict[key] = func;
};

Kapture.prototype.on_push = function(key) {
    // do nothing.
};