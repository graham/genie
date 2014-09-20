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

		 component.on('did_load', function() {
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
        return list;
    };

    var formap = function(fun, dict) {
        for (var key in dict) {
            if (dict.hasOwnProperty(key)) {
                fun(key, dict[key]);
            }
        }
    };

    var Component = Class({
        initialize: function(state) {
            this.__data__ = {};
            this.__data__.event_listeners = {};
            this.__data__.state = state || {};
        },

        get: function(key) {
            return this.__data__.state[key];
        },
    
        set: function(key, value) {
            this.fire('state_will_change', {'key':key});
            this.__data__.state[key] = value;
            this.fire('state_did_change', {'key':key});
        },

        require_vars: function(l) {
            var hit = false;
            for(var i=0; i < l.length; i++) {
                if (this.get(l[i]) == undefined) {
                    console.log("MISSING VAR: " + l[i]);
                    hit = true;
                }
            }
            if (hit) {
                return false;
            } else {
                return true;
            }
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
        }
    });

    var GCComponent = Class(Component, {
        initialize: function(props) {
            var url = props['url'];
            var target = props['target'];
            var state = props['state'] || {};
            
            this.$super('initialize', state);
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
                    if (child.tagName == "STYLE" || child.tagName == "LINK") {
                        comp.__data__.resources.push(child);
                    } else if (child.tagName == "SCRIPT") {
                        if (child.src) {
                            comp.__data__.resources.push(child);
                        } else {
                            var new_script = "(function(component) { " + child.innerHTML + " })";
                            scripts.push(new_script);
                        }
                    } else if (child.tagName == "TEMPLATE") {
                        if (!child.id) {
                            console.log("No id for template, Ill call it root and hope.");
                            child.id = 'root';
                        }
                        comp.__data__.env.create_template(child.id, child.innerHTML);
                    } else {
                        console.log("Unsupported node '" + child.tagName + "'in Component: " + url);
                    }
                }

                for(var i=0; i < scripts.length; i++) {
                    eval(scripts[i])(comp);
                }
                comp.delay_fire('ready');
            });
        },

        set_target: function(target) {
            this._target = target;
        },

        load: function() {
            for(var i=0; i < this.__data__.resources.length; i++) {
                var obj = this.__data__.resources[i];
                console.log(obj.tagName);
                if (obj.tagName == 'SCRIPT') {
                    var d = document.createElement('script');
                    d.src = obj.src;
                    document.head.appendChild(d);
                } else {
                    document.head.appendChild(obj);
                }
            }
            var target = this._target;
            var content = this.__data__.env.render('root', this.__data__.state);
            target.innerHTML = content;
            this.delay_fire('did_load');
        },

        reload: function() {
            var target = this._target;
            var content = this.__data__.env.render('root', this.__data__.state);
            target.innerHTML = content;
            this.fire('did_reload');
        },

        render: function(template_name, d) {
            var y = {};
            formap(function(k, v) {
                y[k] = v;
            }, this.__data__.state);
            if (d) {
                formap(function(k, v) {
                    y[k] = v;
                }, d);
            }
            var content = this.__data__.env.render(template_name, y);
            return content;
        }
    });

    return {
        "Component":     Component,
        "GCComponent":   GCComponent
    };
})();

if (typeof module !== 'undefined') {
    module.exports.mvc = mvc;
    module.exports.Component = mvc.Component;
    module.exports.GCComponent = mvc.GCComponent;
}
