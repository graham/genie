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

/* Example Component

		<style type='text/css'> 
		 #counter { 
		   font-size: 50px;
		 }
		</style> 

		<script type='text/javascript'>
		 component.on('ready', function() {
		     this.set('running', true);
		     this.set('ticks', 0);
		     this.load();
		 });

		 component.on('loaded', function() {
		     this.tick(100);
		 });

		 component.methods({
		     tick: function(ms) {
		         var sleep = ms || 1000;
		         this.reload();
		         this.wait(function() {
		             var secs = this.get('ticks');
		             this.set('ticks', secs+1);
		             this.tick(sleep);
		         }, sleep);
		     }     
		 });
		</script>

		<template type='text/template' id='root'>
		  <div id='counter'>
		    [% if v.ticks == 1 %]
		      [[v.ticks]] second has passed.
		    [% else %] 
		      [[v.ticks]] seconds have passed.
		    [% end %]
		  </div>
		</template> 

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
            this.__data__.target_dom_element = null;
            this.__data__.event_listeners = {};
            this.__data__.state = state || {};
        },

        set_target: function(dom_element) {
            this.__data__.target_dom_element = dom_element;
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
                        cb.apply(this, args);
                    } catch (e) {
                        console.log(e.message);
                        console.log(e.stack);
                        console.log("error for event '" + type + "' -> ");
                        console.log(cb);
                    }
                }
                return true;
            } else {
                return false;
            }
        },

        delay_fire: function(key, delay) {
            if (delay == undefined) {
                delay = 1;
            }
            setTimeout((function(t, k) { return (function() { t.fire(k); }); })(this,key), delay);
        },

        wait: function(cb, ts) {
            setTimeout((function(t,c) { return (function() { c.apply(t, []); }); })(this,cb), ts);
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
            this.delay_fire('loaded');
        },

        reload: function() {
            this.__data__.target_dom_element.innerHTML = this.__render_template__();
            this.delay_fire('did_reload');
        },

        __render_template__: function() {
            return this.__data__.template.render(this.__data__.state);
        }
    });

    var GCComponent = Component.extend({
        init: function(url, state, target) {
            this._super(state);
            this.__data__.resources = [];
            this.__data__.env = new genie.Environment();

            if (target) {
                this.set_target(target);
            }

            var comp = this;
            var scripts = [];

            $.get(url, function(data) {
                var d = document.createElement('div');
                d.innerHTML = data;
                for(var i=0; i < d.children.length; i++) {
                    var child = d.children[i];
                    if (child.tagName == "STYLE") {
                        comp.__data__.resources.push(child);
                    } else if (child.tagName == "SCRIPT") {
                        var new_script = "(function(component) { " + child.innerText + " })";
                        scripts.push(new_script);
                    } else if (child.tagName == "TEMPLATE") {
                        comp.__data__.env.create_template(child.id, child.innerHTML);
                    } else {
                        console.log("Unsupported node '" + child.tagName + "'in Component: " + url);
                    }
                }

                for(var i=0; i < scripts.length; i++) {
                    eval(scripts[i])(comp);
                }

                comp.fire('ready');
            });
        },

        load: function() {
            for(var i=0; i < this.__data__.resources.length; i++) {
                document.body.appendChild(this.__data__.resources[i]);
            }
            var target = this.__data__.target_dom_element;
            var content = this.__data__.env.render('root', this.__data__.state);
            target.innerHTML = content;
            this.delay_fire('loaded');
        },

        reload: function() {
            var target = this.__data__.target_dom_element;
            var content = this.__data__.env.render('root', this.__data__.state);
            target.innerHTML = content;
            this.delay_fire('did_reload');
        }
        
    });

    // Genie Component - Prefix
    // A counter for your page, that will count ever second.
    var GCCounter = DOMComponent.extend({
        tick: function(ms) {
            var sleep = ms || 1000;
            var t = this;
            var secs = this.get('ticks');
            this.set('ticks', secs + 1);
            setTimeout(function() { 
                t.tick(sleep);
            }, sleep);
        }
    });

    return {
        "Component":Component,
        "DOMComponent":DOMComponent,
        "GCCounter":GCCounter,
        "GCComponent":GCComponent
    };
})();


