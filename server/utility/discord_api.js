/*global module*/
/*global console*/
/*global require*/

var utility = require( "./utility.js" );

//TODO
var DiscordAPI = module.exports =
{
    respondToHook: function( body, query, cb )
    {
        cb();
    },
    
    getParamsFromHook: function( body, query )
    {
        return {};
    },
    
    getUsersList: function( cb )
    {
        cb( [] );
    },
    
    post: function( message, channel, cb )
    {
        cb()
    },
    
    postPrivately: function( message, channel, user, cb )
    {
        cb();
    }
}