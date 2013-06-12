/*
Copyright [2013] [Graham Abbott <graham.abbott@gmail.com>]

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

/* ut : (+ subj.) (purpose) in order that, to, that.  
   
 ut - javascript controlled execution

 Intro:
  Ut is a simple javascript library that makes coordinating javascript
  execution much easier. 

*/

var ut = (function() {
    var FAILED = 0;
    var FINISHED = 1;
    var do_nothing = function() {};
        
    var Tracker = function(id, parent, callback) {
        this.id = id;
        this.parent = parent;
        this.callback = callback || do_nothing;
        this.result = null;
    };

    Tracker.prototype.run = function(args) {
        try {
            if (args == undefined) {
                this.callback(this);
            } else {
                this.callback(this, args);
            }
        } catch (e) {
            console.log(e);
            this.fail(e);
        }
    };
    
    Tracker.prototype.finish = function(result) {
        this.result = result;
        this.parent.report(this, FINISHED);
    };
    
    Tracker.prototype.fail = function(result) {
        this.result = result;        
        this.parent.report(this, FAILED);        
    };

    var ParalellExecution = function(on_success, on_error) {
        this.pending = {};
        this.finished = [];
        this.errors = [];
        this.on_success = on_success || do_nothing;
        this.on_error = on_error || do_nothing;
        this.all_started = false;
        this.max_id = 0;
    };

    ParalellExecution.prototype.run = function(items) {
        var e = this;
        var id = 0;
        for(var i in items) {
            var obj = items[i];
            var t = new Tracker(id, e, obj);
            t.run();
            this.pending[id] = t;
            id = id + 1;
        }
        this.max_id = id;
        this.all_started = true;
        this.check();
    };

    ParalellExecution.prototype.report = function(tracker, status) {
        this.pending[tracker.id] = null;
        if (status == FINISHED) {
            this.finished.push(tracker);
        } else if (status == FAILED) {
            this.errors.push(tracker);
        }
        this.check();
    };

    ParalellExecution.prototype.check = function() {
        if (this.all_started == false) {
            return;
        }

        if (this.pending_count() == 0) {
            if (this.errors.length > 0) {
                this.on_error(this.finished, this.errors);
            } else {
                this.on_success(this.finished);
            }
        }
    };

    var paralell = function(items, success, failure) {
        var se = new ParalellExecution(success, failure);
        se.run(items);
    };


    var SerialExecution = function(on_success, on_error) {
        this.pending = {};
        this.finished = [];
        this.errors = [];
        this.on_success = on_success || do_nothing;
        this.on_error = on_error || do_nothing;
        this.all_started = false;
        this.max_id = 0;

        this.current_index = 0;
        this.items = [];
        this.last_data = undefined;
    };

    SerialExecution.prototype.pending_count = function() {
        var working = 0;
        for (var key in this.pending) {
            var obj = this.pending[key];
            if (obj != null) {
                working = working + 1;
            }
        }
        return working;
    };

    SerialExecution.prototype.run = function(items) {
        var e = this;
        this.items = items;
        this.iterate();
    };

    SerialExecution.prototype.iterate = function() {
        if (this.current_index >= this.items.length) {
            this.all_started = true;
        } else {
            var e = this;
            var obj = this.items[this.current_index];
            this.current_index += 1;
            this.max_id = this.max_id + 1;

            var t = new Tracker(this.max_id, e, obj);
            t.run(this.last_data);
            this.pending[this.max_id] = t;
        }
        this.check();
    };

    SerialExecution.prototype.report = function(tracker, status) {
        this.pending[tracker.id] = null;
        if (status == FINISHED) {
            this.finished.push(tracker);
            this.last_data = tracker.result;
        } else if (status == FAILED) {
            this.errors.push(tracker);
            this.on_error(this.finished, this.errors);
            return;
        }
        this.check();
    };

    SerialExecution.prototype.check = function() {
        if (this.all_started == false) {
            if (this.pending_count() == 0) {
                this.iterate();
            }
            return;
        }

        if (this.pending_count() == 0) {
            if (this.errors.length > 0) {
                this.on_error(this.finished, this.errors);
            } else {
                this.on_success(this.last_data);
            }
        }
    };

    var serial = function(asdf, items, success, failure) {
        var se = new SerialExecution(success, failure);
	se.last_data = asdf();
        se.run(items);
    };

    return {'Tracker':Tracker, 'serial':serial, 'paralell':paralell, 'do_nothing':do_nothing};
})();