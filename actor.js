var Director = function() {
    this.actors = [];
};

Director.prototype.add_actor = function(actor, priority) {
    if (priority == 1) {
        this.actors.push(actor);
    } else {
        this.actors.push(actor);
    }
};

Director.prototype.remove_actor = function(actor) {
    actor.active = false;
};

Director.prototype.iterate = function() {
    var waiting = this.actors.filter( function(a) { return a.active && a.pending && a.on_message; } );
    for( var i = 0; i < waiting.length; i++ ) {
        waiting[i].process();
    }
    this.actors = this.actors.filter( function(a) { return (a.on_message != null) } );
};

var Actor = function() {
    this.active = true;
    this.pending = false;
    this.timed_out = false;
    this.mailbox = [];
    this.on_message = null;
    this.on_timeout = null;
};

Actor.prototype.receive = function(f) {
    if (this.active) {
        this.on_message = f;
    } else {
        throw "This Actor is no longer active.";
    }
};

Actor.prototype.send = function(message) {
    if (this.active) {    
        this.mailbox(message);
        this.pending = true;
    } else {
        throw "This Actor is no longer active.";
    }
};

Actor.prototype.process = function() {
    if (this.pending && this.mailbox.length == 0) {
        var message = this.mailbox.shift();
        this.on_message(message);
    }
};

