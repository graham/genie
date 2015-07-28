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

    var startswith = function(first, second) {
        return first.slice(0, second.length) == second;
    };

    var ResourceTracker = function() {
        this.loaded_resources = {};
    };

    ResourceTracker.prototype.load_resource = function(key, resource) {
        if (this.loaded_resources[key] != undefined) {
            document.append(resource);
            this.loaded_resources[key] = 1;
        } else {
            this.loaded_resources[key] += 1;
        }
    };

    var global_resource_tracker = new ResourceTracker();

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
            this.fire('state_will_change', key);
            this.__data__.state[key] = value;
            this.fire('state_did_change', key)
        },

        mset: function(props) {
            var t = this;
            formap(function(key, value) {
                t.set(key, value);
            }, props);
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

        once: function(type, callback) {
            var comp = this;
            var inside = function() {
                callback(arguments);
                comp.off(type, inside);
            };
            safe_append_to_key(this.__data__.event_listeners, type, inside);
        },

        off: function(key, cb) {
            if (cb == undefined) {
                delete this.__data__.event_listeners[key];
            } else {
                var dict = this.__data__.event_listeners;
                if (key == null) {
                    for (var k in dict) {
                        if (dict.hasOwnProperty(k)) {
                            var len = dict[k].length;
                            var index = dict[k].indexOf(cb);
                            if (index != -1) {
                                dict[k] = dict[k].slice(0, index).concat(dict[k].slice(index+1, len));
                            }

                        }
                    }
                } else {
                    if (dict[key] !== undefined) {
                        var len = dict[key].length
                        var index = dict[key].indexOf(cb);
                        if (index != -1) {
                            dict[key] = dict[key].slice(0, index).concat(dict[key].slice(index+1, len));
                        }
                    }
                }
                this.__data__.event_listeners = dict;
            }
        },

        fire: function(type, args) {
            if (args == undefined) {
                args = null;
            }

            var target = this.__data__.event_listeners[type];

            if (target !== undefined) {
                for(var i=0; i < target.length; i++) {
                    var cb = target[i];
                    try {
                        cb.apply(this, [args]);
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
            var smart_load = props['smart_load'] || false;
            var auto_load = props['auto_load'] || false;
            var outlets = props['outlets'] || {};
            var controllers = props['controllers'] || {};

            Component.prototype.initialize.apply(this,[state]);
            this.__data__.resources = [];
            this.__data__.env = new genie.Environment();
            this.__data__.auto_load = auto_load;
            this.__data__.outlets = outlets;
            this.__data__.controllers = controllers;

            if (target) {
                this.set_outlet('root', target);
            }

            var cache_name = 'gc_component_cache_' + url;

            if (smart_load && (localStorage.getItem(cache_name) !== null)) {
                console.log('cache hit: ' + url);
                this.load_from_content(localStorage.getItem(cache_name));
            } else {
                console.log('loading url: ' + url);
                var comp = this;
                $.get(url, function(data) {
                    if (smart_load) {
                        localStorage.setItem(cache_name, data);
                    }
                    comp.load_from_content(data);
                });
            }
        },

        set_outlet: function(key, value) {
            if (value && value.jquery) {
                this.__data__.outlets[key] = value[0];
            } else {
                this.__data__.outlets[key] = value;
            }
        },
        outlet: function(key) {
            return this.__data__.outlets[key];
        },

        set_controller: function(key, value) {
            this.__data__.controllers[key] = value;
        },
        controller: function(key) {
            return this.__data__.controllers[key];
        },

        handle_script: function(child) {
            var src = child.innerHTML;
            return "(function(component) { " + src + " })";
        },

        load_from_content: function(data) {
            var comp = this;
            var scripts = [];

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
                        scripts.push(this.handle_script(child));
                    }
                } else if (child.tagName == "TEMPLATE") {
                    if (!child.id) {
                        console.log("No id for template, Ill call it root and hope.");
                        child.id = 'root';
                    }
                    comp.__data__.env.create_template(child.id, child.innerHTML);
                } else if (child.tagName == "REQUIRE") {
                    for(var j=0; j < child.children.length; j++) {
                        var required_resource = child.children[j];
                        comp.__data__.resources.push(required_resource);
                        // Here would be the right place to ensure resources are not
                        // double added, however, ResourceManager isn't done yet.
                    }
                } else {
                    console.log("Unsupported node '" + child.tagName + "'in Component: " + child);
                }
            }

            for(var i=0; i < scripts.length; i++) {
                eval(scripts[i])(comp);
            }
            comp.delay_fire('ready');
            if (this.__data__.auto_load) {
                this.load();
            }
        },

        auto_load: function() {
            this.__data__.auto_load = true;
        },

        load_assets: function() {
            for(var i=0; i < this.__data__.resources.length; i++) {
                var obj = this.__data__.resources[i];
                if (obj.tagName == 'SCRIPT') {
                    var d = document.createElement('script');
                    d.src = obj.src;
                    document.head.appendChild(d);
                } else {
                    document.head.appendChild(obj);
                }
            }
        },

        load: function() {
            this.fire('will_load');
            this.load_assets();
            this.render();
            this.delay_fire('did_load');
        },

        reload: function() {
            this.fire('will_reload');
            this.render();
            this.delay_fire('did_reload');
        },

        unload: function() {
            this.fire('will_unload');
            this.set_outlet('root', null);
            this.delay_fire('did_unload');
        },

        render: function() {
            if (this.outlet('root') != undefined) {
                this.outlet('root').innerHTML = this.render_template('root', {});
            } else {
                console.log("you have not set a root outlet.");
            }
        },

        render_template: function(template_name, d) {
            var y = {
                'component':this
            };

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
        },

        modify: function(key, cb) {
            var data = this.get(key);
            var result = cb.apply(this, [data]);
            if (result != undefined) {
                this.set(key, result);
            }
        },

        find: function(search) {
            return $(this.outlet('root')).find(search);
        },
    });

    var ReactComponent = Class(GCComponent, {
        initialize: function(props) {
            GCComponent.prototype.initialize.apply(this, [props]);
            this.__data__.react_objs = {};
        },
        handle_script: function(child) {
            var src = child.innerHTML;
            if (child.type == 'text/jsx') {
                src = JSXTransformer.transform(src).code;
            }
            return "(function(component) { " + src + " })";
        },
        get: function(key) {
            return this.__data__.controllers['root'].state[key];
        },
        set: function(key, value) {
            this.fire('state_will_change', key);
            var d = {};
            d[key] = value;
            this.__data__.controllers['root'].setState(d)
            this.fire('state_did_change', key)
        },
        reload: function() {},
        render: function() {
            if (this.__data__.env.get_template('root') != undefined) {
                GCComponent.prototype.render.apply(this, []);
            }
        },
        unload: function() {
            this.fire('will_unload');
            React.unmountComponentAtNode(this.outlet('root'));
            this.delay_fire('did_unload');
        },
        latch: function(reactClass, divSearch, uid) {
            var outlet = this.find(divSearch)[0];
            var ReactObject = React.renderComponent(reactClass, outlet);
            this.set_controller(uid, ReactObject);
        }
    });

    // a helper function to clear the cache of templates.
    var clear_gc_cache = function() {
        var prefix = 'gc_component_cache_';
        formap(function(key, value) {
            if (startswith(key, prefix)) {
                localStorage.removeItem(key);
            }
        }, localStorage);
    };

    return {
        "Component":     Component,
        "GCComponent":   GCComponent,
        "ReactComponent":ReactComponent,
        "clear_cache":   clear_gc_cache,
        "resource":      global_resource_tracker
    };
})();

if (typeof genie_module !== 'undefined') {
    genie_module.exports.mvc = mvc;
    genie_module.exports.Component = mvc.Component;
    genie_module.exports.GCComponent = mvc.GCComponent;
    genie_module.exports.clear_cache = mvc.clear_cache;
}
