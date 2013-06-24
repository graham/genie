# Genie 

### Javascript Templates that make your wishes come true.

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

 ** I realize there is room to improve here **
