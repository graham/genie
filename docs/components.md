## Genie Components

While [Genie](http://www.github.com/graham/genie) provides a great way for people to create templates in the browser, it doesn't fulfill the requirements of writing great single page applications.

As a result, I'm adding two major components to Genie. The first is Components, which has already been completed (and is the subject of this document), and the second is Requests, which I'll cover in a future document.

----

### Components

The goal of Components is to allow app developers the ability to create components of their websites much in the way application developers create Classes or User Interface Components. While often the case within an operating system (both desktop and mobile) the best corollary would be something like iOS); which has a number of "off the shelf" components that have a specific set of commands developers can rely on.

For reasons that are unclear, this hasn't really caught on in the world of browsers.  This could be due to the fact that there is no agreed upon way to create applications, but that is mostly due to the fact that there is no standard or committee making that choice. The reality is, committees and standards can do as much harm as good, and in many ways I don't think there should be one.

Another possibility is that more often than not, attempts at this sort of solution require too much tooling. Either a significant amount of preprocessing must happen (less/sass are examples that don't make it into every application, even though they make CSS better), or they modify the structure of an application so much, people feel locked in to a proprietary system.

**Genie Components** should be a powerful system that doesn't make you feel like you are locked in.

The last reason, and one that Genie Components will have to overcome itself, is making sure that error reporting still works as your app grows in complexity. Any sort of pre or post processing can reorganize the output to the point where the standard error reporting system is comletely useless. However, modern browsers provide enough tooling that this shouldn't be an issue (and Genie Components does as little pre/post processing as it can).

----

### Ok, so how does it work

Genie Components are generally loaded as a single file (there are many ways to create Components, but we'll skip that for now), and fire a "ready" event once they are ready to be presented (much like the DOM itself).

An example of a Genie Component is as follows:

    <script>
        component.on('ready', function() {
            this.set_time( new Date() );
            this.load();
        });
        
        component.on('state_did_change', function() {
            this.reload();
        });

        component.methods({
            set_time: function(d_obj) {
                this.set('time', d_obj);
            }
        });
    </script>

    <template id='root'>
        <div class='gc_timer'>
            The current time is [[ v.time ]]
        </div>
    </template>

    <style>
        .gc_timer { 
            font-size: 20px;
            font-weight: bold;
        }
    </style>
    
Once you've created this document, assume you've saved it somewhere accessible like: __/static/time.txt__

You can now create the component with the following:

    var target = document.getElementById('test');
    gc = new mvc.GCComponent({
        url:'static/time.txt',
        target:target
    });
    
Once the document is loaded it is split into it's different tags (template, style, script) the "component" object is scoped into any script tag so that you can refer to it correctly. Style and Script tags will only be appended to the document when __component.load()__ is called which should reduce the bloat that can occur on initial load.

    <template id='root'>

Is important because it tells the GCComponent loader that this is the main template you'd like to use, you can define other templates (and use them within the root template) but we'll get into that a bit later (it's really easy).

The beauty, is that you now have a object that you can call methods on, and it will update the view (target DOM object) automatically. Based on the previous example, you could simply run 

    gc.set_time( new Date() );
    
And the appropriate DOM item would be updated (because of the __this.reload()__)

Not only do we encapsulate the functionality of the component, but we expose an interface for other users to interact with. Again, the correlations to iOS or other modern UI systems are huge.

## Why is this different

There are a couple ways this can be valuable, the first focuses on small app developers that want to get started quickly, and the second focuses on more experienced developers working in large organizations. (Keep in mind these are the same reasons you'd want to use something like the UIToolkit in iOS).

First, from the perspective of the small developer, these components give you the ability to create and interact with objects that might be too complex for you to build (or you just don't have the time to do it right). With a decent module system you could see a developer build something very quickly with importable modules.

Second, within a larger organization (where things like design and architecture might be _actually_ organized) this provides developers to move quickly, because the backend of a component could change, and as long as the interface stays the same their pages will work.

Third, CSS/HTML packages like Bootstrap are great, but they can't encapsulate functionality with their components in the same way. Building a large library of these components (like Bootstrap, or even as an extension to it) would provide developers all over the world with easy access to pre-built components (that they could then skin themselves).

With GenieComponents you bring the power that has been available to software developers on desktops (and almost every OO language ever created) to your web applications, and unlike applications like React and AngularJS almost no pre/post processing is required.

## How it works

Every Genie Component extends a root class of __Component__ or __GCComponent__ (which itself is a subclass of __Component__).

GCComponent supports a little more functionality out of the box, but nothing that a decent javascript engineer can't recreate in a couple minutes.

One of the core focuses of such a system is that it should work with your style, with your stack and shouldn't get in your way. This is something that I didn't like about React/Angular I felt like it required me to work in a completely different way, and especially when encorporating my work into an already existing project, starting over with a new process can be very difficult.

Every Component object has the following variables:

 1. Target DOM Element -> Where everything the Component controls ends up.
 1. Event Listeners -> anyone who has registered to be notified of an event.
 1. State -> A javascript hash {} that contains the state of the component.

And thats it, nothing too fancy. A couple methods are provided as well:

 - `set_target(dom_obj)` -> Sets the target dom element.
 - `get(key)` / `set(key, value)` -> get/set for state vars (fires state events).
 - `on(evt, callback)` / `off(evt)` -> Listen for events (or remove them).
 - `fire(evt, args)` -> Fire an event of your choice.  - `wait(callback, ms)` -> simple timeout (with local bind)
 - and a couple more...

GCComponent does the download and resource management for you, as well as `load()` and `reload()`.

I'd exect that some developers would want to manage this themselves (GCComponent uses jQuery). By redefining the root subclass you can change out the middleware and your components will still work.

Replacing GCComponent with your own is easy, as of right now it's only 60 lines of simple javascript.

## Further Reflections

There's a talk [here](https://www.youtube.com/watch?v=u6RFyVN9sNg), given by Yehuda Katz about how Ember.js does these sorts of things. It's a decent talk, but he runs into issues while creating his demo app that are exactly why I don't think Genie Components shouldn't be too complex.
 
 > To be clear, these are issues I have with Ember, Yehuda is a pretty cool dude.
 


..
-----




