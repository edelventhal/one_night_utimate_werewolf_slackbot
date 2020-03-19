# one\_night\_ultimate\_werewolf\_slackbot

This is a modified dupe of https://github.com/eli-lumos/node_express_skeleton .

The intention of this bot is to let people play One Night Ultimate Werewolf over video chat. Its a Slackbot that assigns roles automatically and allows people to swap cards, etc, but otherwise does nothing. You should use the free One Night Werewolf app on mobile to referee the game and run the night sequence. For stuff like the Masons and Werewolves opening their eyes / thumbsing up, that should all be done over video chat.

Built to run on Heroku. To make one for your org, install this onto Heroku, install redis there, and then do the normal Slack bot adding etc. You'll need to add the proper environment variables (SLACK_AUTH) to the Settings section of your Heroku app. Or you can just define those environment variables before running this.

Then add the Slackbot to whatever channel you want to play in, and use the commands on Slack to get a game going. 


--------------------------------
# Original readme

This creates a simple MVC skelton for node.js servers on top of express and pug (formerly called jade).

index.js does all of the setup automatically which should serve most cases. It can be edited to change anything as desired (for example, adding support for POST requests, since the default is to make everything a GET request).

If you want to use this skeleton, feel free to fork the project, duplicate and edit it, whatever. Please include a link to the original project: https://github.com/eli-lumos/node_express_skeleton somewhere.

### Controllers and Routes

All routes (URLs that may be called) are defined by controllers. It's very simple to add custom routes using your own controllers.

To create a controller, simply add a file to the path `server/controllers/my_controller.js`. Note that the file *must* be underneath the `server/controllers` folder, and *must* end with `_controller.js` as a suffix. If both are true, the file will be recognized as a controller and will be imported and scanned for routes. You can use subfolders and they will simply be part of the resulting route path (for example, `server/controllers/users/create_controller.js` would result in paths that start with `users/create`).

To add routes to a controller, you must set `module.exports` to be an object with functions corresponding to your routes inside. See `test_controller.js` for an example. Any function included within `module.exports` that does *not* start with an underscore (private functions) will be considered a route. In addition, you can include an object member, and have functions within that object (as recursively as you like) to add multiple slashes to your route and help to organize paths. Each route function should take `(request, response)` as its parameters. These are the express request and response objects. To avoid the page hanging, you must use the response object to notify when you're done (for example, with response.json() or response.render()).

    //within the file server/controllers/test_controller.js
    module.exports =
    {
        //sends a JSON object back as a response
        //mySite.com/test/myRoute
        myRoute: function( request, response )
        {
            response.status(200).json( { success: true } );
        },
    
        //renders a Pug page as a response (page found at views/myPugPage.pug)
        //mySite.com/test/myPageRenderRoute
        myPageRenderRoute: function( request, response )
        {
            response.render( "myPugPage" );
        },
    
        //times out!
        //mySite.com/test/timeout    
        timeout: function( request, repsonse )
        {
            console.log( "This will time out since we don't call the response!" );
        },
    
        //takes URL parameters to do something with it, and barfs if not provided with a required one
        //mySite.com/test/useParameter?id=whatever
        useParameter: function( request, response )
        {
            if ( !request.query.id )
            {
                response.status(500).json( { success: false, error: "id is a required parameter." } );
            }
            else
            {
                response.status(200).json( { success: true } );
            }
        },
    
        sub:
        {
            //sends a JSON object back as a response
            //mySite.com/test/sub/myRoute
            myRoute: function( request, response )
            {
                response.status(200).json( { success: true } );
            }
        }
    };

### Models

Models are typically connected with database entries. They're not strictly speaking required to make anything work. To have good MVC, you should put all yours business into models and you should put them at the path `server/models/my_model.js`. However, this is not required – there is nothing special about models in this skeleton.

For a good database-connected pattern, check out `server/models/test_model.js`.

### Views

Views represent anything that gets rendered out to the user. In this skeleton, they are all pug files, but you could use any view engine you like (just make sure to edit `page_controller.js` if you do so). The page controller will automatically browse through all pug files located in the `views` folder and connect them to controller functions. So, to browse to `views/test.pug` you need only navigate to `mySite.com/test`, as long as you keep the page controller in your project and don't change the defaultControllerName in index.js.

Using all the usual pug / express rules and conventions, you can send parameters and data to your pug file in order to dynamically render content.

### redis database

For the skeleton app, a redis database is included but not hooked up. The test model *does* use the database. Redis is conventient for quick prototyping and simple servers, but a better long-term option would be to hook up SQL or similar.

Within the file `server/database.js` is a wrapper for redis use. You can start building your app using this, then if you switch to a different sort of db you can simply edit the contents of database.js to make that work.

### public folder

Everything that lives in the `public` folder is accessible by the client, and is considered the root directory when it comes to including js and css files. This can be changed in the `configServer()` function in `index.js`.

### debug.pug, routes.js, and routeTester.js

`debug.pug` is an endpoint you can use to access and control debug functionality. It uses the public JS files `routes.js` and `routeTester.js` to make a simple debug panel that allows you to directly call endpoints available in your app. Currently, `routes.js` must be built manually to allow any routes you care to test. In the future, it may be worth implementing a startup node function that automatically populates this file based upon all available routes – but that also could create security risks.

Simply delete this file if you do not want this functionality.

To add new routes, simply edit the `routes` object at the top of `routes.js`.

    //example routes
    "user/get": { params: [ "username" ], color: "#33cc33", backgroundColor: "#99ff99" },
    "user/reset": { params: [ "username" ], color: "#cc3333", backgroundColor: "#ff9999", showWarning: true }

The key for each element is the route itself – it should correspond with the controller and function you want to test. All members of the value object are optional, but an object must exist for the route to be used. The `params` member is an array of parameters you want to allow the user to type in that will be passed to the controller function using `response.query[param]`. The `color` member determines how that field's text is colored when shown on the page (useful for making accessors green and mutators red, for example). The `backgroundColor` member is similar, but for the (you guessed it) background color. The `showWarning` member, if true, will pop up a warning if the user tries to call that route – use this for destructive routes.