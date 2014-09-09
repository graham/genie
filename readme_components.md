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

With GenieComponents you bring the power that has been available to software developers on desktops (and almost every OO language ever created) to your web applications, and unlike applications like React and AngularJS almost no pre/post processing is required.

..
-----




