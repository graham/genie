var Shell = function(root) {
    console.log("create shell");
    this.reset();
    if (root) {
        this.initialize(root);
        this.refresh();
    }
}
Shell.prototype = new Terminal();

Shell.prototype.initialize = function(root) {
    console.log("Shell init");
    this.prev_buf = document.createElement('div');
    root.appendChild(this.prev_buf);
    
    Terminal.prototype.initialize.call(this, root);

    this.commands = {};
    this.commands['clear'] = function(term) { term.prev_buf.innerHTML = ''; term.lines = ['']; term.refresh(); }
    this.commands['alert'] = function(term, arglist, raw) { term.emit("<div style='font-size: 20px; color: red;'>" + raw + "</div>"); }    
    this.keys_dict['13'] = function(term) { term.command_newline(); }
    this.modified_dict['control-u'] = function(term) { term.lines[term.current_line] = ''; }
    this.modified_dict['control-t'] = function(term) { term.trim(); }
    this.genie_terminal_line_template = "<div class='genie-terminal-line'>{{v.line}}</div>";
    this.env.create_template('genie-terminal-line-template', this.genie_terminal_line_template);
    this.prompt = 'user@localhost$ ';
    this.refresh();
}


Shell.prototype.command_newline = function() {
    this.emit( this.prompt + this.get_current_line() );
    this.eval_input(this.get_current_line());
    this.refresh_line();
    this.lines = [''];
    this.focus();
}

Shell.prototype.eval_input = function(data) {
    if (data.length == 0) {
        return;
    }
    var command = data.split(' ', 1);
    var rest = data.split(' ').slice(1);
    var f = this.commands[command];
    if ( f == undefined ) {
        this.emit("The command '" + command + "' is not defined.");
    } else {
        f(this, rest, rest.join(' '));
    }
}

Shell.prototype.emit_lines = function(lines) {
    if (lines.length == 1) {
        this.prompt += lines[lines.length-1];
        this.refresh_line();
    } else {
        for(var i = 0; i < lines.length-1; i++) {
            this.emit(lines[i]);
        }
        this.prompt = lines[lines.length-1];
    }
}

Shell.prototype.emit = function(data) {
    this.history.push(data);
    
    var d = document.createElement('div');
    d.innerHTML = this.env.render('genie-terminal-line-template', {'line':data});
    this.prev_buf.appendChild( d );
    this.focus();
}

Shell.prototype.jemit = function(data) {
    this.emit( JSON.stringify(data) );
}

Shell.prototype.trim = function(min) {
    if (min == undefined) {
        min = 10;
    }
    while( this.prev_buf.children.length > 10 ) {
        this.prev_buf.removeChild( this.prev_buf.children[0] );
    }
}