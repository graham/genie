/* Written by Graham Abbott <graham.abbott@gmail.com> */

/* 
   Genie - Javascript Templates that make your wishes come true.

   Quick Intro:
    Genie tries to emulate some of the more popular template libs, most notibly
    those similar to DjangoTemplates/Jinja. Additionally it supports some extra
    features that are somewhat unique to the challenges of templating in a web browser.
    
   Basics:
    var x = new Template("Hello my name is <<name>>.");
    assert x.render({'name':'Genie'}) == "Hello my name is Genie."

   Template Language Basics:
    The template language has operators wrapped in a outer operator. By default the outer
    operator is '<' and '>' but you can change this to whatever you want.

    The inner operators should stay the same, but switching the outer ones seems acceptible
    in scenarios where you want Genie to not conflict with other template libs (server side),
    or just look better.

    1. Variables
      Pure variable replacement simply works by doubling the outer operator:
        My name is <<name>>
      Simply define 'name' in the dictionary/object that you pass into the render method.

    2. Conditionals
      Most conditions that are available to javascript are available to Genie, the inner
      operator for conditions is '%'.

      <% if true %>
        Awesometown
      <% end %>
      
      All conditions end with just <% end %>, you can actually add any text you want after end
      it will simply be thrown away.

      <% if super_complex_query %>
        Do something
      <% else if something else %>
        Do something else
      <% end complex questions about life %>

    3. Javascript Execution
      Any time the inner operator ! is used it will simply execute the javascript in that block
      This is good if you are iterating over a list or just want to execute some javascript.
      This javascript will be executed at render time, not compile time.

      <! var name = 'Graham'; !>
      My name is << name >>.
      
    4. Comments
      Comments work just like any other language, but Genie only supports multi line so you
      have to close your comments.
      
      <# this is a comment #>
      
    5. Notes
      Notes are a rather special type. Basically templates have two stages:
        Uncompiled - Template has not been parsed
        Compiled   - Template has been parsed and is ready to render
      Compiled templates remove the "notes" blocks and append them to a list on the template
      object called "notes". This is great for when you may need to request some additional
      data before you actually do your render.

      This basically allows you to create you're own little meta language to interpret later.

      - template -
        <^ user_data ^>
        User's name is << username >>
      - end template -
      
      var t = new Template(<CONTENT FROM ABOVE>);
      t.pre_render();
      t.notes = [' user_data '];
      *** AJAX request for user data ***
      t.render( downloaded_user_data );

    6. Bindable (not HTML 5 data-binding)
      Bindable values are designed specially for web applications (the rest of Genie should
      work fine in almost any Javascript Environment). Bindable elements basically allow
      the developer to tag things (with a css class) so that later a single line of code
      will update the value across the page. 

      This section still needs some work, but the intent is to allow some variables on your
      page to be replaceable easily. By using something like <& value &> Genie will replace
      it with something like <span class='genie_update_value'>100</span> when the value is 100
      
      Using the set_bindable you can update the value of this span whenever you want. For
      now it's not wildly usable, however, with time it will mature into a better feature.

    7. Cleaning up whitespace
      Whitespace in templates can always be an issue, mostly because spacing can be very
      important. It's important to be able to layout

      Developers can add special characters to the front and back of Genie blocks.
      - slurp all whitespace until next newline (or until previous newline)
      | slurp all whitespace and the next new line (or until the previous newline)
      = slurp all whitespace until not whitespace (or until the previous non-whitespace)

    8. Escaping
      Templates are great, but any real work requires that you escape your content. Genie
      tries to make this a little easier for you. By default each template (and environment)
      has a "escape_variable" method that is called on data at render time. If you create
      your template via an environment the global environment method will be used for each
      render.

      When using variables you can use the following syntax:

          << variable_name :: variable_type >>
      
      The function definition for escape_variable looks like this 
      
          escape_variable(var_data, var_type)

      Variable Type is simply everything after the "::" (spaces trimmed). While this could
      have been more detailed (perhaps including the ability to receive a list of args) I
      think it's better just to leave it up to the implementer. Check doc.html for more
      concrete examples of how to use this.

    9. Stack Traces (as of 0.2)
      Genie now supports stack traces. (as demostrated in show_trace.html)
      Assuming the following template:

        <% if wtf < 0 %>
          hello world.
        <% end %>

      You would get a console error (as well as an exception) that looked like:

        Javascript Error => Can't find variable: wtf
        On template line => 1
        --------------------
         line 1:  <% if wtf < 0 %>
         line 2:      hello world.
        --------------------
        
      It will also work for javascript compilation errors, assuming the following template:
 
        <% if >>?>?><><><><>&&&& %>
          hello world.
        <% end %>

      Which of course is not correct javascript at all, you would receive the following error:

        Javascript Error => Unexpected token '>>'
        On template line => 1
        --------------------
         line 1:  <% if >>?>?><><><><>&&&& %>
         line 2:      hello world.
        --------------------

      These sorts of exceptions will make you feel more at home with Genie as your template
      engine.

    Extra note: Using an additional < at the beginning of a value will remove error checking.
                This can be useful when calling functions.
                <<< my_func_that_might_fail() >>

    end docs
*/

