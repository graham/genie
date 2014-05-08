var str_trim = function(s) { return s.replace(/^\s+|\s+$/g, "").replace(/^[\n|\r]+|[\n|\r]+$/g, ""); };

var SchemeLib = (function() {
  var d = {};
  
  return d
})();

var Scheme = (function() {
  var parse = function(text) {
    
    var in_string = false;
    var in_comment = false;
    var input_ll = text.length;
    var current_token = [];
    var expr_stack = [];
    var current_expr = [];
    
    for(var i=0; i < input_ll; i++) {
      var c = text[i];
      console.log(c);
      
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
        } else if (c == "(") {
          if (current_expr) {
            expr_stack.push(current_expr);
            current_expr = [];
          }
        } else if (c == ")") {
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
      console.log('token: ' + current_token);
      console.log('expr: ' + current_expr);
      console.log('estck: ' + expr_stack);
    } // for

    return current_expr;
  }

  var execute = function(code, env) {};

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
  };

  Scope.prototype.push = function() {
    
  };

  Scope.prototype.pop = function() {

  };

  Scope.prototype.get = function(key) {
    if (this.data[key] != undefined) {
      return this.data[key];
    } else {
      if (this.parent_scope == undefined) {
        return undefined;
      } else {
        return this.parent_scope.get(key);
      }
    }
  };

  Scope.prototype.set = function(key, value) {
    if (this.data[key] != undefined) {
      this.data[key] = value;
    } else {
      if (this.parent_scope == undefined) {
        this.data[key] = value;
      } else {
        this.parent_scope.set(key, value);
      }
    }
  };

  var Environment = function() {
    
  };

  return {
    'Scope':Scope,
    'Environment':Environment,
    'parse':parse
  };
})();
