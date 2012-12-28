var log = null;

if (exports === undefined) {
    log = console.log;
} else {
    log = console.log;
}

var Eventable = function() {
    this.listeners = {};
    log('created');
};

Eventable.prototype.listen = function(event_type, object) {
    if (this.listeners[event_type] === undefined) {
    this.listeners[event_type] = [];
    this.listeners[event_type].push(object);
    } else {
    this.listeners[event_type].push(object);
    }
};

Eventable.prototype.unlisten = function(event_type, object) {
    if (this.listeners[event_type] === undefined) {
    // pass
    } else {
    if (object === undefined) {
        this.listeners[event_type] = undefined;
    } else {
        this.listeners[event_type].filter( function(item, index) {
            if (item === object) {
            return false;
            } else { 
            return true;
            }
        });
    }
    }
};

Eventable.prototype.remove_listener = function(object) {
    for( var key in this.listeners ) {
    this.listeners[key] = this.listeners[key].filter( function(item, index) {
        if (item === object) {
            return false;
        } else {
            return true;
        }
        });
    }
}

Eventable.prototype.fire = function(event_type, event) {
    if (this.listeners[event_type] === undefined) {
    // pass nobody is listening.
    } else {
    var results_l = [];
    for( var i=0; i < this.listeners[event_type].length; i++ ) {
        var listener = this.listeners[event_type][i];
        if (typeof listener === "function") {
        try {
            result = listener(event_type, event);
            results_l.push(result);
        } catch (e) {
            log('Event handle failed, removing ' + event_type + ' : ' + listener + ' *** ' + e);
            results_l.push(false);
        }
        } else if (typeof listener === "object") {
        try {
            result = listener.on_event(event_type, event);
            results_l.push(result);
        } catch (e) {
            log('Event handle failed, removing ' + event_type + ' : ' + listener + ' *** ' + e);
            results_l.push(false);
        }
        }
    }

    // or
    this.listeners[event_type] = this.listeners[event_type].filter( function(item, index) {
        return results_l[index];
        });
    }
};

var Collector = function(callback, timeout) {
    this.waiting_for = [];
    this.finished = [];
};

Collector.prototype.add = function(id) {
    this.waiting_for.push(id);
};

Collector.prototype.ping = function(id) {
    if (this.waiting_for.indexOf(id) != -1) {
    this.waiting_for = this.waiting_for.filter( function(item, index) {
        if (item == id) {
            return false;
        } else {
            return true;
        }
        });
    this.finished.push(id);
    }
};

Collector.prototype.is_complete = function(callback, waitfor) {
    if (this.waiting_for.length == 0) {
    callback(true);
    } else {
    var coll = this;
    setTimeout( function() {
        coll.is_complete(callback, waitfor);
        }, waitfor);
    }
}

Collector.prototype.wait = function(callback, waitfor) {
    var wait_ms = 1000;
    if (waitfor !== undefined) {
    wait_ms = waitfor;
    }

    var coll = this;
    setTimeout(function() {
        coll.is_complete(callback, waitfor);
    }, wait_ms);
};


var Messageable = function() {
    this.mailbox = [];
};

Messageable.prototype.send = function(object) {
    this.mailbox.push(object);
};

Messageable.prototype.poll = function() {
    if (this.mailbox.length > 0) {
    return true;
    } else {
    return false;
    }
};

Messageable.prototype.receive = function(object) {
    if (this.poll()) {
    return this.mailbox.shift();
    } else {
    return undefined;
    }
}
    
if (exports === undefined) {
    var ables = {};
    var exports = ables;
}

exports.Eventable = Eventable;
exports.Collector = Collector;
exports.Messageable = Messageable;

// Adding this test.

Resourceable = function(resource_name, callback) {
    this.cache = {};
}