var genie = ( function() {
    var GENIE_VERSION = "0.2";
    var genie_context_begin;
    var genie_context_end;

    var GENIE_CONTEXT_begin = eval("genie_context_begin") || "[";
    var GENIE_CONTEXT_end =   eval("genie_context_end")   || "]";

    var GENIE_CONTEXT_lookup = {
        "#":"comment",
        "%":"condition",
        "!":"exec",
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

    var Template = function(string) {
        this.orig_string = string;
        this.string = string;
        this.environment = null;
        this.blocks = [];
        this.final_func = null;
        this.notes = [];
        this.cur_template_line = 0;
    };

    Template.prototype.escape_variable = function(vardata, vartype) {
        if (this.environment) {
            return this.environment( vardata, vartype );
        } else {
            return vardata;
        }
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
                    } else if (data.substring(0, 4) == 'else' || data.substring(0, 7) == 'else if') {
                        f_code.push( "/* " + line + " */ " + pad(depth-1) );
                        f_code.push( "} " + data + " {\n");
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

		    if (data.indexOf('<') == 0) {
			f_code.push( "/* " + line + " */ write( " + vardata.substring(1) + " );\n");
		    } else {
			f_code.push( "/* " + line + " */ write( escape_variable(" + vardata + ", '" + vartype + "') == undefined ? undefined_variable('"+data.replace(/\'/g, "\\'")+"') : " + "escape_variable(" + vardata + ", '" + vartype + "')" + " );\n");
		    }
                } else if (type == 'bindable') {
                    var value = this.environment.bindable_dict[str_trim(data)];
                    if (value === undefined) {
                        value = '';
                    }
        
                    f_code.push( "/* " + line + " */ write( \"<span class='genie_" + this.environment.id + "_value_update_" + str_trim(data) + "'>\" + " + data + " + \"</span>\" );\n" );
                } else if (type == 'exec') {
                    f_code.push( "/* " + line + " */ " + data);
                } else if (type == 'notes') {
                    this.notes.push(data);
                } else if (type == 'compiler') {
                    // this should have been compiled out, ignore in this case.
                    // pass
                }
            }
            blocks = this.find_next_block();
        }

        var header = "var __exposed_vars = []; for (var a in v) { if (v.hasOwnProperty(a)) { __exposed_vars.push(a); } }";
        header += " with(v) { \n"; // this is the first time i've seen 'with' used and felt it was a good thing.
        var fresh_code = [];
        for( var i in f_code ) {
            if (f_code[i] != '') {
                fresh_code.push(f_code[i]);
            }
        }
        this.f_code = fresh_code;
        this.f_code_render = "with(locals) {\n"+ header + this.f_code.join('') + "}}";
        this.f_code = null;
    };

    Template.prototype.pre_render = function(undefined_variable) {
        this.compile();

        var locals = {};
        locals['_env'] = this.environment;
        locals['____output'] = [];
        locals['partial'] = function(name, d) { return locals['_env'].get_template(name).render(d); };
        locals['write'] = function(ddd) { locals['____output'].push(ddd); };
        locals['_template'] = this;
        locals['bailout'] = this.bailout;
        locals['escape_variable'] = this.escape_variable;
        
        try {
            var compiled_code = new Function('parent', 'v', 'defaults', 'undefined_variable', 'locals', this.f_code_render);
        } catch (e) {
            this.stack_trace(e);
        }

        var encased_template = function(tvars, uv) {
            locals['____output'] = [];
            try {
                var template_vars = JSON.parse(tvars);
            } catch (e) {
                var template_vars = tvars;
            }

            var undef_var = function(name) {
		if (!uv) {
		    console.log("Variable '" + name + "' is not defined, state: " + JSON.stringify(tvars));
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
            return str_trim(result);
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
        var undefined_variable = options['undefined_variable'] || do_nothing;
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
        var result = t.render(vars, undef_var);
	return result;
    };

    Environment.prototype.set_obj = function(name, obj) {
        this.object_dict[name] = obj;
    };

    Environment.prototype.get_obj = function(name) {
        return this.object_dict[name];
    };

    Environment.prototype.load_template = function(url, name, cb) {
        var env = this;
        $.get(url, 
              function(data) {
                  env.create_template(name, data);
                  console.log('created template: ' + name + ' (' + data.length + ' bytes)');
                  if (cb) {
                      cb.finish();
                  }
              });
    };

    Environment.prototype.load_template_dir = function(url, cb) {
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

    var fs = function( s, args ) {
        var t = new Template(s);
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
    exports = {'Template':Template, 'Environment':Environment, 'monkey_patch':monkey_patch, 'main_environment':main_environment, 'fs':fs, 'str_count':str_count, 'version':GENIE_VERSION, 'dig_set':dig_set, 'dig_get':dig_get, 'render_body_as_template':render_body_as_template, 'rbt':render_body_as_template};
    if (typeof module !== 'undefined') {
        module.exports = exports;
    }
    return exports;
})();
