/*global module*/
/*global console*/
/*global require*/

var utility = require( "./utility.js" );

var SlackAPI = module.exports =
{
    getUsersList: function( cb )
    {
        utility.httpsPostJson( "https://slack.com/api/users.list", {}, process.env.SLACK_AUTH, cb );
    },
    
    post: function( message, channel, cb )
    {
        const payload = { channel: ( channel || process.env.SLACK_CHANNEL ), text: message };
        utility.httpsPostJson( "https://slack.com/api/chat.postMessage", payload, process.env.SLACK_AUTH, cb );
    },
    
    postPrivately: function( message, channel, user, cb )
    {
        const payload = { channel: ( channel || process.env.SLACK_CHANNEL ), text: message, user: user };
        utility.httpsPostJson( "https://slack.com/api/chat.postEphemeral", payload, process.env.SLACK_AUTH, cb );
    }
}