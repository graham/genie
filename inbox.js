var Inbox = function(root) {
    this.reset();
    if (root) {
        this.initialize(root);
        this.refresh();
    }
};

Inbox.prototype = new Terminal();

Inbox.prototype.initialize = function(root) {
    console.log("Inbox init");
    Terminal.prototype.initialize.call(this, root);

    this.keys_dict['13'] = function(term) { term.command_newline(); }
    this.modified_dict['control-u'] = function(term) { term.lines[term.current_line] = ''; }
    this.modified_dict['control-t'] = function(term) { term.trim(); }
    this.refresh();
};

Inbox.prototype.refresh = function() {
    
};

Inbox.prototype.add_item = function() { };
Inbox.prototype.remove_item = function() { };
Inbox.prototype.remove_current_item = function() { };
