// Template object.
var debug = 1;

try {
    exports.test = function() {
        //pass
    }
    
    var sys = require('sys');
    if (debug) {
        var jsw = function(key, d) { sys.puts("Log: (" + key + "): " + d); }
    } else {
        var jsw = function() {}
    }
    
} catch (e) {
    // we are not in node.js
    if (debug) {
        var jsw = function(key, d) { document.write("<div><pre>Log: (" + key + "): " + d + "</pre></div>"); }
    } else {
        var jsw = function() {}
    }
}

String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "").replace(/^[\n|\r]+|[\n|\r]+$/g, "");
}

var pad = function(count) {
    var index = 0;
    var pad = "";
    while(index < count) {
        pad += "    ";
        index += 1;
    }
    return pad;
}

var filter = function(fun, list) {
    new_list = [];
    list.forEach( function(item) {
        if (fun(item) != false) {
            new_list.push(item);
        }
    });
    return new_list;
}

var jsninja_errors = [];

var dump_errors = function() {
    if ( jsninja_errors.length == 0) {
        jsw("No Errors!", "");
    } else {
        jsninja_errors.forEach( function(obj) {
            jsw('error', obj);
        });
    }
}

var jsninja_template_classname = 'jst-template';
var jsninja_data_classname = 'jst-data';
var jsninja_target_classname = 'jst-target';
var jsninja_target_classname_url = 'jst-target-url';
var jsninja_target_classname_url_json = 'jst-target-url-json';
var jsninja_target_rendered_classname = 'jst-rendered';

var Environment = function() {
    this.begin = '{';
    this.end = '}';
    
    this.lookup = {
        "{":"variable", "}":"variable",
        "#":"comment",
        "%":"condition",
        "!":"exec",
        "@":"ignore"
    }
    
    this.default_data = {};
}

var Template = function(string) {
    this.string = string;
    this.environment = null;
    this.blocks = [];
}

Template.prototype.find_next_block = function() {
    var start = this.string.search(this.environment.begin);
    
    if (start == -1) {
        return -1;
    }
    
    var before_block = this.string.substring(0, start);
    var after_block = this.string.substring(start+1);
    
    this.blocks.push( ['text', before_block]);
    var start_char = after_block[0];
    var type = this.environment.lookup[start_char];

    var end = null;

    if (start_char == '{') {
        end = after_block.search("}" + this.environment.end);
    } else {
        end = after_block.search(start_char + this.environment.end);
    }
    
    end += 1;

    var block = after_block.substring(1, end-1);
    this.blocks.push( [type, block] );
    this.string = after_block.substring(end+1);
        
    return end;
}

Template.prototype.compile = function() {
    if (this.environment == null) {
        this.environment = new Environment();
    }
    this.working_string = ""+this.string;

    var last = 0;
    var depth = 0;
    
    while(last != -1) {
        last = this.find_next_block();
    }
    
    var f_code = [];
    var in_func = 0;
    
    this.blocks.forEach( function(obj) {
        var type = obj[0];
        var data = obj[1];
        
        if (type == 'text') {
            f_code.push( pad(depth) );
            f_code.push("print(" + JSON.stringify(data) + ");\n" );
        } else if ( type == 'condition') {
            data = data.trim();
            if (data.substring(0,2) == 'if' || data.substring(0, 5) == 'while') {
                f_code.push( "\n " + pad(depth) );
                f_code.push(data + " {\n");
                depth += 1;
            } else if (data.substring(0, 3) == 'for') {
                var sp = filter(function(item) { 
                    if (item == '' || item == '(' || item == ')') { 
                        return false; 
                    } else { 
                        return true; 
                    } 
                }, data.split(' '));
                var rest = sp.slice(3).join(' ').trim();
                
                if (rest[rest.length-1] == ')') {
                    rest = rest.substring(0, rest.length-1);
                }
                
                var value_name = sp[1].trim();
                
                if (value_name[0] == '(') {
                    value_name = value_name.substring(1);
                }
                
                f_code.push( "\n" + rest + ".forEach( function(" + value_name +") {" );
                f_code.push( "\n " + pad(depth) );
                in_func += 1;
                depth += 1;
            } else if (data == 'end') {
                depth -= 1;
                f_code.push( pad(depth) );
                if (in_func > 0) {
                    f_code.push('});\n');
                    in_func -= 1;
                } else {
                    f_code.push('}\n');
                }
            } else if (data.substring(0, 4) == 'else' || data.substring(0, 7) == 'else if') {
                f_code.push( pad(depth-1) );
                f_code.push( "} " + data + " {\n");
            }
        } else if ( type == 'variable') {
            f_code.push( pad(depth) );
            f_code.push( "print( " + data + " );\n" );
        } else if ( type == 'exec') {
            f_code.push(data);
        }
    });
    
    this.f_code = f_code;
    this.f_code_render = " " + this.f_code.join(' ');
}

