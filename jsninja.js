// Template object.
try {
    var test = jsninja_debug;
} catch (e) {
    var jsninja_debug = 0;
}

try {
    exports.test = function() {
        //pass
    }
    var sys = require('sys');
} catch (e) {
    // we are not in node.js
}

String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "").replace(/^[\n|\r]+|[\n|\r]+$/g, "");
}

String.prototype.triml = function() {
    return this.replace(/^\s+/g, "").replace(/^[\n|\r]+/g, "");
}

String.prototype.trimr = function() {
    return this.replace(/\s+$/g, "").replace(/[\n|\r]+$/g, "");    
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
        console.log("No Errors!");
    } else {
        jsninja_errors.forEach( function(obj) {
            console.log('error' + "," + obj);
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
    this.default_data = {};
    this.template_dict = {};

    this.begin = '{';
    this.end = '}';
    
    this.lookup = {
        "{":"variable", "}":"variable",
        "#":"comment",
        "%":"condition",
        "!":"exec",
        "@":"special"
    }
    
    this.specials = {
        'slurp': function(template) {
            var index = template.blocks.length - 1;
            var last_text = null;
            while( index > 0 ) {
                if (template.blocks[index][0] == 'text') {
                    last_text = index;
                    break;
                }
            }
            if (last_text != null) {
                template.blocks[index][1] = template.blocks[index][1].trimr();
            }
            template.next_slurp = 1;
        }
    }
}

Environment.prototype.render_template = function(name, variables) {
    try {
        var t = this.template_dict[name];
        console.log('t' + "," + t);
        try {
            return t.render(variables);
        } catch (e) {
            return e;
        }
    } catch (e) {
        alert("here: " + e);
    }
}


var Template = function(string) {
    this.orig_string = string;
    this.string = string;
    this.environment = null;
    this.blocks = [];
    this.final_func = null;

    this.next_slurp = 0;
}

Template.prototype.find_next_block = function() {
    var start = this.string.search(this.environment.begin);
    
    if (start == -1) {
        if (this.next_slurp) {
            this.blocks.push( ['text', this.string.triml()]);
        } else {
            this.blocks.push( ['text', this.string]);
        }
        return -1;
    }
    
    var before_block = this.string.substring(0, start);
    var after_block = this.string.substring(start+1);
    
    if (this.next_slurp) {
        this.blocks.push( ['text', before_block.triml()] );
    } else {
        this.blocks.push( ['text', before_block] );
    }
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
    if (type == 'special') {
        this.environment.specials[block.trim()](this);
    } else {
        this.blocks.push( [type, block] );
    }
    this.string = after_block.substring(end+1);
        
    return end;
}

Template.prototype.compile = function() {
    this.working_string = ""+this.string;

    var last = 0;
    var depth = 0;
    
    while(last != -1) {
        last = this.find_next_block();
    }
    
    var f_code = ["\n"];
    var in_func = 0;
    
    this.blocks.forEach( function(obj) {
        var type = obj[0];
        var data = obj[1];
        
        if (type == 'text') {
            f_code.push( pad(depth) );
            f_code.push("write(" + JSON.stringify(data) + ");\n" );
        } else if ( type == 'condition') {
            data = data.trim();
            if (data.substring(0,2) == 'if') {
                var d = data.substring(2).trim();
                var bulk = d;
                if (d[0] == '(') {
                    bulk = d.substring(1, d.length-2);
                }
                                
                f_code.push( "\n " + pad(depth) );
                f_code.push("if (" + bulk + ")" + " {\n");
                depth += 1;
            } else if (data.substring(0, 5) == 'while') {
                var d = data.substring(5).trim();
                var bulk = d;
                if (d[0] == '(') {
                    bulk = d.substring(1, d.length-2);
                }
                                
                f_code.push( "\n " + pad(depth) );
                f_code.push("while (" + bulk + ")" + " {\n");
                depth += 1;
            } else if (data.substring(0, 3) == 'for') {
                var d = data.substring(3).trim();
                var bulk = d;
                if (d[0] == '(') {
                    bulk = d.substring(1, d.length-2);
                }
                
                var value_name = bulk.substring(0, bulk.indexOf('in'));
                var rest = bulk.substring(bulk.indexOf('in') + 2);
                
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
            f_code.push( "write( " + data + " );\n" );
        } else if ( type == 'exec') {
            f_code.push(data);
        }
    });
    
    this.f_code = f_code;
    this.f_code_render = "(function(preamble) { eval(preamble); " + this.f_code.join(' ') + "})";
}



Template.prototype.render = function(variables, missing_value_cb) {
    if (this.final_func == null) {
        var start_build_time = new Date();
        this.compile();

        var ____output = [];
        var partial = function(name, d) { return environment.render_template(name, d); };
        var write = function(ddd) { ____output.push(ddd); };

        console.log(this.f_code_render);

        var compiled_code = eval(this.f_code_render);
        var environment = this.environment;

        console.log('here' + "," + 'now');

        var encased_template = function(tvars) {
            ____output = [];
            try {
                var template_vars = JSON.parse(tvars);
            } catch (e) {
                var template_vars = tvars;
            }
            
            var ss = [];
            if (template_vars.__proto__.isPrototypeOf({})) {
                for( i in template_vars ) {
                    if (typeof template_vars[i] == 'object') {
                        ss.push(" var " + i + " = JSON.parse(" + JSON.stringify(template_vars[i]) + ");\n");
                    } else {
                        ss.push(" var " + i + " = " + JSON.stringify(template_vars[i]) + ";\n");
                    }
                }
            } else {
                ss.push(" var _data = JSON.parse(" + JSON.stringify(template_vars) + ");\n");
            }

            for( i in environment.default_data ) {
                ss.push(" var " + i + " = " + JSON.stringify(environment.default_data[i]) + ";\n");
            }
            
            console.log('data' + "," + ss.join(' '));
            
            compiled_code(ss.join(''));
            return ____output.join('');
        }

        this.final_func = encased_template;
        console.log('build ' + this.key + "," + new Date().getMilliseconds() - start_build_time.getMilliseconds());
    }
    
    var start_render = new Date();
    var result = this.final_func(variables);
    console.log('render ' + this.key + "," + new Date().getMilliseconds() - start_render.getMilliseconds());
    return result;
}

Template.prototype.describe = function() {
    return JSON.stringify({ blocks: this.blocks });
}

var WebRenderer = function() {
    this.environment = new Environment();
}

WebRenderer.prototype.create_template = function(key, value) {
    var t = new Template(value);
    t.key = key;
    t.environment = this.environment;
    this.environment.template_dict[key] = t;
}

WebRenderer.prototype.run = function() {
    var errors = document.createElement("div");
    errors.innerHTML = 'Errors';
    errors.id = 'jsninja_error_log';
    
    var self = this;
    var datas = $$("." + jsninja_data_classname);
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
    var template_dict = this.environment.template_dict;
    
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
                var tr = self.environment.render_template(name, data);
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
                                var tr = self.environment.render_template(name, data);
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
                        alert(responseText);
                        var data = JSON.parse(responseText);
                        var class_names = [];
                        classes.forEach( function( name ) {
                            if (name != jsninja_target_classname_url_json) {
                                var tr = self.environment.render_template(name, data);
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
    exports.Environment = Environment;
} catch (e) {
    var jsninja = {};
    jsninja.Template = Template;
    jsninja.WebRenderer = WebRenderer;
    jsninja.Environment = Environment;
}

