/* Written by Graham Abbott <graham.abbott@gmail.com> */

var GENIE_CONTEXT_begin = '{';
var GENIE_CONTEXT_end = '}';
var GENIE_CONTEXT_lookup = {
        "#":"comment",
        "%":"condition",
        "!":"exec",
        "@":"special",
        "&":"bindable",
        
        // These should be opposites, [] or () or {} or <>, these must match GENIE_CONTEXT_begin/end.
        "{": "variable", // Should be opener.
        "}": "variable"  // Should be closer.
    };

var genie_environ_count = 0;

// I'm not really proud of this sort of monkey patching, but it's somewhat required here.
String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, "").replace(/^[\n|\r]+|[\n|\r]+$/g, ""); };
String.prototype.triml = function() { return this.replace(/^\s+/g, "").replace(/^[\n|\r]+/g, ""); };
String.prototype.trimr = function() { return this.replace(/\s+$/g, "").replace(/[\n|\r]+$/g, ""); };

// Makes the code printouts very pretty ( can't help but keep it )
var pad = function(count) {
    var index = 0;
    var pad = "";
    while(index < count) {
        pad += "    ";
        index += 1;
    }
    return pad;
}

var Template = function(string) {
    this.orig_string = string;
    this.string = string;
    this.environment = null;
    this.blocks = [];
    this.final_func = null;
    this.parent_container = null;

    this.next_slurp = 0;
    this.ends_slurp = 0;
    this.one_slurp = 0;
    this.arg_list = [];
}

Template.prototype.find_next_block = function() {
    var start = this.string.indexOf(this.environment.begin);
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

    if (start_char == this.environment.begin) {
        end = after_block.indexOf(this.environment.end + this.environment.end);
    } else {
        if (start_char in this.environment.lookup) {
            end = after_block.indexOf(start_char + this.environment.end);
        } else {
            this.blocks.push( ['text', this.environment.begin] );
            this.string = after_block.substring(0);
            return
        }
    }

    end += 1;

    // special blocks can probably be removed now that i've done better slurp-handling with - and =
    // but i'm going to keep this around for a while just in case.
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
    var counter_count = 0;
    var last = 0;
    var depth = 0;
    
    while(last != -1) {
        last = this.find_next_block();
    }
    
    var f_code = ["\n"];
    var in_func = [];

    for( var c = 0; c < this.blocks.length; c++ ) {
        var obj = this.blocks[c];
        var type = obj[0];
        var data = obj[1];

        if (this.ends_slurp) {
            data = data.triml();
            this.ends_slurp -= 1;
        } else if (this.one_slurp) {
            data = data.substring(1)
            this.one_slurp -= 1;
        }

        if (type == 'text') {
            f_code.push( pad(depth) );
            f_code.push("write(" + JSON.stringify(data) + ");\n" );
        } else if ( type == 'condition') {
            data = data.trim();
            if (data[data.length-1] == '=') {
                this.ends_slurp += 1;
                data = data.substring(0, data.length-1);
                data = data.trim();
            } else if (data[data.length-1] == '-') {
                this.one_slurp += 1;
                data = data.substring(0, data.length-1);
                data = data.trim();
            }

            if (data.substring(0,2) == 'if') {
                var d = data.substring(2).trim();
                var bulk = d;
                if (d[0] == '(') {
                    bulk = d.substring(1, d.length-1);
                }
                f_code.push( "\n " + pad(depth) );
                f_code.push("if (" + bulk + ")" + " {\n");
                depth += 1;
                in_func.push('}');
            } else if (data.substring(0, 5) == 'while') {
                var d = data.substring(5).trim();
                var bulk = d;
                if (d[0] == '(') {
                    bulk = d.substring(1, d.length-2);
                }
                f_code.push( "\n " + pad(depth) );
                f_code.push("while (" + bulk + ")" + " {\n");
                depth += 1;
                in_func.push('}');
            } else if (data.substring(0, 4) == 'ford') {
                var d = data.substring(4).trim();
                var bulk = d;
                if (d[0] == '(') {
                    bulk = d.substring(1, d.length-2);
                }
                
                var value_name = bulk.substring(0, bulk.indexOf(' in '));
                var rest = bulk.substring(bulk.indexOf(' in ') + 4);
                
                var cvar = '_count_' + counter_count;
                counter_count += 1;
                f_code.push( "\n for( var " + value_name + " in " + rest + " ) {" );
                f_code.push( "\n " + pad(depth) );
                in_func.push('}');
                depth += 1;                
            } else if (data.substring(0, 3) == 'for') {
                var d = data.substring(3).trim();
                var bulk = d;
                if (d[0] == '(') {
                    bulk = d.substring(1, d.length-2);
                }
                
                var value_name = bulk.substring(0, bulk.indexOf(' in '));
                var rest = bulk.substring(bulk.indexOf(' in ') + 4);
                
                var cvar = '_count_' + counter_count;
                counter_count += 1;
                f_code.push( "\n for( var " + cvar + " = 0; " + cvar + " < " + rest + ".length; " + cvar + "++ ) {" );
                f_code.push( "\n   var " + value_name + " = " + rest + "[" + cvar + "]; var index=" + cvar + ";");
                f_code.push( "\n   var rindex = (" + rest + ".length" + " - index) - 1");
                f_code.push( "\n " + pad(depth) );
                in_func.push('}');
                depth += 1;
            } else if (data == 'end') {
                depth -= 1;
                f_code.push( pad(depth) );
                f_code.push(in_func.pop() + ';\n');
            } else if (data.substring(0, 4) == 'else' || data.substring(0, 7) == 'else if') {
                f_code.push( pad(depth-1) );
                f_code.push( "} " + data + " {\n");
            }
        } else if (type == 'variable') {
            f_code.push( pad(depth) );
            f_code.push( "write( " + data + " || undefined_variable('"+data+"') );\n");
        } else if (type == 'bindable') {
            var value = this.environment.bindable_dict[data.trim()];
            if (value === undefined) {
                value = '';
            }
        
            f_code.push( "write( \"<span class='genie_" + this.environment.id + "_value_update_" + data.trim() + "'>\" + " + value + " + \"</span>\" );\n" );
        } else if (type == 'exec') {
            f_code.push(data);
        }
    }

    var header = "var __exposed_vars = []; for (var a in v) { if (v.hasOwnProperty(a)) { __exposed_vars.push(a); } }";

    //    if (DEBUG) {
    //        console.log(f_code.join(''));
    //    }
    this.f_code = f_code;
    this.f_code_render = "(function(parent, v, defaults, undefined_variable) { " + header + this.f_code.join(' ') + "})";
};

