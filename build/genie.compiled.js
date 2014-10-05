
var genie = (function() {
var module = {};
module.exports = {};
    



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

if (typeof module !== 'undefined') {
    module.exports.Class = Class;
}



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

var genie = ( function() {
    var UNIQUE_TIME = "" + new Date().getTime();
    var GENIE_VERSION = "0.3";
    var genie_context_begin;
    var genie_context_end;

    var GENIE_CONTEXT_begin = eval("genie_context_begin") || "[";
    var GENIE_CONTEXT_end =   eval("genie_context_end")   || "]";

    var GENIE_CONTEXT_lookup = {
        "#":"comment",
        "%":"condition",
        "!":"exec",
        "*":"exec-coffee",
        "&":"bindable",
        "^":"notes",
        "~":"compiler",
    };

    GENIE_CONTEXT_lookup[GENIE_CONTEXT_begin] = "variable";
    GENIE_CONTEXT_lookup[GENIE_CONTEXT_end] = "variable";
    
    var genie_environ_count = 0;

    // I'm not really proud of this sort of monkey patching, but it's somewhat required here.
    var str_trim = function(s) { return s.replace(/^\s+|\s+$/g, "").replace(/^[\n|\r]+|[\n|\r]+$/g, ""); };

    var str_trimr = function(s) { return s.replace(/\s+$/g, "").replace(/[\n|\r]+$/g, ""); };
    var str_trimr_spaces = function(s) { return s.replace(/[ |\t]+$/g, "") };
    var str_trimr_one = function(s)    { return s.replace(/\n[ |\t]*/g, "") };

    var str_triml = function(s) { return s.replace(/^\s+/g, "").replace(/^[\n|\r]+/g, ""); };
    var str_triml_spaces = function(s) { return s.replace(/^[ |\t]+/g, "") };
    var str_triml_one = function(s)    { return s.replace(/^[ |\t]*\n/g, "") };

    var str_count = function(s, c, accum) {
        if (accum == undefined) {
            accum = 0;
        }
        var i = s.indexOf(c);
        if (i == -1) {
            return accum;
        } else {
            return str_count(s.slice(i+1), c, accum+1);
        }
    };

    var str_starts_with = function(key, st) {
        if (key.slice(0, st.length) == st) {
            return true;
        } else {
            return false;
        }
    }

    // Makes the code printouts very pretty ( can't help but keep it )
    var pad = function(count) {
        var index = 0;
        var pad = "";
        while(index < count) {
            pad += "    ";
            index += 1;
        }
        return pad;
    };

    var Template = function(sss) {
        this.orig_string = sss;
        this.string = sss;
        this.environment = null;
        this.blocks = [];
        this.final_func = null;
        this.notes = [];
        this.cur_template_line = 0;
        this.value_only = undefined;
        this.exposed_values = [];
    };

    Template.prototype.find_next_block = function() {
        var begin_char;
        var end_char;
        var cmd_lookup;

        var blocks = [];

        if (this.environment) {
            begin_char = this.environment.begin;
            end_char = this.environment.end;
            cmd_lookup = this.environment.lookup;
        } else {
            begin_char = GENIE_CONTEXT_begin;
            end_char = GENIE_CONTEXT_end;
            cmd_lookup = GENIE_CONTEXT_lookup;
        }

        if (this.value_only != undefined) {
            begin_char = this.value_only;
            end_char = this.value_only;
            cmd_lookup = {};
            cmd_lookup[this.value_only] = "variable";
        }
    
        var start = this.string.indexOf(begin_char);
        var next_char = start+1;
    
        if (start == -1) {
            var s = this.string;
            this.string = '';
            if (s == '') {
                return [];
            } else {
                //*
                this.cur_template_line += str_count(s, '\n');
                //*
                blocks.push( ['text', s, this.cur_template_line]);
                return blocks;
            }
        }
    
        var before_block = this.string.substring(0, start);
        var after_block = this.string.substring(start+1);

        this.cur_template_line += str_count(before_block, '\n');
        blocks.push( ['text', before_block, this.cur_template_line] ); 

        var start_char = after_block[0];
        var type = cmd_lookup[start_char];
        var end = null;

        if (start_char == begin_char) {
            end = after_block.indexOf(end_char + end_char);
        } else {
            if (start_char in cmd_lookup) {
                end = after_block.indexOf(start_char + end_char);
            } else {
                this.cur_template_line += str_count(begin_char, '\n');
                blocks.push( ['text', begin_char, this.cur_template_line] );
                this.string = after_block.substring(0);
                return blocks;
            }
        }

        end += 1;

        var block = after_block.substring(1, end-1);
        after_block = after_block.substring(end+1);

        // Pre-inner-operator.
        if (block[0] == '-') {
            block = block.substring(1);
            if (blocks[blocks.length-1]) {
                blocks[blocks.length-1][1] = str_trimr_spaces(blocks[blocks.length-1][1]);
            }
        } else if (block[0] == '=' || type == "notes") {
            block = block.substring(1);
            if (blocks[blocks.length-1]) {
                blocks[blocks.length-1][1] = str_trimr(blocks[blocks.length-1][1]);
            }
        } else if (block[0] == '|') {
            block = block.substring(1);
        }
    
        //post inner operator.
        if (block[block.length-1] == '|') {
            block = block.substring(0, block.length-1);
            after_block = str_triml_one(after_block);
        } else if (block[block.length-1] == '-') {
            block = block.substring(0, block.length-1);
            after_block = str_triml_spaces(after_block);
        } else if (block[block.length-1] == '=') {
            block = block.substring(0, block.length-1);
            after_block = str_triml(after_block);
        }
        
        this.cur_template_line += str_count(block, '\n');
        blocks.push( [type, block, this.cur_template_line] );

        this.string = after_block;
        return blocks;
    };

    Template.prototype.bailout = function() {
        /* throw an exception and stop rendering a template */
        throw { type: "bailout", message: "bailout of current template render" };
    };

    Template.prototype.compile = function() {
        var counter_count = 0;
        var depth = 0;
        var f_code = [];
        var in_func = [];
        var i = 0;
        var blocks = this.find_next_block();
        var tempvar_counter = 0;
    
        while(blocks.length > 0) {
            for( i = 0; i < blocks.length; i++ ) {
                var obj = blocks[i];
                var type = obj[0];
                var data = obj[1];
                var line = obj[2];
        
                if (type == 'text') {
                    f_code.push( "/* " + line + " */ " + pad(depth) );
                    f_code.push("write(" + JSON.stringify(data) + ");\n" );
                } else if ( type == 'condition') {
                    data = str_trim(data);
                    if (data.substring(0,2) == 'if') {
                        var d = str_trim(data.substring(2));
                        var bulk = d;
                        if (d[0] == '(') {
                            bulk = d.substring(1, d.length-1);
                        }
                        f_code.push( "\n" + "/* " + line + " */ " + pad(depth) );
                        f_code.push("if (" + bulk + ")" + " {\n");
                        depth += 1;
                        in_func.push('}');
                    } else if (data.substring(0, 5) == 'while') {
                        var d = str_trim(data.substring(5));
                        var bulk = d;
                        if (d[0] == '(') {
                            bulk = d.substring(1, d.length-2);
                        }
                        f_code.push( "\n/* " + line + " */ " + pad(depth) );
                        f_code.push("while (" + bulk + ")" + " {\n");
                        depth += 1;
                        in_func.push('}');
                    } else if (data.substring(0, 4) == 'ford') {
                        var d = str_trim(data.substring(4));
                        var bulk = d;
                        if (d[0] == '(') {
                            bulk = d.substring(1, d.length-2);
                        }
                
                        var value_name = bulk.substring(0, bulk.indexOf(' in '));
                        var rest = bulk.substring(bulk.indexOf(' in ') + 4);
                
                        var cvar = '_count_' + counter_count;
                        counter_count += 1;
                        f_code.push( "\n/* " + line + " */ for( var " + value_name + " in " + rest + " ) {" );
                        f_code.push( "\n/* " + line + " */ " + pad(depth) );
                        in_func.push('}');
                        depth += 1;                
                    } else if (data.substring(0, 3) == 'for') {
                        var d = str_trim(data.substring(3));
                        var bulk = d;
                        if (d[0] == '(') {
                            bulk = d.substring(1, d.length-2);
                        }
                
                        var value_name = bulk.substring(0, bulk.indexOf(' in '));
                        var rest = bulk.substring(bulk.indexOf(' in ') + 4);
                
                        var cvar = '_count_' + counter_count;
                        counter_count += 1;
                        f_code.push( "\n/* " + line + " */ for( var " + cvar + " = 0; " + cvar + " < " + rest + ".length; " + cvar + "++ ) {" );
                        f_code.push( "\n/* " + line + " */   var " + value_name + " = " + rest + "[" + cvar + "]; var index=" + cvar + ";");
                        f_code.push( "\n/* " + line + " */   var rindex = (" + rest + ".length" + " - index) - 1");
                        f_code.push( "\n/* " + line + " */ " + pad(depth) );
                        in_func.push('}');
                        depth += 1;
                    } else if (data == 'end') {
                        depth -= 1;
                        f_code.push( "/* " + line + " */ " + pad(depth) );
                        f_code.push(in_func.pop() + ';\n');
                    } else if (data.substring(0, 7) == 'else if') {
                        var command = data.substring(0, 7);
                        var rest = str_trim(data.substring(7));
                        if (rest[0] == '(') {
                            bulk = d.substring(1, d.length-1);
                        }
                        if (rest[rest.length-1] == ')') {
                            bulk = d.substring(0, d.length-2);
                        }

                        f_code.push( "/* " + line + " */ " + pad(depth-1) );
                        f_code.push( "} " + command + " ( " + rest + " ) {\n");
                    } else if (data.substring(0, 4) == 'else') {
                        var command = data.substring(0, 4);
                        f_code.push( "/* " + line + " */ " + pad(depth-1) );
                        f_code.push( "} " + command + " {\n");
                    }
                } else if (type == 'variable') {
                    f_code.push( pad(depth) );
                    var vardata = data;
                    var vartype = undefined;

                    // :: means of type. (obj :: type)
                    if (data.indexOf('::') != -1) {
                        var temp = data.split('::');
                        vardata = str_trim(temp[0]);
                        vartype = str_trim(temp[1]);
                    }

		    if (data.indexOf(GENIE_CONTEXT_begin) == 0) {
			f_code.push( "/* " + line + " */ write( " + vardata.substring(1) + " );\n");
                    } else {
                        var tempvar_name = "__tempvar_" + tempvar_counter;
                        tempvar_counter++;
                        f_code.push( "/* " + line + " */ var " + tempvar_name + " = " + vardata + ";\n");
                        f_code.push( "/* " + line + " */ if (typeof(" + tempvar_name + ") == \"function\") { write(" + tempvar_name + "());}\n");
			f_code.push( "/* " + line + " */ else { write( (typeof(" + tempvar_name + ") != 'undefined') ? escape_variable(" + tempvar_name + ", '" + vartype + "') : undefined_variable('" + tempvar_name + "') ); } \n");
		    }
                } else if (type == 'bindable') {
                    var value = this.environment.bindable_dict[str_trim(data)];
                    if (value === undefined) {
                        value = '';
                    }
        
                    f_code.push( "/* " + line + " */ write( \"<span class='genie_" + this.environment.id + "_value_update_" + str_trim(data) + "'>\" + " + data + " + \"</span>\" );\n" );
                } else if (type == 'exec') {
                    f_code.push( "/* " + line + " */ " + data);
                } else if (type == 'exec-coffee') {
                    f_code.push( "/* " + line + " */ " + CoffeeScript.compile(data));
                } else if (type == 'notes') {
                    this.notes.push(str_trim(data));
                } else if (type == 'compiler') {
                    // this should have been compiled out, ignore in this case.
                    // pass
                }
            }
            blocks = this.find_next_block();
        }

        var preamble = [];
        if (this.notes) {
            preamble = this.preamble_notes();
        }

        preamble = preamble.join(' ');
        
        var header = "var write = locals.write; var escape_variable = locals.escape_variable;";
        header += "var partial = locals.partial; var bailout = locals.bailout;";
        header += "var _env = locals._env; var _template = locals._template;";
        this.f_code_render = preamble + header + f_code.join('');

        //console.log(this.f_code_render);
        this.f_code = null;
    };

    Template.prototype.preamble_notes = function() {
        var newnotes = [];
        var preamble = [];

        for(var i = 0; i < this.notes.length; i++) {
            var obj = str_trim(this.notes[i]);
            var result = null;
            if (obj.slice(0, 6) == "expose") {
                try {
                    result = JSON.parse(obj.slice(6, obj.length));
                } catch (err) {
                    result = null;
                }
                if (result) {
                    if (typeof(result) == "string") {
                        preamble.push("var " + result + " = v." + result + ";");
                    } else if (typeof(result) == "object") {
                        for(var __i = 0; __i < result.length; __i++) {
                            var result_final = result[__i].replace(' ', '_');
                            preamble.push("var " + result_final + " = v." + result_final + ";");
                        }
                    }
                }
            } else {
                newnotes.push(obj);
            }
        }
        this.notes = newnotes;
        return preamble;
    };

    Template.prototype.pre_render = function(undefined_variable) {
        this.compile();

        var locals = {};
        locals['_env'] = this.environment;
        locals['____output'] = [];

        locals['partial'] = function(name, d) { 
            var ptemp = locals['_env'].get_template(name);
            if (ptemp == undefined) {
                console.log("ERROR: Template " + name + " not found.");
                return "TEMPLATE_NOT_FOUND: " + name;
            } else {
                return locals['_env'].get_template(name).render(d); 
            }
        };

        locals['write'] = function(ddd) { locals['____output'].push(ddd); };
        locals['_template'] = this;
        locals['bailout'] = this.bailout;

        locals['escape_variable'] = function(data, type) { return data; };
        
        try {
            var compiled_code = new Function('parent', 'v', 'defaults', 'undefined_variable', 'locals', this.f_code_render);
        } catch (e) {
            this.stack_trace(e);
        }

        var encased_template = function(tvars, uv) {
            locals['____output'] = [];
            var template_vars = tvars;

            var undef_var = function(name) {
                if (!uv) {
                    console.log("Variable '" + name + "' is not defined, state: " + JSON.stringify(tvars));
                    return "** " + name + " not defined **";
                } else if (uv.indexOf('%s') == -1) {
                    return str_trim(uv);
                } else {
                    return str_trim(uv.replace('%s', str_trim(name)));
                }
            };

            var defaults;
            if (this.environment) {
                defaults = this.environment.default_dict;
            } else {
                defaults = {};
            }

            compiled_code(locals['_template'], template_vars, defaults, undef_var, locals);
            return locals['____output'].join('');
        }
        this.final_func = encased_template;
        this.f_code_render = null;
    };

    Template.prototype.render = function(variables, undefined_variable) {
        if (this.final_func == null) {
            this.pre_render(undefined_variable);
        }

        try {
            var result = this.final_func(variables, undefined_variable);
            return result;
        } catch (e) {
            if (e.type == 'bailout') {
                return null;
            } else {
                this.stack_trace(e);
            }
        }
    };

    Template.prototype.stack_trace = function(e) {
        throw e;
        var line = null;
        if (e.line) {
            line = this.f_code.join('').split('\n')[e.line-3];
        } else if (e.lineNumber) {
            line = this.f_code.join('').split('\n')[e.lineNumber-3];
        } else {
            throw new Error('Your browser sucks: ' + e.message);
        }
        if (line.slice(0, 2) == '/*') {
            var os_by_line = this.orig_string.split('\n');
            var line_number = parseInt(str_trim(line.slice(2, line.indexOf('*/'))));
            var error_lines = [];

            if (line_number > 0) { 
                error_lines.push(" line " + (line_number) + ": " + os_by_line[line_number-1]);
            }

            error_lines.push(" line " + (line_number+1) + ": " + os_by_line[line_number]);

            if (line_number < os_by_line.length-1) { 
                error_lines.push(" line " + (line_number+2) + ": " + os_by_line[line_number+1]);
            }

            var message = "Javascript Error => " + e.message + "\nOn template line => " + (line_number+1) + "\n--------------------\n" + error_lines.join('\n') + "\n--------------------";
            console.log(message);
            throw new Error(message);
        } else {
            throw e;
        }
    };

    Template.prototype.async_render = function(variables, options) {
        var do_nothing = function() {};
        var undefined_variable = options['undefined_variable'] || function(varname) { return '**' +  varname + ' not defined **'; };
        var on_success = options['on_success'] || do_nothing;
        var on_error = options['on_error'] || do_nothing;
        var on_bailout = options['on_bailout'] || do_nothing;

        try {
            var result = this.render(variables, undefined_variable);
            if (result == null && on_bailout) {
                on_bailout(this);
                return;
            } else {
                if (on_success) {
                    on_success(result, this);
                }
            }
        } catch (e) {
            on_error(e, this);
        }
    };

    var Environment = function() {
        this.id = genie_environ_count + 1;
        genie_environ_count += 1;
        this.default_data = {};
        this.object_dict = {};
        this.template_dict = {};
        this.bindable_dict = {};
        this.escape_dict = {};

        this.begin = GENIE_CONTEXT_begin;
        this.end = GENIE_CONTEXT_end;
        this.lookup = GENIE_CONTEXT_lookup;
    };

    Environment.prototype.escape_variable = function(vardata, vartype) {
        return vardata;
    };

    Environment.prototype.template_list = function() {
        l = []; 
        for( var i in this.template_dict ) {
            l.push(i);
        }
        return l;
    };

    Environment.prototype.set_bindable = function(key, value) {
        this.bindable_dict[key] = value;

        var targets = document.getElementsByClassName('genie_' + this.id + '_value_update_' + key);
        for( var i = 0; i < targets.length; i++ ) {
            var obj = targets[i];
            obj.innerHTML = value;
        }
    };

    Environment.prototype.get_template = function(name) {
        return this.template_dict[name];
    };

    Environment.prototype.create_template = function(name, data) {
        var t = new Template(data);
        t.key = name;
        t.environment = this;
        this.template_dict[name] = t;
        return t;
    };

    Environment.prototype.render_quick = function(template_text, vars, undef_var) {
        if (vars === undefined) {
            vars = {};
        }
        var t = new Template(template_text);
        t.key = 'anon';
        t.environment = this;
        return t.render(vars, undef_var);
    };

  Environment.prototype.render = function(name, vars, undef_var) {
    if (vars === undefined) {
      vars = {};
    }
    var t = this.template_dict[name];
    if (t === undefined) {
      console.log("Template " + name + " not found.");
      return '';
    } else {
      return t.render(vars, undef_var);
    }
  };
    
    Environment.prototype.set_obj = function(name, obj) {
        this.object_dict[name] = obj;
    };

    Environment.prototype.get_obj = function(name) {
        return this.object_dict[name];
    };

    Environment.prototype.load_template = function(url, name, cb) {
        var env = this;
        $.get(url + "?_ts=" + UNIQUE_TIME, 
              function(data) {
                  env.create_template(name, data);
                  console.log('created template: ' + name + ' (' + data.length + ' bytes)');
                  if (cb) {
                      cb.finish();
                  }
              });
    };

    Environment.prototype.load_templates = function(orig_paths, final_callback) {
        var env = this;
        function load_next(paths, callback) {
            if (paths.length == 0) {
                callback(env);
            } else {
                var template_name = paths.pop();
                $.get(template_name + "?_ts=" + UNIQUE_TIME,
                      function(data) {
                          env.create_template(template_name, data);
                          console.log('created template: ' + name + ' (' + data.length + ' bytes)');
                          load_next(paths, callback);
                      }).fail( function() {load_next(paths, callback)} );
            }

        };
        load_next(orig_paths, final_callback);
    };

    Environment.prototype.auto_load = function(callback) {
        // this sucks because it requires jquery, should figure out how to
        // make that not a dependency.
        
        var env = this;
        var template_names = [];
        $('.genie-template').each( function(index, item) {
                template_names.push($(item).attr('data-genie-template'));
        });
        
        env.load_templates(template_names, function() {
                $('.genie-template').each( function(index, item) {
                        var template_name = $(item).attr('data-genie-template');
                        var result = env.render(template_name, {});
                        $(item).html(result);
                    });
                if (callback) {
                    callback();
                }
            });
    };

    Environment.prototype.load_template_dir = function(url, cb) {
        // this sucks because it requires jquery, should figure out how to
        // make that not a dependency.
        
        var env = this;
        $.get(url, function(data) {
                data = JSON.parse(data);
                var items = [];
                for(var name in data) {
                    var obj = data[name];
                    var load = function(o) {
                        return function(t) { 
                            env.load_template(url + o, o.split('.')[0], t);
                        }
                    }
                    items.push( load(obj) ); 
                }
                ut.serial(function() { return; }, items, cb);
            });
    };
    
    var main_environment = new Environment();
    
    var fs = function( s, args, value_only ) {
        var t = new Template(s);
        t.value_only = value_only;
        return t.render(args);
    };

    var ts = function() {
        var d = new Date();
        return d.getTime() / 1000.0;
    };

    var genie_render_dom_element = function(d, o) {
        var content = d.value;
        var t = new Template(content);
        d.value = t.render(o);
    }

    var loadr = function(url) {
        var d = document.createElement('script');
        d.src = url;
        d.type = 'text/javascript';
        document.body.appendChild(d);
    };

    var monkey_patch = function() {
        String.prototype.render = function(args, undef_var) {
        var t = new Template(this);
        t.key = 'anon';
        return t.render(args, undef_var);
        };
    };

    var dig_get = function(obj, key, settings) {
        var split_key = "/";
        if (settings['di']) {
            split_key = settings['di'];
        }
        
        if (key.indexOf(split_key) == -1) {
            return obj[key];
        } else {
            var cur = key.split(split_key, 1);
            var rest = key.split(split_key).slice(1).join(split_key);
            obj = obj[cur];
            return this.dig_get(obj, rest);
        }
    };
    
    var dig_set = function(obj, key, value, settings) {
        var split_key = "/";
        var def = function() { return new Object(); };
        if (settings == undefined) {
            settings = {};
        }
        if (settings['di']) {
            split_key = settings['di'];
        }
        if (settings['def']) {
            def = settings['def'];
        }

        if (key[key.length-1] == split_key) {
            key = key.slice(0, key.length-1);
        }
        
        if (key.indexOf(split_key) == -1) {
            obj[key] = value;
            return [obj, key];
        } else {
            var cur = key.split(split_key, 1);
            var rest = key.split(split_key).slice(1).join(split_key);
            var newb = obj[cur];
            if (newb == undefined) {
                obj[cur] = def();
                newb = obj[cur];
            }
            
            return this.dig_set(newb, rest, value);
        }
    }; 
    
    var unpack_packed_hash = function(data) {
    };

    var render_body_as_template = function(d, undef_var) {
        var v = main_environment.render_quick(document.body.innerHTML, d, undef_var);
        document.body.innerHTML = v;
        return v;
    };

    var exports;

    exports = {
        'Template':Template, 
        'Environment':Environment, 
        'monkey_patch':monkey_patch, 
        'main_environment':main_environment, 
        'fs':fs, 
        'str_count':str_count, 
        'version':GENIE_VERSION, 
        'dig_set':dig_set, 
        'dig_get':dig_get, 
        'render_body_as_template':render_body_as_template, 
        'rbt':render_body_as_template, 
        'str_starts_with':str_starts_with
    };

    return exports;
})();

if (typeof module !== 'undefined') {
    module.exports.genie = genie;
    module.exports.Template = genie.Template;
    module.exports.Environment = genie.Environment;    
}



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

/* Example Component

	<style type='text/css'> 
	 #counter { 
	   font-size: 50px;
	 }
	</style> 

	<script type='text/javascript'>
	 component.on('ready', function() {
	     this.set('running', true);
	     this.set('ticks', 0);
	     this.load();
	 });

	 component.on('did_load', function() {
	     this.tick(100);
	 });

	 component.methods({
	     tick: function(ms) {
	         var sleep = ms || 1000;
	         this.reload();
	         this.wait(function() {
	             var secs = this.get('ticks');
	             this.set('ticks', secs+1);
	             this.tick(sleep);
	         }, sleep);
	     }     
	 });
	</script>

	<template type='text/template' id='root'>
	  <div id='counter'>
	    [% if v.ticks == 1 %]
	      [[v.ticks]] second has passed.
	    [% else %] 
	      [[v.ticks]] seconds have passed.
	    [% end %]
	  </div>
	</template> 

*/

var mvc = (function() {
    var safe_append_to_key = function(list, key, value) {
        if (list[key] == undefined) {
            list[key] = [value];
        } else {
            list[key].push(value);
        }
        return list;
    };

    var formap = function(fun, dict) {
        for (var key in dict) {
            if (dict.hasOwnProperty(key)) {
                fun(key, dict[key]);
            }
        }
    };

    var startswith = function(first, second) {
        return first.slice(0, second.length) == second;
    };

    var ResourceTracker = function() {
        this.loaded_resources = {};
    };

    ResourceTracker.prototype.load_resource = function(key, resource) {
        if (this.loaded_resources[key] != undefined) {
            document.append(resource);
            this.loaded_resources[key] = 1;
        } else {
            this.loaded_resources[key] += 1;
        }
    };

    var global_resource_tracker = new ResourceTracker();

    var Component = Class({
        initialize: function(state) {
            this.__data__ = {};
            this.__data__.event_listeners = {};
            this.__data__.state = state || {};
        },

        get: function(key) {
            return this.__data__.state[key];
        },
    
        set: function(key, value) {
            this.fire('state_will_change', key);
            this.__data__.state[key] = value;
            this.fire('state_did_change', key)
        },

        mset: function(props) {
            var t = this;
            formap(function(key, value) {
                t.set(key, value);
            }, props);
        },

        require_vars: function(l) {
            var hit = false;
            for(var i=0; i < l.length; i++) {
                if (this.get(l[i]) == undefined) {
                    console.log("MISSING VAR: " + l[i]);
                    hit = true;
                }
            }
            if (hit) {
                return false;
            } else {
                return true;
            }
        },
    
        on: function(type, callback) {
            safe_append_to_key(this.__data__.event_listeners, type, callback);
        },

        once: function(type, callback) {
            var comp = this;
            var inside = function() {
                callback(arguments);
                comp.off(type, inside);
            };
            safe_append_to_key(this.__data__.event_listeners, type, inside);
        },

        off: function(key, cb) {
            if (cb == undefined) {
                delete this.__data__.event_listeners[key];
            } else {
                var dict = this.__data__.event_listeners;
                if (key == null) {
                    for (var k in dict) {
                        if (dict.hasOwnProperty(k)) {
                            var len = dict[k].length;
                            var index = dict[k].indexOf(cb);
                            if (index != -1) {
                                dict[k] = dict[k].slice(0, index).concat(dict[k].slice(index+1, len));
                            }
                            
                        }
                    }
                } else {
                    if (dict[key] !== undefined) {
                        var len = dict[key].length
                        var index = dict[key].indexOf(cb);
                        if (index != -1) {
                            dict[key] = dict[key].slice(0, index).concat(dict[key].slice(index+1, len));
                        }
                    }
                }
                this.__data__.event_listeners = dict;
            }
        },

        fire: function(type, args) {
            if (args == undefined) {
                args = null;
            }
            
            var target = this.__data__.event_listeners[type];
            
            if (target !== undefined) {
                for(var i=0; i < target.length; i++) {
                    var cb = target[i];
                    try {
                        cb.apply(this, [args]);
                    } catch (e) {
                        console.log(e.message);
                        console.log(e.stack);
                        console.log("error for event '" + type + "' -> ");
                        console.log(cb);
                    }
                }
                return true;
            } else {
                return false;
            }
        },

        delay_fire: function(key, delay) {
            if (delay == undefined) {
                delay = 1;
            }
            setTimeout((function(t, k) { return (function() { t.fire(k); }); })(this,key), delay);
        },

        wait: function(cb, ts) {
            setTimeout((function(t,c) { return (function() { c.apply(t, []); }); })(this,cb), ts);
        }
    });

    var GCComponent = Class(Component, {
        initialize: function(props) {
            var url = props['url'];
            var target = props['target'];
            var state = props['state'] || {};
            var smart_load = props['smart_load'] || false;
            var auto_load = props['auto_load'] || false;

            Component.prototype.initialize.apply(this,[state]);
            this.__data__.resources = [];
            this.__data__.env = new genie.Environment();
            this.__data__.auto_load = auto_load;

            if (target) {
                this.set_target(target);
            }

            var cache_name = 'gc_component_cache_' + url;

            if (smart_load && (localStorage.getItem(cache_name) !== null)) {
                console.log('cache hit: ' + url);
                this.load_from_content(localStorage.getItem(cache_name));
            } else {
                console.log('loading url: ' + url);
                var comp = this;
                $.get(url, function(data) {
                    if (smart_load) { 
                        localStorage.setItem(cache_name, data); 
                    }
                    comp.load_from_content(data);
                });
            }
        },

        handle_script: function(child) {
            var src = child.innerHTML;
            return "(function(component) { " + src + " })";
        },

        load_from_content: function(data) {
            var comp = this;
            var scripts = [];

            var d = document.createElement('div');
            d.innerHTML = data;
            for(var i=0; i < d.children.length; i++) {
                var child = d.children[i];
                if (child.tagName == "STYLE" || child.tagName == "LINK") {
                    comp.__data__.resources.push(child);
                } else if (child.tagName == "SCRIPT") {
                    if (child.src) {
                        comp.__data__.resources.push(child);
                    } else {
                        scripts.push(this.handle_script(child));
                    }
                } else if (child.tagName == "TEMPLATE") {
                    if (!child.id) {
                        console.log("No id for template, Ill call it root and hope.");
                        child.id = 'root';
                    }
                    comp.__data__.env.create_template(child.id, child.innerHTML);
                } else if (child.tagName == "REQUIRE") {
                    for(var j=0; j < child.children.length; j++) {
                        var required_resource = child.children[j];
                        comp.__data__.resources.push(required_resource);
                        // Here would be the right place to ensure resources are not
                        // double added, however, ResourceManager isn't done yet.
                    }
                } else {
                    console.log("Unsupported node '" + child.tagName + "'in Component: " + child);
                }
            }
            
            for(var i=0; i < scripts.length; i++) {
                eval(scripts[i])(comp);
            }
            comp.delay_fire('ready');
            if (this.__data__.auto_load) {
                this.load();
            }
        },

        auto_load: function() {
            this.__data__.auto_load = true;
        },

        /* I need to make sure that i'm getting the basic dom object */
        set_target: function(target) {
            if (target.jquery) {
                this._target = target[0];
            } else {
                this._target = target;
            }
        },

        load_assets: function() {
            for(var i=0; i < this.__data__.resources.length; i++) {
                var obj = this.__data__.resources[i];
                if (obj.tagName == 'SCRIPT') {
                    var d = document.createElement('script');
                    d.src = obj.src;
                    document.head.appendChild(d);
                } else {
                    document.head.appendChild(obj);
                }
            }
        },

        load: function() {
            this.fire('will_load');
            this.load_assets();
            var target = this._target;
            var content = this.__data__.env.render('root', this.__data__.state);
            target.innerHTML = content;
            this.delay_fire('did_load');
        },

        reload: function() {
            this.fire('will_reload');
            var target = this._target;
            var content = this.__data__.env.render('root', this.__data__.state);
            target.innerHTML = content;
            this.delay_fire('did_reload');
        },

        unload: function() {
            this.fire('will_unload');
            this._target = null;
            // should probably unload resources here.
            this.delay_fire('did_unload');
        },

        render: function(template_name, d) {
            var y = {
                'component':this
            };

            formap(function(k, v) {
                y[k] = v;
            }, this.__data__.state);

            if (d) {
                formap(function(k, v) {
                    y[k] = v;
                }, d);
            }

            var content = this.__data__.env.render(template_name, y);
            return content;
        },

        modify: function(key, cb) {
            var data = this.get(key);
            var result = cb.apply(this, [data]);
            if (result != undefined) {
                this.set(key, result);
            }
        },

        find: function(search) {
            return $(this._target).find(search);
        },
        view: function() {
            return this.__data__.env.get_template('root');
        }
                                        
    });

    var ReactComponent = Class(GCComponent, {
        handle_script: function(child) {
            var src = child.innerHTML;
            if (child.type == 'text/jsx') {
                src = JSXTransformer.transform(src).code;
            }
            return "(function(component) { " + src + " })";
        },
        wrap: function(r) {
            this.__data__.react_root = r;
        },
        get: function(key) {
            return this.__data__.react_root.state[key];
        },
        set: function(key, value) {
                this.fire('state_will_change', key);
                var d = {};
                d[key] = value;
                this.__data__.react_root.setState(d)
                this.fire('state_did_change', key)
        },
        load: function() {
            this.fire('will_load');
            this.load_assets();
            this.delay_fire('did_load');
        },
        view: function(name) {
            return this.__data__.react_root;
        },
        reload: function() {},
        render: function() {
            console.log("why is this render being called.");
        },
        unload: function() {
            this.fire('will_unload');
            React.unmountComponentAtNode(this._target);
            this.delay_fire('did_unload');
        }
    });

    // a helper function to clear the cache of templates.
    var clear_gc_cache = function() {
        var prefix = 'gc_component_cache_';
        formap(function(key, value) {
            if (startswith(key, prefix)) {
                localStorage.removeItem(key);
            }
        }, localStorage);
    };

    return {
        "Component":     Component,
        "GCComponent":   GCComponent,
        "ReactComponent":ReactComponent,
        "clear_cache":   clear_gc_cache,
        "resource":      global_resource_tracker
    };
})();

if (typeof module !== 'undefined') {
    module.exports.mvc = mvc;
    module.exports.Component = mvc.Component;
    module.exports.GCComponent = mvc.GCComponent;
    module.exports.clear_cache = mvc.clear_cache;
}



var route = (function() {
    var get_hash = function() {
        return window.location.hash.slice(1).split('?')[0];
    };

    return {
        'get_hash':get_hash
    };
})();

if (typeof module !== 'undefined') {
    module.exports.route = route;
}




    return module.exports;
})();


