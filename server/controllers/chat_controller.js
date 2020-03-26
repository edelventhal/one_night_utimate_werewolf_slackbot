/*global module*/
/*global require*/

var database = require( "../database.js" );
var utility = require( "../utility/utility.js" );

//Connect this hook to your chat app - all incoming messages can be re-routed from here
var ChatController = module.exports =
{
    command: function( request, response )
    {
        console.log( "Incoming data: " + request.body );
        response.status( 200 ).json( {
	"blocks": [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "A message *with some bold text* and _some italicized text_."
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "You can add a button alongside text in your message. "
			},
			"accessory": {
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": "Button",
					"emoji": true
				},
				"value": "click_me_123"
			}
		}
	]
} );
    }
};