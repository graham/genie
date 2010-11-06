var last_event = null;

var Terminal = function(root) {
    this.keys_dict = {"48": "0", "49": "1", "50": "2", "51": "3", "52": "4", "53": "5", "54": "6", "55": "7", 
                      "56": "8",  "57": "9", "65": "a", "66": "b", "67": "c", "68": "d", "69": "e", 
                      "70": "f", "71": "g", "72": "h", "73": "i", "74": "j", "75": "k", "76": "l", "77": "m", 
                      "78": "n", "79": "o", "80": "p", "81": "q", "82": "r", "83": "s", "84": "t", "85": "u", "86": 
                      "v", "87": "w", "88": "x", "89": "y", "90": "z", "186": ";", "187": "=", "188": ",", 
                      "189": "-", "190": ".", "191": "/", "192": "`", "219": "[", "220": "\\", "221": "]", "222": "'",
		      "229": "q"
                      };

    this.key_names =  { "48": "0", "49": "1", "50": "2", "51": "3", "52": "4", "53": "5", "54": "6", "55": "7", 
                        "56": "8",  "57": "9", "65": "a", "66": "b", "67": "c", "68": "d", "69": "e", 
                        "70": "f", "71": "g", "72": "h", "73": "i", "74": "j", "75": "k", "76": "l", "77": "m", 
                        "78": "n", "79": "o", "80": "p", "81": "q", "82": "r", "83": "s", "84": "t", "85": "u", "86": 
                        "v", "87": "w", "88": "x", "89": "y", "90": "z", "186": ";", "187": "=", "188": ",", 
                        "189": "-", "190": ".", "191": "/", "192": "`", "219": "[", "220": "\\", "221": "]", "222": "quote", 
                        "32":"space", "8":"backspace", "13":"enter", '229':'q'
                       };

    this.modified_dict = {
        "shift-1":"!", "shift-2":"@", 'shift-3':'#', 'shift-4':'$', 'shift-5':'%',
	'shift-6':'^', 'shift-7':'&', 'shift-8':'*', 'shift-9':'(', 'shift-0':')',
	'shift--':'_', 'shift-=':'+', 'shift-`':'~',

	'shift-a':'A', 	'shift-b':'B', 	'shift-c':'C', 	'shift-d':'D', 	'shift-e':'E', 
	'shift-f':'F', 	'shift-g':'G', 	'shift-h':'H', 	'shift-i':'I', 	'shift-j':'J', 
	'shift-k':'K', 	'shift-l':'L', 	'shift-m':'M', 	'shift-n':'N', 	'shift-o':'O', 
	'shift-p':'P', 	'shift-q':'Q', 	'shift-r':'R', 	'shift-s':'S', 	'shift-t':'T', 
	'shift-u':'U', 	'shift-v':'V', 	'shift-w':'W', 	'shift-x':'X', 	'shift-y':'Y',
	'shift-z':'Z', 
	
	'shift-;':':', 'shift-quote':'"', 'shift-[':'{', 'shift-]':'}', 'shift-/':'?',
    }

	this.input_buf = '';
    this.prompt = '>>> ';
    this.cursor = '_';

    this.genie_terminal_line_template = "<div class='genie-terminal-line'>{{v.line}}</div>";
    this.genie_buffer_template = "{% for line in v.lines %} <div class='genie-terminal-line'>{{line}}</div> {% end %}";
    this.genie_input_template = "<div id='genie-terminal-prompt'><span>{{v.prompt}}</span> <span id='genie-current-entry'>{{v.input_buf}}</span><span id='genie-current-cursor' style='color: gray;'>{{v.cursor}}</span></div>";

    this.keys_dict['8'] = this.command_backspace;
    this.keys_dict['32'] = this.command_space;
    this.keys_dict['13'] = this.eval_line;
    
    this.modified_dict['control-g'] = this.cancel_combo;
    this.modified_dict['control-x'] = '!push!';
	this.modified_dict['control-l'] = function(term) {
		term.refresh();
	}
	
    //this.modified_dict['control-x control-s'] = function(term) { term.emit("<h1>Saved!</h1>"); };
    //this.modified_dict['control-u'] = function(term) { term.input_buf = ''; };

    this.modified_dict['meta-r'] = function(term) {
		if (confirm("Are you sure you want to reload?")) {
		    document.location.reload();
		}
    }
    
    this.root = root;
    this.root.innerHTML = '';
    this.lines = [];
    this.env = new genie.Environment();
    
    this.env.create_template('genie-terminal-line-template', this.genie_terminal_line_template);
    this.env.create_template('genie-buffer-template', this.genie_buffer_template);
    this.env.create_template('genie-input-template', this.genie_input_template);
    
    this.buffer = document.createElement('div');
    this.input = document.createElement('div');
    this.below = document.createElement('div');
    this.error_log = document.createElement('div');
    this.error_log.style.cssText = 'position: absolute; padding: 10px; width: 300px; height: 50px; font-size: 20px; background-color: #444; top: 10px; right:10px; border: 1px #999;';
    
    this.root.appendChild(this.buffer);
    this.root.appendChild(this.input);
    this.root.appendChild(this.below);
    this.root.appendChild(this.error_log);

    this.history = [];
    this.command_stack = [];
    this.key_timeout = null;
    this.key_timeout_time = 1000;
    
    this.refresh();
    this.log("Testing Log");
}

