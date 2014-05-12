/* Fifth is a js version of Forth, http://en.wikipedia.org/wiki/Forth_(programming_language)
/  Forth is great, but it has some syntax that is a little more complex that I would like
/  So I figured something similar (stack based) would be good, but with some different
/  syntax that is a little more digestible. I also want to support JSON as part of the
/  language, making it easy to get data in and out of the runtime.
/  The goal here is to make a clean intermediate that is easy to parse, and execute.
/  
/  A solution like lisp is actually considerably harder from a runtime perspective.
/  
*/

var FifthLib = (function() {
        var d = {};
        
        d['alert'] = function(e, s) {
            console.log("Stack: " + JSON.stringify(e.stack));
            console.log("Vars: " + JSON.stringify(e.vars));
        };
        
        d['+'] = function(e, stack) {
            var a = stack.pop();
            var b = stack.pop();
            stack.push(b + a);
        };

        d['-'] = function(e, stack) {
            var a = stack.pop();
            var b = stack.pop();
            stack.push(a - b);
        };

        d['*'] = function(e, stack) {
            var a = stack.pop();
            var b = stack.pop();
            stack.push(a * b);
        };
        
        d['dup'] = function(e, stack) {
            stack.push(e.peek());
        };

        d['=='] = function(e, stack) {
            var a = stack.pop();
            var b = stack.pop();
            stack.push(a == b);
        }

        d['!='] = function(e, stack) {
            var a = stack.pop();
            var b = stack.pop();
            stack.push(a != b);
        }

        d['map'] = function(e, stack) {
            var f = stack.pop();
            var l = stack.pop();
            var result = [];

            if (f[0] != '`') {
                throw "NOT A VALID FUNC: " + f
            }

            f = f.slice(1);

            for(var i = 0; i < l.length; i++) {
                var value = e.execute_anon([l[i]], f);
                result.push(value[0]);
            }
            stack.push(result);
        };

        d['filter'] = function(e, stack) {
            var f = stack.pop();
            var l = stack.pop();
            var result = [];

            if (f[0] != '`') {
                throw "NOT A VALID FUNC: " + f
            }

            f = f.slice(1);

            for(var i = 0; i < l.length; i++) {
                var value = e.execute_anon([l[i]], f);
                if (value) {
                    result.push(l[i]);
                }
            }
            stack.push(result);
        };

        d['foldl'] = function(e, stack) {
            var f = stack.pop();
            var accum = stack.pop();
            var l = stack.pop();
            var result = [];

            if (f[0] != '`') {
                throw "NOT A VALID FUNC: " + f
            }

            f = f.slice(1);

            for(var i = 0; i < l.length; i++) {
                var value = e.execute_anon([accum, l[i]], f);
                accum = value[0];
            }
            stack.push(accum);
        };
        
        d['echo'] = function(e, stack) {
            console.log(stack.pop());
        };

        d['pop'] = function(e, stack) {
            stack.pop();
        };

        return d;
    })()

var Fifth = (function()  {
        var token_chars = ["'", '"', '`', '|'];
        var special_chars = ["!", "@", "#"];

        var is_digit = function(t) {
            if (t >= '0' && t <= '9') {
                return true;
            } else {
                return false;
            }
        };

        var x_in_list = function(x, the_list) {
            var l = the_list.length;
            for(var i = 0; i < l; i += 1) {
                if (x == the_list[i]) {
                    return true;
                }
            }
            return false;
        };

        var Environment = function() {
            this.vars = {};
            this.functions = {};
            this.stack = [];
            this.functions = FifthLib;
        };

        Environment.prototype.peek = function() {
            if (this.stack.length == 0) {
                return null;
            } else {
                return this.stack[this.stack.length-1];
            }
        };

        Environment.prototype.pop = function() {
            if (this.stack.length == 0) {
                return null;
            } else {
                return this.stack.pop();
            }
        };

        Environment.prototype.get_value = function(token) {
            if (is_digit(token) || token == "true" || 
                token == "false" || token[0] == '[' || 
                token[0] == '{') {
                return JSON.parse(token);
            } else if (x_in_list(token[0], special_chars)) {
                if (token[0] == "!") {
                    var var_name = token.slice(1);
                    var env = this;
                    return function() {
                        env.vars[var_name] = env.stack.pop();
                    }
                } else if (token[0] == "@") {
                    var var_name = token.slice(1);
                    var env = this;
                    return function() {
                        env.stack.push(env.vars[var_name]);
                    }
                }
            } else {
                if (this.functions[token] == undefined) {
                    throw "UNDEFINED: " + token;
                } else {
                    return this.functions[token];
                }
            }
        };

        Environment.prototype.handle_special = function(c, token) {
            var env = this;
            if (c == '`') {
                return '`' + token;
            } else if (c == '|') {
                return '|' + token;
            }
            return token;
        };

        Environment.prototype.parse = function(text) {
            var tokens = [];
            var current_token = [];
            var quotestack = [];
            var ll = text.length;
            
            for(var i = 0; i < ll; i++) {
                var c = text[i];

                if (quotestack.length == 0) {
                    if (x_in_list(c, token_chars)) {
                        quotestack.push(c);
                    } else if (c == ' ') {
                        if (current_token.length) {
                            var value = this.get_value(current_token.join(''));
                            tokens.push(value);
                            current_token = [];
                        }
                    } else {
                        current_token.push(c);
                    }
                } else {
                    if (c == quotestack[quotestack.length-1]) {
                        quotestack.pop();
                        var value = current_token.join('');
                        value = this.handle_special(c, value);
                        tokens.push(value);
                        current_token = [];
                    } else {
                        current_token.push(c);
                    }
                }
            }

            if (current_token.length) {
                var value = this.get_value(current_token.join(''));
                tokens.push(value);
            }

            return tokens;            
        };

        Environment.prototype.execute = function(text) {
            var code = this.parse(text);
            for(var i = 0; i < code.length; i++) {
                var item = code[i];
                if (typeof(item) == "function") {
                    item(this, this.stack);
                } else {
                    this.stack.push(item);
                }
            }
        };

        Environment.prototype.execute_anon = function(prep, text) {
            var code = this.parse(text);
            for(var i = 0; i < code.length; i++) {
                var item = code[i];
                if (typeof(item) == "function") {
                    item(this, prep);
                } else {
                    prep.push(item);
                }
            }
            return prep;
        };

        Environment.prototype.register = function(key, func) {
            this.functions[key] = func;
        };

        var performance_test = function(env) {
            var end = null;
            var start = (new Date).getTime();

            for( var i = 0; i < 10000; i++ ) {
                env.execute("1 1 + pop")
                env.execute("[1,2,3,9] 1 `+` foldl pop");
                env.execute("[1,2,3,4,5] `2 *` map pop");
            }
            end = (new Date).getTime();

            return end - start;
        };

        return {
            'Environment':Environment, performance_test:performance_test
        };
    })();
