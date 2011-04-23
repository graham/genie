var WebSocketConnection = function(root) {
    console.log("create websocket connection");
    this.reset();
    var ws = null;
    if (root) {
        this.initialize(root);
        this.refresh();
    }
    
    if ("WebSocket" in window) {
        var term = this;
        ws = new WebSocket("ws://localhost:9001/");

        if (!ws) {
            term.emit("Connection Failed.");
            return;
        }
        
        ws.onopen = function() {
            term.emit("connection successful.");
        };

        ws.onmessage = function(event) {
            var msg = event.data;
            term.emit_lines(msg.split('\n'));
        };

        ws.onclose = function() {
            term.emit("This connection has been closed.");
        };
        this.ws = ws;
    } else {
        this.lines = ['Sorry but your browser does not support websockets'];
    }
    
}
WebSocketConnection.prototype = new Shell();
WebSocketConnection.prototype.initialize = function(root) {
    console.log("WebSocketConnection init");
    this.prev_buf = document.createElement('div');
    root.appendChild(this.prev_buf);
    
    Terminal.prototype.initialize.call(this, root);

    this.keys_dict['13'] = function(term) { term.command_newline(); }
    this.keys_dict['9'] = function(term) { term.command_tabin(); }    
    this.modified_dict['control-u'] = function(term) { term.lines[term.current_line] = ''; }
    this.modified_dict['control-t'] = function(term) { term.trim(); }
    
    this.genie_terminal_line_template = "<div class='genie-terminal-line'>{{v.line}}</div>";
    this.env.create_template('genie-terminal-line-template', this.genie_terminal_line_template);
}

WebSocketConnection.prototype.command_tabin = function() {
    this.lines[this.current_line] += '--';
    this.cursor_location = this.lines[this.current_line].length;
}

WebSocketConnection.prototype.command_newline = function() {
    var d = this.get_current_line();
    this.emit( this.prompt + d );
    this.prompt = '';
    this.eval_input(d);
    this.lines = [''];
    this.refresh_line();
    this.focus();
}

WebSocketConnection.prototype.eval_input = function(data) {
    if (this.ws !== undefined) {
        this.ws.send(data);
    }
}