Template.prototype.render = function(variables, undefined_variable) {
    if (this.final_func == null) {
        this.compile();

        var _env = this.environment;
        var ____output = [];
        var partial = function(name, d) { return _env.render(name, d); };
        var write = function(ddd) { ____output.push(ddd); };
        var _template = this;
        
        var compiled_code = eval(this.f_code_render);

        var encased_template = function(tvars, uv) {
            ____output = [];
            try {
                var template_vars = JSON.parse(tvars);
            } catch (e) {
                var template_vars = tvars;
            }

            var undef_var = function(name) {
                if (uv.indexOf('%s') == -1) {
                    return uv.trim();
                } else {
                    return uv.replace('%s', name.trim()).trim();
                }
            };
            
            compiled_code(_template, template_vars, this.environment.default_dict, undef_var);
            return ____output.join('');
        }
        this.final_func = encased_template;
    }
    
    var result = this.final_func(variables, undefined_variable);
    return result.trim();
}

var Environment = function() {
    this.id = genie_environ_count + 1;
    genie_environ_count += 1;
    this.default_data = {};
    this.object_dict = {};
    this.template_dict = {};
    this.bindable_dict = {};

    this.begin = GENIE_CONTEXT_begin;
    this.end = GENIE_CONTEXT_end;
    this.lookup = GENIE_CONTEXT_lookup;
    
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


Environment.prototype.template_list = function() {
    l = []; 
    for( var i in this.template_dict ) {
        l.push(i);
    }
    return l;
}

Environment.prototype.set_bindable = function(key, value) {
    this.bindable_dict[key] = value;

    var targets = document.getElementsByClassName('genie_' + this.id + '_value_update_' + key);
    for( var i = 0; i < targets.length; i++ ) {
    var obj = targets[i];
    obj.innerHTML = value;
    }
}

Environment.prototype.get_template = function(name) {
    return this.template_dict[name];
}

Environment.prototype.create_template = function(name, data) {
    var t = new Template(data);
    t.key = name;
    t.environment = this;
    this.template_dict[name] = t;
    return t;
};

Environment.prototype.render_quick = function(template_text, vars, undef_var) {
    var t = new Template(template_text);
    t.key = 'anon';
    t.environment = this;
    return t.render(vars, undef_var);
}

Environment.prototype.render_to = function(target_element, name_of_template, di) {
    var t = this.get_template(name_of_template);
    if (t !== undefined) {
        target_element.innerHTML = t.render(di);
    } else {
        target_element.innerHTML = 'Template ' + name_of_template + ' could not be found.';
    }
};

Environment.prototype.render_these = function(elements, data) {
    for( var i = 0; i < elements.length; i++ ) {
    var result = this.render_quick(elements[i].innerHTML, data);
    elements[i].innerHTML = result;
    }
};

Environment.prototype.render = function(name, variables, undef_var) {
    try {
        var t = this.template_dict[name];
        try {
            return t.render(variables, undef_var);
        } catch (e) {
            return e;
        }
    } catch (e) {
    }
}

Environment.prototype.set_obj = function(name, obj) {
    this.object_dict[name] = obj;
}

Environment.prototype.get_obj = function(name) {
    return this.object_dict[name];
}

var main_environment = new Environment();

try {
    exports.Template = Template;
    exports.Environment = Environment;
    exports.env = main_environment;
} catch (e) {
    var genie = {};
    genie.Template = Template;
    genie.Environment = Environment;
    genie.env = main_environment;
}

