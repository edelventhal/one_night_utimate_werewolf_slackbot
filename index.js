/*global console*/
/*global require*/
/*global module*/
/*global process*/
/*global __dirname*/
var morgan = require( "morgan" );
var bodyParser = require( "body-parser" );
var express = require( "express" );
var app = express();
var http = require( "http" ).createServer( app );
var fs = require( "fs" );
var walkSync = require( "walk-sync" );
var port = process.env.PORT || 15000;

//call this to do everything
var Server = module.exports.Server =
{
    launchData: null,
    defaultControllerName: "page",
    
    runServer: function( cb )
    {
        this.configServer();
        this.setupRouting();
        this.startServer( cb );
    },

    configServer: function()
    {
        //support JSON, urlencoded, and multipart requests
        app.use( bodyParser.json( { extended: true } ) );

        //log the requests using morgan
        app.use( morgan( "combined" ) );

        //specify the pug views folder
        app.set( "views", __dirname + "/views" );

        //set the view engine to pug
        app.set( "view engine", "pug" );

        app.set( "port", port );

        //specify static content
        app.use( express[ "static" ]( __dirname + "/public" ) ); //using map-access of static so jslint won't complain
    },

    setupRouting: function()
    {
        //go through all the controllers and use their public functions as routes
        var controllerLocation = "./server/controllers";
        var suffix = "_controller.js";
        var defaultController = null;
        walkSync( controllerLocation ).forEach( function( file )
        {
            if ( file.substr( -1 * suffix.length ) === suffix )
            {
                var controller = require( controllerLocation + "/" + file );
                var prefix = file.substring( 0, file.length - suffix.length );
                if ( prefix === this.defaultControllerName )
                {
                    prefix = "";
                }
                else
                {
                    prefix = "/" + prefix;
                }
                
                this._addRoutes( this._getRoutes( controller, prefix ), "get" );
                
                if ( file === this.defaultControllerName + "_controller.js" )
                {
                    defaultController = controller;
                }
            }
        }.bind(this));
        
        //add a custom endpoint for the index
        if ( defaultController && defaultController.index )
        {
            app.get( "/", defaultController.index.bind( defaultController ) );
        }
    },
    
    _getRoutes: function( funcContainer, prefix )
    {
        var memberName;
        var member;
        var routeIndex;
        var subRoutes;
        var routes = [];
        prefix = prefix || "";
        
        //all the different endpoints are determined by the functions in the controllers.
        //private functions (starting with _) are ignored. This will also expand objects,
        //and will use the key for the object to add a "key/" to the route.
        for ( memberName in funcContainer )
        {
            member = funcContainer[ memberName ];
            if ( typeof( member ) === "function" )
            {
                if ( memberName.charAt(0) !== "_" )
                {
                    routes.push( { name: prefix + "/" + memberName, func: member, obj: funcContainer } );
                }
            }
            else if ( typeof( member ) === "object" )
            {
                subRoutes = this._getRoutes( member );
                for ( routeIndex = 0; routeIndex < subRoutes.length; routeIndex++ )
                {
                    routes.push( { name: prefix + "/" + memberName + subRoutes[ routeIndex ].name, func: subRoutes[ routeIndex ].func, obj: funcContainer } );
                }
            }
        }
        
        return routes;
    },
    
    //type should be "get", "post", etc.
    _addRoutes: function( routes, type )
    {
        console.log( "Adding routes: " + JSON.stringify( routes ) );
        
        var catchFunc = function( func, name, scopeObj, request, response )
        {
            try
            {
                func.call( scopeObj, request, response );
            }
            catch ( err )
            {
                this._sendError( err, request );
            }
        };
        
        var routeIndex;
        for ( routeIndex = 0; routeIndex < routes.length; routeIndex++ )
        {
            app[ type ]( routes[ routeIndex ].name, catchFunc.bind(this,routes[routeIndex].func, routes[ routeIndex ].name, routes[ routeIndex ].obj ));
        }
    },

    //when an error occurs in a route, this will get called. Edit if you want to handle errors in custom.
    _sendError: function( err, request )
    {
        console.error( "Route resulted in an uncaught exception! " + err + "\nparams: " + JSON.stringify( request.query ) + "\n" + err.stack );
    },

    startServer: function( cb )
    {
        app.listen( app.get( "port" ), function()
        {
            console.log( "Server is started on port " + app.get( "port" ) );
        
            if ( cb )
            {
                cb();
            }
        } );
    }
};

Server.runServer();