Template.prototype.render = function(variables, missing_value_cb) {
    if (this.blocks.length == 0) {
        this.compile();

        var s = [];
        try {
            var data = JSON.parse(variables);
        } catch (e) {
            var data = variables;
        }

        s.push('(function() {\n');
        s.push(' var ____output = [];\n');
        s.push(' var print = function(data) { ____output.push(data); };\n');
        
        for( i in data ) {
            if (typeof data[i] == 'object') {
                s.push(" var " + i + " = JSON.parse(" + JSON.stringify(data[i]) + ");\n");
            } else {
                s.push(" var " + i + " = " + JSON.stringify(data[i]) + ";\n");
            }
        }

        for( i in this.environment.default_data ) {
            s.push(" var " + i + " = " + JSON.stringify(this.environment.default_data[i]) + ";\n");
        }
        
        s.push( '\n')
        s.push( this.f_code_render );
        s.push("\n\n return ____output.join('');\n})()");

        this.compiled_code = s;
        jsw('code', s.join(''));
    }

    return eval(this.compiled_code.join(''));
}


    
Template.prototype.describe = function() {
    return { blocks: this.blocks };
}

var WebRenderer = function() {
    this.template_dict = {};
    this.environment = new Environment();
}

WebRenderer.prototype.create_template = function(key, value) {
    var t = new Template(value);
    t.environment = this.environment;
    this.template_dict[key] = t;
}

WebRenderer.prototype.render_template = function(name, variables) {
    var t = this.template_dict[name];
    try {
        return t.render(variables, this.get_default_value);
    } catch (e) {
        return e;
    }
}

WebRenderer.prototype.run_moo = function() {
    var self = this;
    var datas = $$("." + jsninja_data_classname)
    var defaults = {};
    
    // This will require a lib of some kind.
    datas.forEach( function(obj) {
        try {
            var d = JSON.parse(obj.innerHTML);
            for( key in d ) {
                defaults[key] = d[key];
            }
        } catch (e) {
            jsninja_errors.push( [obj, e] )
        }
    });

    this.environment.default_data = defaults;
    
    var templates = $$("." + jsninja_template_classname);
    var template_dict = this.template_dict;
    
    templates.forEach( function(obj) {
        self.create_template( obj.id, obj.innerHTML );
    });
    
    var targets = $$("." + jsninja_target_classname);
    
    targets.forEach( function( obj ) {
        var classes = obj.className.split(' ');
        var data = obj.innerHTML;
        var class_names = [];
        classes.forEach( function( name ) {
            if (name != jsninja_target_classname) {
                var tr = self.render_template(name, data);
                obj.innerHTML = tr;
                class_names.push(name);
            }
        });
        obj.className = class_names.join(' ') + " " + jsninja_target_rendered_classname;
    });
    
    var targets = $$("." + jsninja_target_classname_url);
    
    targets.forEach( function( obj ) {
        (function() {
            var classes = obj.className.split(' ');
            var url = obj.innerHTML;

            var myRequest = new Request(
                {
                    url: url,
                    onSuccess: function(responseText, responseXML) {
                        var data = JSON.parse(responseText);
                        var class_names = [];
                        classes.forEach( function( name ) {
                            if (name != jsninja_target_classname_url) {
                                var tr = self.render_template(name, data);
                                obj.innerHTML = tr;
                                class_names.push(name);
                            }
                        });
                        obj.className = class_names.join(' ') + " " + jsninja_target_rendered_classname;
                    },
                    onFailure: function(obj) {
                        alert("Failure: " + obj);
                    }, 
                    onException: function(headerName, value) {
                        alert("Exception: " + value);
                    }
                }
            );
            myRequest.get();
        })();
    });    


    var targets = $$("." + jsninja_target_classname_url_json);
    
    targets.forEach( function( obj ) {
        (function() {
            var classes = obj.className.split(' ');
            var header = JSON.parse(obj.innerHTML);
            obj.innerHTML = header['loading'];
            var url = header['url'];

            var myRequest = new Request(
                {
                    url: url,
                    onSuccess: function(responseText, responseXML) {
                        var data = JSON.parse(responseText);
                        jsw('decode', data);
                        var class_names = [];
                        classes.forEach( function( name ) {
                            if (name != jsninja_target_classname_url_json) {
                                var tr = self.render_template(name, data);
                                obj.innerHTML = tr;
                                class_names.push(name);
                            }
                        });
                        obj.className = class_names.join(' ') + " " + jsninja_target_rendered_classname;
                    },
                    onFailure: function(obj) {
                        alert("Failure: " + obj);
                    }, 
                    onException: function(headerName, value) {
                        alert("Exception: " + value);
                    }
                }
            );
            myRequest.get();
        })();
    });

    dump_errors();
}

WebRenderer.prototype.reload = function() {
    this.template_dict = {};
    this.environment = new Environment();
}

var update_dom_dict = function(id, da) {
    var d = $(id);
    var data = JSON.parse(d.innerHTML);
    data.update(da);
    d.innerHTML = JSON.stringify(data);
}

try {
    exports.Template = Template;
    exports.WebRenderer = WebRenderer;
} catch (e) {
    var jsninja = {};
    jsninja.Template = Template;
    jsninja.WebRenderer = WebRenderer;
}

