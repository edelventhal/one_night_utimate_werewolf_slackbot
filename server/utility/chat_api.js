/*global module*/
/*global console*/
/*global require*/

var utility = require( "./utility.js" );
var config = require ( "../config.js" );
var slack = require( "./slack_api.js" );
var discord = require( "./discord_api.js" );

//abstracted chat API that can connect to Slack, Discord, etc
var ChatAPI = module.exports =
{
    //called by the chat_controller when a webhook comes in
    //hits the callback with error as first param, responseJson as the second
    //the second param will be sent directly to the webhook response
    respondToHook: function( body, query, cb )
    {
        this._getApi().respondToHook.apply( this._getApi(), arguments );
    },
    
    //{ channelId, responseUrl, userId, actions }
    getParamsFromHook: function( body, query )
    {
        return this._getApi().getParamsFromHook.apply( this._getApi(), arguments );
    },
    
    post: function( message, channel, cb )
    {
        this._getApi().post.apply( this._getApi(), arguments );
    },
    
    postPrivately: function( message, channel, user, cb )
    {
        this._getApi().postPrivately.apply( this._getApi(), arguments );
    },
    
    getUsersList: function( cb )
    {
        this._getApi().getUsersList.apply( this._getApi(), arguments );
    },
    
    broadcastUpdates: function( gameId, cb )
    {
        this._getApi().broadcastUpdates.apply( this._getApi(), arguments );
    },
    
    _getApi: function()
    {
        if ( process.env.CHAT_APP && process.env.CHAT_APP.toLowerCase() === config.ChatApp.Discord )
        {
            return discord;
        }
        return slack;
    }
}