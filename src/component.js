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

    var Component = function() {
        this.__data__ = {};
        this.__data__.event_listeners = {};
    };
    
    Component.prototype.init = function() {};
    Component.prototype.on_load = function() {};
    Component.prototype.will_show = function() {};
    Component.prototype.did_show = function() {};
    Component.prototype.will_hide = function() {};
    Component.prototype.did_hide = function() {};

    Component.prototype.on = function(type, callback) {
        safe_append_to_key(this.__data__.event_listeners, type, callback);
    };

    Component.prototype.off = function() {
        
    };

    Component.prototype.fire = function(type, args) {
        if (args == undefined) {
            args = {};
        }

        var target = this.__data__.event_listeners[type];
        if (target !== undefined) {
            for(var i=0; i < target.length; i++) {
                var cb = target[i];
                cb(args);
            }
            return true;
        } else {
            return false;
        }
    };
    
    Component.prototype.reload = function() {};
    Component.prototype.extend = function() {};

    return {
        "Component":Component
    };
})();

if (typeof(module) !== undefined) {
    module.exports.mvc = mvc;
}
