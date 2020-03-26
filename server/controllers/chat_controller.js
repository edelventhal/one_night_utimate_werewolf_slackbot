/*global module*/
/*global require*/

var database = require( "../database.js" );
var utility = require( "../utility/utility.js" );

//Connect this hook to your chat app - all incoming messages can be re-routed from here
var ChatController = module.exports =
{
    command: function( request, response )
    {
        response.status( 200 ).json( { success: true } );
    }
};