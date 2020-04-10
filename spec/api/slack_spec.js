var GameModel = require( "../../server/models/game_model.js" );
var slack = require( "../../server/utility/slack_api.js" );
var config = require( "../../server/config.js" );
var utils = require( "../utility/testUtils.js" );

const GAME_ID = "TEST";
const PLAYER_ID = "eli";

const SLASH_COMMAND_BODY =
{
    "token": "PtDDt1NqjzYQ9w7lszFZG0Ko",
    "team_id": "T6L6E5Q5B",
    "team_domain": "ubiquity6",
    "channel_id": "G010XMKRRPH",
    "channel_name": "privategroup",
    "user_id": "UJ2R60QHL",
    "user_name": "eli",
    "command": "/werewolf",
    "text": "",
    "response_url": "https://hooks.slack.com/commands/T6L6E5Q5B/1042699213424/cbICL1g3n8Jpj8aXOcGto7G4",
    "trigger_id": "1042699213568.224218194181.29a1fe2eb18f91f647e259ee02f9ab6d"
};

const ADD_TROUBLEMAKER_PAYLOAD =
{
    "type": "block_actions",
    "team": {
        "id": "T6L6E5Q5B",
        "domain": "ubiquity6"
    },
    "user": {
        "id": "UJ2R60QHL",
        "username": "eli",
        "name": "eli",
        "team_id": "T6L6E5Q5B"
    },
    "api_app_id": "A010V2RUS4C",
    "token": "PtDDt1NqjzYQ9w7lszFZG0Ko",
    "container": {
        "type": "message",
        "message_ts": "1585774356.000400",
        "channel_id": "G010XMKRRPH",
        "is_ephemeral": true
    },
    "trigger_id": "1032696277697.224218194181.df1891fef08ed840bf36160ff403e848",
    "channel": {
        "id": "G010XMKRRPH",
        "name": "privategroup"
    },
    "response_url": "https://hooks.slack.com/actions/T6L6E5Q5B/1032696277329/dLdeispHaye2TAZqvZhNbpRZ",
    "actions": [{
        "type": "static_select",
        "action_id": "rvI9T",
        "block_id": "Gfrq",
        "selected_option": {
            "text": {
                "type": "plain_text",
                "text": "Troublemaker",
                "emoji": true
            },
            "value": "addRoletroublemaker"
        },
        "placeholder": {
            "type": "plain_text",
            "text": "Add a role",
            "emoji": true
        },
        "action_ts": "1585774530.755817"
    }]
};

const JOIN_GAME_PAYLOAD =
{
    "type": "block_actions",
    "team": {
        "id": "T6L6E5Q5B",
        "domain": "ubiquity6"
    },
    "user": {
        "id": "UJ2R60QHL",
        "username": "eli",
        "name": "eli",
        "team_id": "T6L6E5Q5B"
    },
    "api_app_id": "A010V2RUS4C",
    "token": "PtDDt1NqjzYQ9w7lszFZG0Ko",
    "container": {
        "type": "message",
        "message_ts": "1585774253.000300",
        "channel_id": "G010XMKRRPH",
        "is_ephemeral": true
    },
    "trigger_id": "1031192219731.224218194181.db5ecd866df9183727916cb166655a61",
    "channel": {
        "id": "G010XMKRRPH",
        "name": "privategroup"
    },
    "response_url": "https://hooks.slack.com/actions/T6L6E5Q5B/1031192219491/bRnQSNOcmcwkTzAldjJ0hPbG",
    "actions": [{
        "action_id": "+zWdR",
        "block_id": "0Rz",
        "text": {
            "type": "plain_text",
            "text": "Join Game",
            "emoji": true
        },
        "value": "joinUJ2R60QHL",
        "type": "button",
        "action_ts": "1585774264.574539"
    }]
};

//write the game ID into the channel ID for the payload
SLASH_COMMAND_BODY.channel_id = GAME_ID;
SLASH_COMMAND_BODY.user_id = PLAYER_ID;
SLASH_COMMAND_BODY.response_url = null;

ADD_TROUBLEMAKER_PAYLOAD.container.channel_id = GAME_ID;
ADD_TROUBLEMAKER_PAYLOAD.user.id = PLAYER_ID;
ADD_TROUBLEMAKER_PAYLOAD.response_url = null;
JOIN_GAME_PAYLOAD.container.channel_id = GAME_ID;
JOIN_GAME_PAYLOAD.user.id = PLAYER_ID;
JOIN_GAME_PAYLOAD.actions[0].value = "join" + PLAYER_ID;
JOIN_GAME_PAYLOAD.response_url = null;

//Slack sends these as stringified payloads for whatever reason
const ADD_TROUBLEMAKER_BODY = { payload: JSON.stringify( ADD_TROUBLEMAKER_PAYLOAD ) };
const JOIN_GAME_BODY = { payload: JSON.stringify( JOIN_GAME_PAYLOAD ) };

describe( "Slack API", function()
{
    //make sure to clear out the game that's tied to each payload
    beforeEach(function( cb )
    {
        new GameModel( GAME_ID, function( game )
        {
            game.reset( cb );
        });
    });
    
    // it( "should be able to get a payload from a slash command", function( cb )
    // {
    //     slack.respondToHook( SLASH_COMMAND_BODY, {}, function( error, responseJson )
    //     {
    //
    //     });
    // });
    
    it( "should be able to add a troublemaker to the roles", function( cb )
    {
        slack.respondToHook( ADD_TROUBLEMAKER_BODY, {}, function( error )
        {
            expect(error).toBeFalsy();
            new GameModel( GAME_ID, function( game )
            {
                expect(game.availableRoles.length).toEqual(1);
                expect(game.availableRoles[0]).toEqual("troublemaker");
                cb();
            });
        });
    });
    
    it( "should be able to add a new player to the game", function( cb )
    {
        slack.respondToHook( JOIN_GAME_BODY, {}, function( error )
        {
            expect(error).toBeFalsy();
            new GameModel( GAME_ID, function( game )
            {
                expect(game.players.length).toEqual(1);
                expect(game.players[0]).toEqual(PLAYER_ID);
                cb();
            });
        });
    });
});