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
    var safe_value_check = function(valuename) {
        if (window && valuename in window) {
            return window['valuename'];
        }
        return undefined;
    }

    var UNIQUE_TIME = "" + new Date().getTime();
    var GENIE_VERSION = "0.7"; // June 09, 2016
    var genie_context_begin;
    var genie_context_end;
    var DEBUG = true;
    
    var GENIE_CONTEXT_begin = safe_value_check("genie_context_begin") || "[";
    var GENIE_CONTEXT_end =   safe_value_check("genie_context_end")   || "]";

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
    var str_trimr_spaces = function(s) { return s.replace(/[ |\t]+$/g, ""); };
    var str_trimr_newlines = function(s) { return s.replace(/[\n]+$/g, ""); };
    var str_trimr_newlines_one = function(s) { return s.replace(/[\n]$/g, ""); };
    var str_trimr_one = function(s)    { return s.replace(/\n[ |\t]*/g, ""); };

    var str_triml = function(s) { return s.replace(/^\s+/g, "").replace(/^[\n|\r]+/g, ""); };
    var str_triml_spaces = function(s) { return s.replace(/^[ |\t]+/g, ""); };
    var str_triml_newlines = function(s) { return s.replace(/^[\n]+/g, ""); };
    var str_triml_newlines_one = function(s) { return s.replace(/^[\n]/g, ""); };        
    var str_triml_one = function(s)    { return s.replace(/^[ |\t]*\n/g, ""); };
    var safe_str = function(s)         { return JSON.stringify(s); };

    var is_auto_slurp = function(type, first_char) {
        if (first_char != '=' && first_char != '-' && first_char != '|') {
            if (type == 'condition' || type == 'exec') {
                return true;
            } else {
                return false;
            }
        }
    };

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
        this.orig_string = "" + sss;
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

        if (this.string == undefined) {
            console.log("It looks like you didn't pass any content into a template, I'm going to bail out.");
            throw { type: "nocontent", message: "you didnt put any content int he macro" };
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
        } else if (block[0] == '.' || is_auto_slurp(type, block[0])) {
            block = block.substring(1);
            if (blocks[blocks.length-1]) {
                blocks[blocks.length-1][1] = str_trimr_newlines_one(blocks[blocks.length-1][1]);
            }
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
        } else if (block[block.length-1] == '.' || is_auto_slurp(type, block[block.length-1])) {
            block = block.substring(0, block.length-1);
            after_block = str_triml_newlines_one(after_block);
        }

        this.cur_template_line += str_count(block, '\n');
        blocks.push( [type, block, this.cur_template_line] );

        this.string = after_block;
        return blocks;
    };

    Template.prototype.bailout = function(payload) {
        /* throw an exception and stop rendering a template */
        throw { type: "bailout", message: "bailout of current template render",  "payload": payload};
    };

    Template.prototype.compile = function(auto_expose_var_list) {
        var i = 0;
        var depth = 0;
        var f_code = [];
        var in_func = [];
        var counter_count = 0;
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
                            bulk = d.substring(1, d.length-1);
                        }

                        var value_name = bulk.substring(0, bulk.indexOf(' in '));
                        var rest = bulk.substring(bulk.indexOf(' in ') + 4);

                        console.log(rest);

                        var cvar = '_count_' + counter_count;
                        counter_count += 1;
                        if (value_name.length) {
                            f_code.push( "\n/* " + line + " */ for( var " + cvar + " = 0; " + cvar + " < " + rest + ".length; " + cvar + "++ ) {" );
                            f_code.push( "\n/* " + line + " */   var " + value_name + " = " + rest + "[" + cvar + "]; var index=" + cvar + ";");
                            f_code.push( "\n/* " + line + " */   var rindex = (" + rest + ".length" + " - index) - 1");
                            f_code.push( "\n/* " + line + " */ " + pad(depth) );
                        } else {
                            f_code.push( "\n/* " + line + " */ for(" + bulk +") {\n");
                        }
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
                    } else if (data.substring(0, 5) == 'block') {
                        var block_name = data.split(' ')[1];
                        f_code.push( "/* " + line + " */ " + pad(depth-1) );
                        //f_code.push( "var " + block_name + " = function() {\n" );
                        f_code.push("function " + block_name + "() {\n" );
                        depth += 1;
                        in_func.push('}');
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
                        f_code.push( "/* " + line + " */ var " + tempvar_name + " = (typeof(" + vardata + ") != 'undefined') ? " + vardata + " : undefined_variable(" + JSON.stringify(vardata) + ");\n" );
                        f_code.push( "/* " + line + " */ if (typeof(" + tempvar_name + ") == \"function\") { write(" + tempvar_name + "());}\n");
                        f_code.push( "/* " + line + " */ else { write( " + tempvar_name + " ); }\n");
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

        if (auto_expose_var_list) {
            console.log("AutoExpose: True");
            var ae_keys = [];
            for(var key in auto_expose_var_list) {
                ae_keys.push("var " + key + " = v." + key + ";");
            }
            header += ae_keys.join('\n');
        }
        
        this.f_code_render = preamble + header + f_code.join('');

        if (DEBUG) {
            console.log(this.f_code_render);
        }
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

    Template.prototype.pre_render = function(variables, undefined_variable) {
        if (variables == undefined) {
            variables = {};
        }
        if (variables['__auto_expose__']) {
            // Have to reset the string var so that find_next_block works correctly.
            this.string = "" + this.orig_string;
            this.compile(variables);
        } else {
            this.compile();
        }
        
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
                    console.log("Variable '" + name + "' is not defined, state: " + tvars);
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
        if (this.final_func == null || variables['__auto_expose__'] != undefined) {
            this.pre_render(variables, undefined_variable);
        }

        try {
            var result = this.final_func(variables, undefined_variable);
            return result;
        } catch (e) {
            if (e.type == 'bailout') {
                throw e
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

if (typeof genie_module !== 'undefined') {
    genie_module.exports.genie = genie;
    genie_module.exports.Template = genie.Template;
    genie_module.exports.Environment = genie.Environment;
}
