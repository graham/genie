var log = function() {
    var r = []
    for( var i = 0; i < arguments.length; i++) {
        r.push(arguments[i]);
    }
    console.log( r);
};

var str_trim = function(s) { return s.replace(/^\s+|\s+$/g, "").replace(/^[\n|\r]+|[\n|\r]+$/g, ""); };

var wrap_func = function(fn) {
    return function(scope, args) {
        args = Scheme.evaluate(args, scope);
        return fn(scope, args);
    };
}

var SchemeLib = (function() {
    var d = {};

    d['let'] = function(scope, args) {
        var child = new Scheme.Scope({parent:scope});
        var defs = args[0];
        var code = args[1];

        for(var i=0; i<defs.length; i++) {
            var obj = defs[i];
            (function(def) {
                child.data[def[0]] = def[1];
            })(obj);
        }

        return Scheme.evaluate(code, child);
    };

    d['if'] = function(scope, args) {
        var test = Scheme.evaluate(args[0], scope);

        if (test.constructor == [].constructor && test[0]) {
            return Scheme.evaluate(args[1], scope);
        } else if (typeof(test) == "number" && test) {
            return Scheme.evaluate(args[1], scope);
        } else if (typeof(test) == "boolean" && test) {
            return Scheme.evaluate(args[1], scope);
        } else {
            return Scheme.evaluate(args[2], scope);
        }
    };
    
    d['not'] = function(scope, args) {
        var test = Scheme.evaluate(args[0], scope);
        if (test && test[0]) {
            return [false];
        } else {
            return [true];
        }
    };

    d['setf'] = function(scope, args) {
        scope.set(args[0], Scheme.evaluate(args[1], scope));
    };

    d['alert'] = function(scope, args) {
        args = Scheme.evaluate(args, scope);
        alert("" + JSON.stringify(args));
        return [];
    };

    d['+'] = function(scope, args) {
        args = Scheme.evaluate(args, scope);
        var sum = 0;
        for(var i=0; i < args.length; i++) {
            sum += args[i];
        }
        return sum;
    };

    

    return d;
});

var Scheme = (function() {
    var parse = function(text, scope) {
        if (scope == undefined) {
            scope = new Scope();
        }

        var open_expr_char = scope.expr_open || "(";
        var close_expr_char = scope.expr_closed || ")";
        
        var in_string = false;
        var in_comment = false;
        var input_ll = text.length;
        var current_token = [];
        var expr_stack = [];
        var current_expr = [];
        
        for(var i=0; i < input_ll; i++) {
            var c = text[i];
            
            if (in_string) {
                if (c == '"') {
                    current_token.push(c);
                    current_expr.push( current_token.join('') );
                    current_token = [];
                    in_string = false;
                } else {
                    current_token.push(c);
                }
            } else if (in_comment) {
                if (c == '\n') {
                    in_comment = false;
                }
            } else {
                if (c == '"') {
                    current_token.push(c);
                    in_string = true;
                } else if (c == open_expr_char) {
                    if (current_expr) {
                        expr_stack.push(current_expr);
                        current_expr = [];
                    }
                } else if (c == close_expr_char) {
                    var t = current_expr;
                    if (current_token.length) {
                        t = t.concat(current_token.join(''));
                        current_token = [];
                    }
                    var p = expr_stack.pop()
                    current_expr = p.concat([t]);
                } else if (c == ' ') {
                    if (current_token.length) {
                        current_expr.push( current_token.join('') );
                        current_token = [];
                    }
                } else if (c == '\n') {
                    //pass
                } else if (c == ';') {
                    in_comment = true;
                } else {
                    current_token.push(c);
                }

            }
        } // for

        return current_expr;
    }

    var execute = function(code, lib, scope) {
        if (lib == undefined) {
            lib = SchemeLib();
        }
        if (scope == undefined) {
            scope = new Scope();
        }

        var ast = parse(code, scope);
        var linked = link(ast, lib, scope);
        return evaluate(linked, scope);
    };

    var link = function(ast, lib, scope) {
        var is_digit = function(t) {
            if (t >= '0' && t <= '9') {
                return true;
            } else {
                return false;
            }
        };
        
        var root = [];

        for(var i=0; i < ast.length; i++) {
            var obj = ast[i];
            (function(item) {
                if (item.constructor == [].constructor) {
                    // we assume it's another ast to consume.
                    var node = link( item, lib, scope );
                    root.push(node);
                } else if (item.constructor == ''.constructor) {
                    if (lib[item] != undefined) {
                        root.push(lib[item]);
                    } else if (scope.get(item) && scope.get(item) instanceof Function) {
                        root.push(wrap_func(scope.get(item)));
                    } else if (is_digit(item[0])) {
                        root.push(parseFloat(item));
                    } else {
                        root.push(item);
                    }
                } else {
                    console.log("Unknown type");
                }
            })(obj);
        }
        
        return root;
    };
    
    var evaluate = function(linked, scope) {
        if (linked instanceof Array) {
            if (linked[0] instanceof Function) {
                return linked[0].apply(null, [scope,linked.slice(1)]);
            } else {
                var result = [];
                for(var i=0; i < linked.length; i++) {
                    result.push(evaluate(linked[i], scope));
                }
                return result;
            }
        } else {
            if (linked.constructor == ''.constructor) {
                if (linked[0] == '"') {
                    return linked.slice(1, linked.length-1);
                } else if (linked == "true") {
                    return true;
                } else if (linked == "false") {
                    return false;5
                } else {
                    return scope.get(linked);
                }
            } else {
                return linked;
            }
        }
    };
    

    var Scope = function(options) {
        if (options == undefined) {
            options = {};
        }

        if (options['init'] != undefined) {
            this.data = options['init'];
        } else {
            this.data = {};
        }

        if (options['parent'] != undefined) {
            this.parent_scope = options['parent'];
        } else {
            this.parent_scope = undefined;
        }
        
        this.expr_open = "(";
        this.expr_closed = ")";
    };

    Scope.prototype.get = function(key) {
        // builtins should go here.
        if (this.data[key] !== undefined) {
            return this.data[key];
        } else {
            if (this.parent_scope === undefined) {
                return undefined;
            } else {
                return this.parent_scope.get(key);
            }
        }
    };

    Scope.prototype.set = function(key, value) {
        if (this.data[key] !== undefined) {
            this.data[key] = value;
        } else {
            if (this.parent_scope === undefined) {
                this.data[key] = value;
            } else {
                if (this.parent_scope.test(key) == true) {
                    this.parent_scope.set(key, value);
                } else {
                    this.data[key] = value;
                }
            }
        }
    };

    Scope.prototype.execute = function(code, lib) {
        if (lib == undefined) {
            lib = SchemeLib();
        }
        return execute(code, lib, this);
    };

    Scope.prototype.test = function(key) {
        if (this.data[key] !== undefined) {
            return true;
        } else {
            if (this.parent_scope === undefined) {
                return false;
            } else {
                return this.parent_scope.test(key);
            }
        }
    };

    return {
        'Scope':Scope,
        'parse':parse,
        'link':link,
        'execute':execute,
        'evaluate':evaluate
    };
})();
