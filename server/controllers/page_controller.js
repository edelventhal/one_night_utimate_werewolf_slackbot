/*global module*/
/*global require*/
/*global console*/

const fs = require( "fs" );
const coffee = require( "../models/coffee_model.js" );

//the PageController is a special controller where its members are accessed without the prefix "/page".
//instead, they are accessed directly using the name of the function. ex: website.com/index instead of website.com/page/index
//this special functionality can be changed by modifying the defaultControllerName variable at the top of index.js.
const PageController = module.exports =
{
    _renderPage: function( page, request, response )
    {
        response.render( page );
    },
    
    //renders the index HTML page (bound to the / route)
    //using typical pug syntax, you can send custom (server-driven) data to your page through here
    index: function( request, response )
    {
        coffee.getMessage( function( message )
        {
            response.render( "index", { customData: { "message": message } } );
        });
    }
};

//The PageController handles all the pug files automatically by looping
//through all the pug files and creating corresponding functions to render them.
const suffix = ".pug";
const viewLocation = "./views";
fs.readdirSync( viewLocation ).forEach( function( file )
{
    if ( file.substr( -1 * suffix.length ) === suffix )
    {
        var pageName = file.substring( 0, file.length - suffix.length );
        if ( !PageController[ pageName ] )
        {
            PageController[ pageName ] = PageController._renderPage.bind( PageController, pageName );
        }
    }
});