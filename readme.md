# Genie

### Learning Genie
- [Intro](https://github.com/graham/genie#quick-intro)
- [Basics](https://github.com/graham/genie#template-language-basics)
- [Variables](https://github.com/graham/genie#variables)
- [Conditions](https://github.com/graham/genie#variables)
- [Javascript](https://github.com/graham/genie#javascript-execution)
- [Comments](https://github.com/graham/genie#comments)
- [Notes (compiler defs)](https://github.com/graham/genie#notes)
- [Data Binding](https://github.com/graham/genie#bindable-not-html-5-data-binding)
- [Whitespace](https://github.com/graham/genie#cleaning-up-whitespace)
- [Escaping and Filters](https://github.com/graham/genie#escaping)
- [Environments and Namespaces](https://github.com/graham/genie#environments-and-the-main_environment)
- [Blocks and Sub-Templates](https://github.com/graham/genie#blocks-and-sub-templates)
- [Auto-Exposed Variables](https://github.com/graham/genie#auto-exposed-variables)

### Errors
- [Stack Traces](https://github.com/graham/genie#stack-traces-as-of-02)
- [Error Checking](https://github.com/graham/genie#error-checking)


## Quick Intro
 Genie tries to emulate some of the more popular template libs, most notibly
 those similar to DjangoTemplates/Jinja. Additionally it supports some extra
 features that are somewhat unique to the challenges of templating in a web browser.
 
## Example

    var x = new Template("Hello my name is [[name]].");
    assert(x.render({'name':'Genie'}) == "Hello my name is Genie.");

## Template Language Basics

 The template language has operators wrapped in a outer operator. By default the outer
 operator is '[' and ']' but you can change this to whatever you want.

 The inner operators should stay the same, but switching the outer ones seems acceptible
 in scenarios where you want Genie to not conflict with other template libs (server side),
 or just look better. (TLDR: __you can configure genie to use anything you want__).

 By default, all variables are contained in a local variable "__v__"

    Hi [[ v.name ]]!

 Is the normal way to access a variable however, this can be a bit tedious, so Genie has
 a way to expose variables in the local namespace.

 Anywhere in the template you can "expose" the variable like this:

    [^ expose "name" ^]

 Or for multiple variables at once:

    [^ expose ["one", "two"] ^]

 Once you've added these to the templates you can use the vars as if they were local:

    This template has not [[ one ]] but [[ two ]] vars.

 This prevents undefined vars and makes things generally easier. (It also ensures that
 Genie can avoid sub template scope pollution.

## __Variables__

   Pure variable replacement simply works by doubling the outer operator:
     My name is [[name]]
   Simply define 'name' in the dictionary/object that you pass into the render method.

## __Conditionals__

   Most conditions that are available to javascript are available to Genie, the inner
   operator for conditions is '%'.

    [% if true %]
        Awesometown
    [% end %]
   
   All conditions end with just [% end %], you can actually add any text you want after end
   it will simply be thrown away.

    [% if super_complex_query %]
        Do something
    [% else if something %]
        Do something else
    [% end complex questions about life %]

## Javascript Execution

   Any time the inner operator ! is used it will simply execute the javascript in that block
   This is good if you are iterating over a list or just want to execute some javascript.
   This javascript will be executed at render time, not compile time.

    [! var name = 'Graham'; !]
    My name is [[ name ]].
   
## Comments

   Comments work just like any other language, but Genie only supports multi line so you
   have to close your comments.
   
    [# this is a comment #]
   
## Notes

   Notes are a rather special type. Basically templates have two stages:
   
     Uncompiled - Template has not been parsed
     Compiled   - Template has been parsed and is ready to render
     
   Compiled templates remove the "notes" blocks and append them to a list on the template
   object called "notes". This is great for when you may need to request some additional
   data before you actually do your render.

   This basically allows you to create you're own little meta language to interpret later.

     [^ user_data ^]
     User's name is [[ username ]]
     
   Then
   
    var t = new Template(<CONTENT FROM ABOVE>);
    t.pre_render();
    t.notes = [' user_data '];
    *** AJAX request for user data ***
    t.render( downloaded_user_data );

## Bindable (not HTML 5 data-binding)

   Bindable values are designed specially for web applications (the rest of Genie should
   work fine in almost any Javascript Environment). Bindable elements basically allow
   the developer to tag things (with a css class) so that later a single line of code
   will update the value across the page. 

   This section still needs some work, but the intent is to allow some variables on your
   page to be replaceable easily. By using something like <& value &> Genie will replace
   it with something like <span class='genie_update_value'>100</span> when the value is 100
   
   Using the set_bindable you can update the value of this span whenever you want. For
   now it's not wildly usable, however, with time it will mature into a better feature.

## Cleaning up whitespace

   Whitespace in templates can always be an issue, mostly because spacing can be very
   important. It's important to be able to layout

   Developers can add special characters to the front and back of Genie blocks.

    - slurp all whitespace until next newline (or until previous newline)

    | slurp all whitespace and the next new line (or until the previous newline)

    = slurp all whitespace until not whitespace (or until the previous non-whitespace)

## Escaping

   Templates are great, but any real work requires that you escape your content. Genie
   tries to make this a little easier for you. By default each template (and environment)
   has a "escape_variable" method that is called on data at render time. If you create
   your template via an environment the global environment method will be used for each
   render.

   When using variables you can use the following syntax:

       [[ variable_name :: variable_type ]]
   
   The function definition for escape_variable looks like this 
   
       escape_variable(var_data, var_type)

   Variable Type is simply everything after the "::" (spaces trimmed). While this could
   have been more detailed (perhaps including the ability to receive a list of args) I
   think it's better just to leave it up to the implementer. Check doc.html for more
   concrete examples of how to use this.

## Environments and the 'main_environment'

For small projects, `new Template` and `genie.fs` are great, but once you start working with larger sets of templates and any large application in general, Genie Environments are here to help.

Environments attempt to solve a number of problems, but we'll focus on two in this document:

1. Keep track of your templates (compile once).
2. Expose variables to every template you render (global to the environment).

First we'll focus on how you create an environment and populate it with templates and variables,

Once you've called `Environment.create_template(template_name, template_text)` you can then render that template with the following syntax `Environment.render(template_name, variables, undef_var)`.

- `template_name` is a string that refers to a previously created template
- `variables` should be a dictionary {} with any vars you want to pass in for that render.
- `undef_var` the string that will be placed in the template if you [[foo]] an undefined variable.

Once you've created your templates you may want some data to be available to all of them, you can do this with `set_obj(key, obj)`.

Generally you should only use `set_obj` when you plan on it being available for the duration of the environment, since there is no clean way to remove the reference (by design).

Let's bring it all together:

    var env = new genie.Environment();
    env.create_template('test', 'this time: [[inside]] but every time: [[_env.get_obj('the_local')]]');
    env.set_obj('the_local', 'BANGBANG');
    var result = env.render_template('test', {'inside':'boop'});

    assertEqual(result == 'this time: boop but every time: BANGBANG');

You'll notice a couple extras here, first `_env` is defined in every template rendered with an environment (so it could also be null). Using `get_obj` is a little difficult, and I'll try to make this cleaner in the future.

You can also use this to update values within the environment, lets try another example:

    var env = new genie.Environment();
    var enclosed_value = 0;

    env.create_template('test', 'one of many, [[_env.get_obj("get_and_incr")()]]');
    env.set_obj('get_and_incr', function() { enclosed_value += 1; return enclosed_value; });

    var result = env.render_template('test');
    assertEqual(result == 'one of many, 1')

    var result = env.render_template('test');
    assertEqual(result == 'one of many, 2')

    var result = env.render_template('test');
    assertEqual(result == 'one of many, 3')

Environments do allow for a couple other neat features, but since they are not totally ironed out yet, we'll leave them out of this documentation. :)

## Blocks and Sub-Templates

Different template engines handle this problem differently, depending on which problems you are trying to solve, what these features provide changes, some problems I'm trying to solve:

- It should be able to build complex templates, that are easy to read (like good code).
- Keep complexity low.

As a result, blocks are a way for a template writer to quickly build powerful templates, but it prevents them from making templates that are too hard to understand. As a result, `blocks` do not support inheritence and only have access to the scope of the current template render.

Since it's likely none of that made sense, let's jump into a example of a template:

    [% if v.lang == 'en' %]
      [[ english_block ]]
    [% else if v.lang == 'jp' %]
      [[ japanese_block ]]
    [% else if v.lang == 'es' %]
      [[ spanish_block ]]
    [% end %]

    [% block english_block %]
      Welcome!
    [% end %]

    [% block japanese_block %]
      ようこそ
    [% end %]

    [% block spanish_block %]
      Bienvenida
    [% end %]

During template compilation blocks are compiled into local functions to the scope of template, as a result calling them by value results in the content being returned and printed. The prime example blocks are used is in multi-langauge templates, but they can be used in as many locations as you want (the performance hit is minimal).

## Auto-Exposed Variables

Prior versions of Genie used the javascript "with" keyword, which made it significantly slower. After 0.3 all variables required a "v." in front of them if they were not explicitly exposed. As of 0.6 you can add the following key to your variables dictionary `__auto_expose__` to automatically expose all the variables you pass.

This does have a performance hit, (it results in your template being recompiled every time you render), but it is likely not noticable if you are only rendering your template a couple times.

# Handling Errors

## Stack Traces (as of 0.2)

   Genie now supports stack traces. (as demostrated in show_trace.html)
   Assuming the following template:

     [% if wtf < 0 %]
       hello world.
     [% end %]

   You would get a console error (as well as an exception) that looked like:

     Javascript Error => Can't find variable: wtf
     On template line => 1
     --------------------
      line 1:  [% if wtf < 0 %]
      line 2:      hello world.
     --------------------
     
   It will also work for javascript compilation errors, assuming the following template:

     [% if ]]?>?><><><><>&&&& %]
       hello world.
     [% end %]

   Which of course is not correct javascript at all, you would receive the following error:

     Javascript Error => Unexpected token ']]'
     On template line => 1
     --------------------
      line 1:  [% if ]]?>?><><><><>&&&& %]
      line 2:      hello world.
     --------------------

   These sorts of exceptions will make you feel more at home with Genie as your template
   engine.

## Error checking
 Using the normal __[[ name ]]__ syntax will also include some error correction (as well as the type filters above), the normal variable syntax will result in the following:

       typeof(name) != 'undefined') ? 
       escape_variable(name , 'undefined') : 
       undefined_variable('name')

 However, if you add an additional begin character ( default __[__ ) and the escaping (and filtering) will be removed, thus:

       [[[ name ]]

 Will result in:

        (name)


## Generated Code

Sometimes when debugging templates, it's easier to see the bug in the generated javascript (and more importantly your tools can parse the javascript). So I added the following method for all templates: `generated_code_as_string()` as well as the `genie_to_js.js` script.

Both should give you the ability to view the generated code in a way that your editor can parse, and you can test/lint/etc.

The `genie_to_js.js` can be run from the command line and accepts std-in until it reaches a EOF.

```bash
$ echo "hello world [[ v.name ]]" | node genie_to_js.js
(function(parent, v, defaults, undefined_variable, locals) {
    var write = locals.write; var escape_variable = locals.escape_variable;
    var partial = locals.partial; var bailout = locals.bailout;
    var _env = locals._env; var _template = locals._template;
    var __auto_expose__ = v.__auto_expose__;

    /* Int indicates line number in template that generated the javascript. */
    /* 0 */ write("hello world ");
    /* 0 */ var __tempvar_0 = (typeof( v.name ) != 'undefined') ?  v.name  : undefined_variable(" v.name ");
    /* 0 */ if (typeof(__tempvar_0) == "function") { write(__tempvar_0());}
    /* 0 */ else { write( __tempvar_0 ); }
    /* 1 */ write("\n");

});
```