Terminal.prototype.log = function(message) {
    this.error_log.innerHTML = message;
}

Terminal.prototype.refresh = function() {
    this.buffer.innerHTML = this.env.render_template('genie-buffer-template', {'lines':this.lines, 'input_buf':this.input_buf, 'cursor':'_'});
    this.refresh_input();
}

Terminal.prototype.refresh_input = function() {
    this.input.innerHTML = this.env.render_template('genie-input-template', {'input_buf':this.input_buf, 'cursor':this.cursor, 'prompt':this.prompt});
    this.focus();
}

Terminal.prototype.reset = function() {
    this.lines = [];
    this.input_buf = '';
    this.refresh();
}

Terminal.prototype.focus = function() {
    window.scrollTo(0, this.below.getPosition().y);
}

Terminal.prototype.emit = function(data) {
    var d = document.createElement('div');
    d.innerHTML = this.env.render_template('genie-terminal-line-template', {'line':data});
    this.buffer.appendChild( d );
}

Terminal.prototype.trim = function(min) {
    if (min == undefined) {
        min = 10;
    }
    while( this.buffer.children.length > 5 ) {
        this.buffer.removeChild( this.buffer.children[0] );
    }
    
}

Terminal.prototype.keydown = function(event) {
    last_event = event;
    var modifier = '';
    
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

    if (event.keyCode == 16 || event.keyCode == 17 || event.keyCode == 18 || event.keyCode == 91) {
        this.refresh_input();
        return;
    }
    
    var name = this.key_names[event.keyCode];
    var key = this.keys_dict[event.keyCode];
    var guess = key;
    var full_modifier = modifier;
    
    if (typeof guess == 'function' && !modifier) {
        guess = guess(this);
    }
    
    if (this.command_stack.length && (modifier+guess) != 'control-g') {
        full_modifier = this.command_stack.join(' ') + ' ' + modifier;
    } 
    
    if (full_modifier) {
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
        } else {
            this.command_stack = [];
            if (guess != undefined) {
				this.insert_at_cursor(guess);
            } else {
                this.emit(full_modifier + name + ' is not defined. (' + mod_name +')');
            }
        }
    } else {
        if (guess != undefined) {
			this.insert_at_cursor(guess);
        }
    }

    this.refresh_input();
    event.stopPropagation();
}

Terminal.prototype.insert_at_cursor = function(data) {
	this.input_buf += data;
}

Terminal.prototype.backspace_at_cursor = function() {

}

Terminal.prototype.command_backspace = function(term) {
    if (term.input_buf.substring(term.input_buf.length-6) == '&nbsp;') {
        term.input_buf = term.input_buf.substring(0, term.input_buf.length - 6);
    } else {
        term.input_buf = term.input_buf.substring(0, term.input_buf.length - 1);
    }
    term.refresh_input();
}

Terminal.prototype.command_space = function(term) {
    term.input_buf += "&nbsp;";
    term.refresh_input();
}

Terminal.prototype.eval_line = function(term) {
    term.emit(term.env.render_template('genie-terminal-line-template', {'line': term.prompt + term.input_buf}));
    term.emit(term.input_buf);
    term.input_buf = '';
    term.refresh_input();
}

Terminal.prototype.cancel_combo = function(term) {
    term.command_stack = [];
    term.refresh_input();
    term.emit('quit');
}

var EditorEmacs = function(root) {
	this.inheritFrom = Terminal;
	this.inheritFrom(root);
}

EditorEmacs.prototype = Terminal.prototype;

EditorEmacs.prototype.log = function(message) {
    this.error_log.innerHTML = "> " + message;	
}

