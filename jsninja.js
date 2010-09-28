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


/* Lib features I need */

var main_environment = new Environment();

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
    var new_list = [];
    list.forEach( function(item) {
        if (fun(item)  != false) {
            new_list.push(item);
        }
    });
    return new_list;
}


var jsninja_template_classname = 'jst-template';
var jsninja_data_classname = 'jst-data';
var jsninja_target_classname = 'jst-target';
var jsninja_target_classname_url = 'jst-target-url';
var jsninja_target_classname_url_json = 'jst-target-url-json';
var jsninja_target_rendered_classname = 'jst-rendered';

var Environment = function() {
    this.default_data = {};
    this.object_dict = {};
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

Environment.prototype.get_template = function(name) {
    return this.template_dict[name];
}

Environment.prototype.create_template = function(name, data) {
    var t = new Template(value);
    t.key = key;
    t.environment = this;
    this.template_dict[key] = t;
}

Environment.prototype.run = function() {
    var datas = $$("." + jsninja_data_classname);
    var defaults = {};
    var env = this;
    
    // This will require a lib of some kind.
    datas.forEach( function(obj) {
        try {
            var d = JSON.parse(obj.innerHTML);
            for( key in d ) {
                defaults[key] = d[key];
            }
        } catch (e) {
            console.log(e);
        }
    });

    this.default_data = defaults;
    
    var templates = $$("." + jsninja_template_classname);
    var template_dict = this.template_dict;
    
    templates.forEach( function(obj) {
        env.create_template( obj.id, obj.innerHTML );
    });
    
    var targets = $$("." + jsninja_target_classname);
    
    targets.forEach( function( obj ) {
        var classes = obj.className.split(' ');
        var data = obj.innerHTML;
        var class_names = [];
        classes.forEach( function( name ) {
            if (name != jsninja_target_classname) {
                var tr = env.render_template(name, data);
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
                                var tr = env.render_template(name, data);
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
                                var tr = env.render_template(name, data);
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
}

Environment.prototype.register_object = function(name, obj) {
    this.object_dict[name] = obj;
}

Environment.prototype.get_object = function(name) {
    return this.object_dict[name];
}

var Template = function(string) {
    this.orig_string = string;
    this.string = string;
    this.environment = null;
    this.blocks = [];
    this.final_func = null;
    this.parent_container = null;

    this.next_slurp = 0;
}

Template.prototype.find_next_block = function() {
    var start = this.string.search(this.environment.begin);
    var next_char = start+1;
    
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
                
                f_code.push( "\n" + "var _index = -1;")
                f_code.push( "\n" + rest + ".forEach( function(" + value_name +") {" );
                f_code.push( "\n" + " _index += 1;")
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
    this.f_code_render = "(function(preamble, parent_template, parent_container) { eval(preamble); " + this.f_code.join(' ') + "})";
}

Template.prototype.render = function(variables) {
    if (this.final_func == null) {
        this.compile();

        var ____output = [];
        var partial = function(name, d) { return environment.render_template(name, d); };
        var write = function(ddd) { ____output.push(ddd); };
        var _env = this.environment;
        var _template = this;
        console.log(this.f_code_render);

        var compiled_code = eval(this.f_code_render);

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
            
            compiled_code(ss.join(''), parent_template, parent_container);
            return ____output.join('');
        }

        this.final_func = encased_template;
    }
    
    var result = this.final_func(variables);
    return result;
}

var PersistentTemplate = function(target_search, template) {
    this.target_search = target_search;
    this.template = template;
    this.current_data = {};
}

PersistentTemplate.prototype.update = function(data) {
    for(key in data) {
        this.current_data[key] = data[key];
    }
}

PersistentTemplate.prototype.clear = function() {
    this.current_data = {};
}

PersistentTemplate.prototype.render = function() {
    $(this.target_search).innerHTML = this.template.render(this.current_data);
}

var StateTemplate = function(target_div, state_template_dict) {
    this.target_div = target_div;
    this.state_template_dict = state_template_dict;
    this.current_data = {};
}

StateTemplate.prototype.update = function(data) {
    for(key in data) {
        this.current_data[key] = data[key];
    }
}

StateTemplate.prototype.clear = function() {
    this.current_data = {};
}

StateTemplate.prototype.change_state = function(new_state, new_vars) {
    this.parent_container = this.target_div;
    var template = this.state_template_dict[new_state];
    this.on_state_change(this.target_div, template.render(this.current_data));
}

StateTemplate.prototype.on_state_change = function(target, new_state_data) {
    target.innerHTML = new_state_data;
}

StateTemplate.prototype.load_url = function(url, func) {
    var template = this;
    var myRequest = new Request(
        {
            url: url,
            onSuccess: function(responseText, responseXML) {
                func(this, responseText, responseXML);
            },
            onFailure: function(obj) {
                func(this, obj.responseText, '');
            }, 
            onException: function(headerName, value) {
                alert("Exception: " + value);
            }
        }
    );
    myRequest.get();
}

try {
    exports.Template = Template;
    exports.Environment = Environment;
    exports.PersistentTemplate = PersistentTemplate;
    exports.StateTemplate = StateTemplate;
    exports.env = main_environment;
} catch (e) {
    var jsninja = {};
    jsninja.Template = Template;
    jsninja.Environment = Environment;
    jsninja.PersistentTemplate = PersistentTemplate;
    jsninja.StateTemplate = StateTemplate;
    jsninja.env = main_environment;
}

console.log('loaded jsninja');
