// http://www.htmlgoodies.com/html5/javascript/extending-javascript-objects-in-the-classical-inheritance-style.html#fbid=RVDh8wJqRXX

var Class = function() {
    var parent,
    the_methods,
    objMethods = [
        'toString'
        ,'valueOf'
        ,'toLocaleString'
        ,'isPrototypeOf'
        ,'propertyIsEnumerable'
        ,'hasOwnProperty'
    ],

    klass = function() {
        this.initialize.apply(this, arguments);
        //copy the properties so that they can be called directly from the child
        //class without $super, i.e., this.name
        var reg = /\(([\s\S]*?)\)/;
        var params = reg.exec(this.initialize.toString());
        if (params) {
            var param_names = params[1].split(',');
            for ( var i=0; i<param_names.length; i++ ) {
                this[param_names[i]] = arguments[i];
            }
        }
    },

    extend = function(destination, source) {
        for (var property in source) {
            destination[property] = source[property];
        }
        //IE 8 Bug: Native Object methods are only accessible directly
        //and do not come up in for loops. ("DontEnum Bug")
        if (!Object.getOwnPropertyNames) {
            for(var i=0; i<objMethods.length; i++) {
                // if (  isNative(source,objMethods[i])
                if (typeof source[objMethods[i]] === 'function'
                    &&      source[objMethods[i]].toString().indexOf('[native code]') == -1) {
                    destination[objMethods[i]] = source[objMethods[i]];
                }
            }
        }

        destination.$super =  function(method) {
            return this.$parent[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        return destination;
    },

    methods = function(ms) {
        var slots = [];
        var destination = this;
        var source = ms;

        for (var property in source) {
            slots.push(property);
            destination[property] = source[property];
        }
        //IE 8 Bug: Native Object methods are only accessible directly
        //and do not come up in for loops. ("DontEnum Bug")
        if (!Object.getOwnPropertyNames) {
            for(var i=0; i<objMethods.length; i++) {
                // if (  isNative(source,objMethods[i])
                if (typeof source[objMethods[i]] === 'function'
                    &&      source[objMethods[i]].toString().indexOf('[native code]') == -1) {
                    slots.push(i);
                    destination[objMethods[i]] = source[objMethods[i]];
                }
            }
        }

        if (destination.__slots__) {
            destination.__slots__ = destination.__slots__.concat(slots);
        } else {
            destination.__slots__ = slots;
        }
    };

    if (typeof arguments[0] === 'function') {
        parent  = arguments[0];
        the_methods = arguments[1];
    } else {
        the_methods = arguments[0];
    }

    if (parent !== undefined) {
        extend(klass.prototype, parent.prototype);
        klass.prototype.$parent = parent.prototype;
    }
    extend(klass.prototype, the_methods);
    klass.prototype.constructor = klass;
    klass.prototype.methods = methods;

    if (!klass.prototype.initialize) {
        klass.prototype.initialize = function(){
            this.__inputs__ = [];
            this.__outputs__ = [];
            this.__slots__ = [];
            this.__data__ = {};
        };
    }
    return klass;
};

if (typeof genie_module !== 'undefined') {
    genie_module.exports.Class = Class;
}
