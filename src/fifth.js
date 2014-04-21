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

var Fifth = (function()  {
        var token_chars = ["'", '"'];
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
            
            this.functions['alert'] = function(e) {
                console.log("Stack: " + JSON.stringify(e.stack));
                console.log("Vars: " + JSON.stringify(e.vars));
            };

            this.functions['+'] = function(e) {
                var a = e.stack.pop();
                var b = e.stack.pop();
                e.stack.push(b + a);
            };

            this.functions['append'] = function(e) {
                var argument = e.stack.pop();
                var var_name = e.stack.pop();
                this.vars[var_name].push(argument);
            };

            this.functions['hset'] = function(e) {
                var key = e.stack.pop();
                var value = e.stack.pop();
            };
        };

        Environment.prototype.peek = function() {
            if (this.stack.length == 0) {
                return null;
            } else {
                return this.stack[this.stack.length-1];
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

        Environment.prototype.execute_one = function(single_item) {
            if (typeof(single_item) == "function") {
                single_item(this);
            } else {
                this.stack.push(single_item);
            }
        };

        Environment.prototype.execute = function(text) {
            var code = this.parse(text);
            for(var i = 0; i < code.length; i++) {
                this.execute_one(code[i]);
            }
        };

        Environment.prototype.register = function(key, func) {
            this.functions[key] = func;
        };

        return {
            'Environment':Environment
        };

            
    })();