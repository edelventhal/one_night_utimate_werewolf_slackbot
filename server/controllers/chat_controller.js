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
                console.log( "Returning error: " + error );
                response.status( 200 ).json( error );
            }
            else
            {
                console.log( "Responding with " + JSON.stringify(responseJson));
                response.status( 200 ).json( responseJson );
                
                const params = chatApi.getParamsFromHook( request.body, request.query );
                chatApi.broadcastUpdates( params.gameId ); //we don't care about the cb, this can happen async
            }
        }.bind(this));
    }
};