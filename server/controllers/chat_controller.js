/*global module*/
/*global require*/

var database = require( "../database.js" );
var utility = require( "../utility/utility.js" );
var chatApi = require( "../utility/chat_api.js" );

//Connect this hook to your chat app - all incoming messages can be re-routed from here
var ChatController = module.exports =
{
    command: function( request, response )
    {
        chatApi.respondToHook( request.body, request.query, function( error, responseJson )
        {
            if ( error )
            {
                response.status( 500 ).json( { error: error } );
            }
            else
            {
                response.status( 200 ).json( responseJson );
            }
        });
    }
};