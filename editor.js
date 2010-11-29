var EditorEmacs = function(root) {
    console.log("create editor");
    this.reset();
    if (root) {
        this.initialize(root);
        this.refresh();
    }
}
EditorEmacs.prototype = new Terminal();

EditorEmacs.prototype.initialize = function(root) {
    console.log("EditorEmacs init");
    Terminal.prototype.initialize.call(this, root);
    
    this.keys_dict['9'] = function(term) { term.command_tabin(); }
    this.keys_dict['13'] = function(term) { term.command_newline(); }
    this.modified_dict['control-u'] = undefined;
    this.modified_dict['shift-alt-,'] = function(term) {
        term.current_line = 0;
        term.cursor_location = 0;
    }
    this.modified_dict['shift-alt-.'] = function(term) {
        term.current_line = term.lines.length-1;
        term.cursor_location = term.lines[term.current_line].length;
    }
}

EditorEmacs.prototype.log = function(message) {
    this.error_log.innerHTML = "> " + message;    
}

EditorEmacs.prototype.command_tabin = function() {
    var line = this.lines[this.current_line];

    if (this.current_line == 0) {
        while( line.charAt(0) == ' ' && line.length != 0) {
            line = line.substring(1);
            this.cursor_location -= 1;
        }
    } else {
        // get indent of line above.
        var prev_line = this.lines[this.current_line-1];
        var prev_indent = 0;
        while(prev_indent != prev_line.length && prev_line.charAt(prev_indent) == ' ') {
            prev_indent += 1;
        }

        while( line.charAt(0) == ' ' && line.length != 0) {
            line = line.substring(1);
            this.cursor_location -= 1;
        }
        for(var i=0; i < prev_indent; i++) {
            line = ' ' + line;
            this.cursor_location += 1;
        }
        if (this.cursor_location < prev_indent) {
            this.cursor_location = prev_indent;
        }
    }
    
    this.lines[term.current_line] = line;
}

EditorEmacs.prototype.command_newline = function() {
    var line = this.lines[this.current_line];
    var pre = line.substring(0, this.cursor_location);
    var post = line.substring(this.cursor_location, line.length);
    
    var pre_line = this.lines.slice(0, this.current_line);
    var post_line = this.lines.slice(this.current_line, this.lines.length);
    
    this.lines = pre_line.concat([pre]).concat(post_line);
    this.current_line += 1;
    this.cursor_location = 0;
    this.lines[this.current_line] = post;
}

EditorEmacs.prototype.reset = function() {
    this.lines = [''];
    this.current_line = 0;
    this.cursor_location = 0;
    this.prompt = '';
}

