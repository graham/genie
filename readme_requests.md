## Genie Requests

While Genie and GenieComponents allow a user to build fast, reusable web pages, it takes something more to make a interactive website: __data__.

The issue is that most data is passed over the wire, pre-rendered for the client. Genie already attempts to make that easier, but only once you've downloaded the data you want to display.

Genie Requests builds off a concept I've explored in previous projects ([Nydus](https://github.com/graham/nydus) | [Jafar](http://github.com/graham/jafar_old) | [Jafar2](http://github.com/graham/jafar)) in an attempt to streamline the client side of making requests.

In any larger organization, the structure and type of requests is often determined by a backend team, (server team), and the implementation is a mix of front-end and back-end engineers. In some cases even things as simple as [CSRF](http://en.wikipedia.org/wiki/Cross-site_request_forgery) attacks are not protected against simply because the front end engineer hasn't run into it as an issue before (once they do, they never forget). More often than not, security plays a massive role in how URL schemes are defined, (get vs post, auth, etc).

Genie Requests is an attempt to ensure that those decisions are made by the backend team, and that they make it easy for the front end team to manage.

They do so by creating an API for the front end team to work with, Genie Requests exposes that in a way that any front end engineer can work with.

Genie Requests will work on it's own, but in combination with Genie Components should make creating your next web application even easier.
