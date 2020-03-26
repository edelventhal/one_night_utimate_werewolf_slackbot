/*global module*/
/*global console*/
/*global require*/

var utility = require( "./utility.js" );
var config = require ( "../config.js" );
var slack = require( "./slackApi.js" );
var discord = require( "./discordApi.js" );

//abstracted chat API that can connect to Slack, Discord, etc
var ChatAPI = module.exports =
{
    post: function( message, channel, cb )
    {
        this._getApi().post.apply( this, arguments );
    },
    
    postPrivately: function( message, channel, user, cb )
    {
        this._getApi().postPrivately.apply( this, arguments );
    },
    
    getUsersList: function( cb )
    {
        this._getApi().getUsersList.apply( this, arguments );
    },
    
    _getApi: function()
    {
        if ( process.env.CHAT_APP.toLowerCase() === config.ChatApp.Discord )
        {
            return discord;
        }
        return slack;
    }
}