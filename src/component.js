/*
Copyright [2014] [Graham Abbott <graham.abbott@gmail.com>]

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

var mvc = (function() {
    var safe_append_to_key = function(list, key, value) {
        if (list[key] == undefined) {
            list[key] = [value];
        } else {
            list[key].push(value);
        }
    }

    var Component = Class.extend({
        init: function(state) {
            this.__data__ = {};
            this.__data__.event_listeners = {};
            this.__data__.state = state || {};
        },

        // This shouldn't be over ridden by subclasses.
        load: function() { },

        get: function(key) {
            return this.__data__.state[key];
        },
    
        set: function(key, value) {
            this.fire('state_will_change', {'key':key});
            this.__data__.state[key] = value;
            this.fire('state_did_change', {'key':key});
        },
    
        on: function(type, callback) {
            safe_append_to_key(this.__data__.event_listeners, type, callback);
        },

        off: function(key) {
            delete this.__data__.event_listeners[key];
        },

        fire: function(type, args) {
            if (args == undefined) {
                args = {};
            }
            
            var target = this.__data__.event_listeners[type];
            if (target !== undefined) {
                for(var i=0; i < target.length; i++) {
                    var cb = target[i];
                    try {
                        cb(args);
                    } catch (e) {
                        console.log(e);
                        console.log("error for event '" + type + "' -> ");
                        console.log(cb);
                    }
                }
                return true;
            } else {
                return false;
            }
        },

        reload: function() {}

    });

    var DOMComponent = Component.extend({
        init: function(target_dom_element, template, state) {
            this._super(state);

            // this should be the raw dom element, not a wrapped jquery one.
            this.__data__.target_dom_element = target_dom_element;
            
            // this should be a genie template object, or anything 
            // that responds to obj.render({});
            this.__data__.template = template;
        },

        load: function() {
            this.__data__.target_dom_element.innerHTML = this.__render_template__();
            setTimeout((function(t) { t.fire('ready'); })(this), 1);
        },

        reload: function() {
            this.__data__.target_dom_element.innerHTML = this.__render_template__();
            setTimeout((function(t) { t.fire('did_reload'); })(this), 1);
        },

        __render_template__: function() {
            return this.__data__.template.render(this.__data__.state);
        }
    });

    // Genie Component - Prefix
    // A counter for your page, that will count ever second.
    var GCCounter = DOMComponent.extend({
        tick: function() {
            var t = this;
            var secs = this.get('seconds');
            this.set('seconds', secs + 1);
            setTimeout(function() { 
                t.tick();
            }, 1000);
        }
    });

    return {
        "Component":Component,
        "DOMComponent":DOMComponent,
        "GCCounter":GCCounter
    };
})();
