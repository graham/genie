var GeniePromise = (function() {
    var pass = function() {};

    var GeniePromise = function(options) {
        this.data = {};

        this.flag_next = false;
        this.final_result = undefined;
        this.call_queue = [];
        this.call_index = 0;
        this.is_loop = false;
        this.stopped = false;
        this.last_arg = undefined;
    };

    GeniePromise.prototype.set = function(key, value) {
        this.data[key] = value;
    };

    GeniePromise.prototype.get = function(key) {
        return this.data[key];
    };

    GeniePromise.prototype.test = function(key) {
        if (this.data[key] !== undefined) {
            return true;
        } else {
            return false;
        }
    };
    
    GeniePromise.prototype.then = function(success, failure) {
        this.call_queue.push( [success, failure] );
        return this;
    };
    
    GeniePromise.prototype.call_next = function() {
        if (this.stopped) { return; }

        if (this.call_index >= this.call_queue.length) {
            if (this.is_loop) {
                this.run();
            }
            this.stopped = true;
            return;
        }

        var current = this.call_queue[this.call_index];
        this.call_index += 1;

        var success = current[0];
        var failure = current[1];

        try {
            result = success.apply(this, [this].concat(this.last_arg));
        } catch (e) {
            console.log("Error: " + e);
            if (failure) {
                failure(this, e);
            } else {
                console.log(e);
            }
            result = null;
        }
    };

    GeniePromise.prototype.sleep = function(timeout) {
        var p = this;
        this.call_queue.push( [ function() { 
            setTimeout( function() {
                console.log("boop: " + timeout);
                p.call_next();
            }, timeout);
        }, pass] );
        return this;
    };

    GeniePromise.prototype.next = function() {
        this.last_arg = arguments;
        var p = this;
        setTimeout(function() { p.call_next(); }, 1);
    };
    
    GeniePromise.prototype.run = function() {
        this.se;
        this.call_index = 0;
        this.next();
        return this;
    };

    GeniePromise.prototype.loop = function() {
        this.is_loop = true;
        this.run();
        return this;
    };
    
    GeniePromise.prototype.stop = function() {
        this.stopped = true;
    };

    GeniePromise.prototype.map = function(f, l) {
        for(var i = 0; i < l.length; i++) {
            this.then(function(p) { f(l[i], p); });
        }
    };

    GeniePromise.prototype.fold = function() {
        
    };

    return GeniePromise;
})();
