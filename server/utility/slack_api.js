/*global module*/
/*global console*/
/*global require*/

var utility = require( "./utility.js" );
var config = require( "../config.js" );
var gameUtility = require( "./game_utility.js" );

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
    },
    
    respondToHook: function( body, query, cb )
    {
        //for testing...
//         body = {
//   "payload": {
//     "type": "block_actions",
//     "team": {
//       "id": "T6L6E5Q5B",
//       "domain": "ubiquity6"
//     },
//     "user": {
//       "id": "UJ2R60QHL",
//       "username": "eli",
//       "name": "eli",
//       "team_id": "T6L6E5Q5B"
//     },
//     "api_app_id": "A010V2RUS4C",
//     "token": "PtDDt1NqjzYQ9w7lszFZG0Ko",
//     "container": {
//       "type": "message",
//       "message_ts": "1585260620.000600",
//       "channel_id": "G010XMKRRPH",
//       "is_ephemeral": true
//     },
//     "trigger_id": "1029768789077.224218194181.cd952da18587b3857a141cf92f04d19b",
//     "channel": {
//       "id": "G010XMKRRPH",
//       "name": "privategroup"
//     },
//     "response_url": "https://hooks.slack.com/actions/T6L6E5Q5B/1031851602791/kLNNakWPJUjBF86hz2xRDJJ8",
//     "actions": [
//       {
//         "action_id": "uSjg7",
//         "block_id": "4zW",
//         "text": {
//           "type": "plain_text",
//           "text": "Button",
//           "emoji": true
//         },
//         "value": "click_me_123",
//         "type": "button",
//         "action_ts": "1585262052.504038"
//       }
//     ]
//   }
// };

        console.log( "Body coming in: " + JSON.stringify(body));
        
        const channelId = body.payload && body.payload.container ? body.payload.container.channel_id : body.channel_id;
        
        if ( !channelId )
        {
            cb( "You can only use this bot in a channel." );
            return;
        }
        
        const userId = body.payload && body.payload.user ? body.payload.user.id : body.user_id;
        
        const payload = {};
        
        gameUtility.get( channelId, ( game ) =>
        {
            if ( body.payload && body.payload.actions )
            {
                this._respondToActions( game, body.payload.actions, ( error ) =>
                {
                    if ( error )
                    {
                        cb( error );
                    }
                    else
                    {
                        this._preparePayload( game, payload );
                        cb( null, payload );
                    }
                });
            }
            else
            {
                this._preparePayload( game, payload );
                cb( null, payload );
            }
        });
    },
    
    //TODO - should move all of this into a view of some kind
    _preparePayload: function( game, payload )
    {
        //show buttons related to starting a new game, adding players, etc
        if ( game.phase === config.GamePhase.WaitingForPlayers )
        {
            this._preparePayloadWaitingForPlayers( game, payload );
        }
        else if ( game.phase === config.GamePhase.Night )
        {
            this._preparePayloadNight( game, payload );
        }
    },
    
    _preparePayloadWaitingForPlayers: function( game, payload )
    {
        const isFull = game.players.length >= config.maximumPlayerCount;
        
        payload.blocks =
        [
            {
                "type": "section",
                "text":
                {
                    "type": "mrkdwn",
                    "text": "Welcome to *One Night Ultimate Werewolf* :wolf:!\n" +
                        ( isFull ? "The game is currently full." : "To play a game, have between 3-10 players join with the `/werewolf` command.\n" ) +
                        "You can set which roles are allowed in the game, or enter nothing to use the default roles."
                        //appended dynamically below
                }
            },
            {
                "type": "actions",
                "elements":
                [
                    //added dynamically below
                ]
            }
        ]
        
        const messageBlock = payload.blocks[0];
        
        //players
        messageBlock.text.text += "\nPlayers: ";
        if ( game.players.length <= 0 )
        {
            messageBlock.text.text += "None";
        }
        else
        {
            game.players.forEach( function( playerId )
            {
                messageBlock.text.text += `<@${playerId}> `;
            });
        }
        
        //roles
        messageBlock.text.text += "\nRoles: ";
        if ( game.availableRoles.length <= 0 )
        {
            messageBlock.text.text += "Default";
        }
        else
        {
            game.availableRoles.forEach( function( role )
            {
                messageBlock.text.text += `${role.charAt(0).toUpperCase() + role.substring(1)} `;
            });
        }
        
        //actions
        const actionsBlock = payload.blocks[1];
        
        const hasUser = game.hasPlayer( userId );
        if ( hasUser || !isFull )
        {
            actionsBlock.elements.push(
            {
                "type": "button",
                "text":
                {
                    "type": "plain_text",
                    "text": game.hasPlayer( userId ) ? "Leave Game" : "Join Game",
                    "emoji": true
                },
                "value": game.hasPlayer( userId ) ? ( "drop" + userId ) : ( "join" + userId )
            });
        }
        
        const roleSelectAction =
        {
            "type": "static_select",
            "placeholder":
            {
                "type": "plain_text",
                "text": "Add a role",
                "emoji": true
            },
            "options":
            [
                //dynamically added
            ]
        };
        
        game.unusedRoles.forEach( function( role )
        {
            roleSelectAction.options.push(
            {
                "text":
                {
                    "type": "plain_text",
                    "text": `${role.charAt(0).toUpperCase() + role.substring(1)}`,
                    "emoji": true
                },
                "value": "addRole" + role
            });
        });
        
        actionsBlock.elements.push( roleSelectAction );
        
        if ( game.players.length >= config.minimumPlayerCount )
        {
            actionsBlock.elements.push(
            {
                "type": "button",
                "text":
                {
                    "type": "plain_text",
                    "text": "Start Game",
                    "emoji": true
                },
                "value": "start"
            });
        }
    },
    
    _preparePayloadNight: function( game, payload )
    {
        if ( !game.hasPlayer( userId ) )
        {
            
        }
        const role = game.roles[userId];
        const isUserTurn = game.isUserTurn( userId );
        
        payload.blocks =
        [
            {
                "type": "section",
                "text":
                {
                    "type": "mrkdwn",
                    "text": "It's *NIGHT*. :full_moon:\n" +
                        "Play the One Night Ultimate Werewolf app with the default game and all roles you chose, then follow its instructions.\n" +
                        "Your role is: *" + `${role.charAt(0).toUpperCase() + role.substring(1)}.\n` +
                        ( isUserTurn ? "Your turn! Perform your action." : "*CLOSE YOUR EYES* Open only when told, then use the `/werewolf` command again." )
                }
            }
        ]
        
        if ( isUserTurn )
        {
            const actionsBlock =
            {
                "type": "actions",
                "elements":
                [
                    //added dynamically below
                ]
            };
            
            payload.blocks.push( actionsBlock );
            
            if ( role === "doppelganger" )
            {
                actionsBlock.elements.push( this._getPlayersSelectAction( game, userId, "Copy a player", "doppelgangerCopy" ) );
                
                //TODO - we need to show all the shit below if the doppelganger swaps to one of these other ones :'-(
            }
            else if ( role === "werewolf" )
            {
                actionsBlock.elements.push(
                {
                    "type": "button",
                    "text":
                    {
                        "type": "plain_text",
                        "text": "Reveal a middle card",
                        "emoji": true
                    },
                    "value": "werewolfRevealMiddle"
                });
            }
            else if ( role === "seer" )
            {
                actionsBlock.elements.push(
                {
                    "type": "button",
                    "text":
                    {
                        "type": "plain_text",
                        "text": "Reveal 2 middle cards",
                        "emoji": true
                    },
                    "value": "seerRevealMiddle"
                });
                
                actionsBlock.elements.push( this._getPlayersSelectAction( game, userId, "Reveal a player's card", "seerRevealTarget" ) );
            }
            else if ( role === "robber" )
            {
                actionsBlock.elements.push( this._getPlayersSelectAction( game, userId, "Steal from a player", "robberSteal" ) );
            }
            else if ( role === "troublemaker" )
            {
                actionsBlock.elements.push( this._getPlayersSelectAction( game, userId, "Swap two players", "troublemakerSwap", true ) );
            }
            else if ( role === "drunk" )
            {
                actionsBlock.elements.push(
                {
                    "type": "button",
                    "text":
                    {
                        "type": "plain_text",
                        "text": "Get a random middle card",
                        "emoji": true
                    },
                    "value": "drunkSwap"
                });
            }
            else if ( role === "insomniac" )
            {
                actionsBlock.elements.push(
                {
                    "type": "button",
                    "text":
                    {
                        "type": "plain_text",
                        "text": "Inspect your card",
                        "emoji": true
                    },
                    "value": "insomniacInspect"
                });
            }
        }
    },
    
    _getPlayersSelectAction: function( game, userId, text, selectValuePrefix, multiSelect )
    {
        const selectAction =
        {
            "type": multiSelect ? "multi_static_select" : "static_select",
            "placeholder":
            {
                "type": "plain_text",
                "text": text,
                "emoji": true
            },
            "options":
            [
                //dynamically added
            ]
        };
        
        game.players.forEach( function( playerId )
        {
            if ( playerId !== userId )
            {
                selectAction.options.push(
                {
                    "text":
                    {
                        "type": "plain_text",
                        "text": `<@${playerId}>`,
                        "emoji": true
                    },
                    "value": selectValuePrefix + playerId
                });
            }
        });
        
        return selectAction;
    },
    
    _respondToActions: function( game, actions, cb )
    {
        let actionProcessedCount = 0;
        let errorText = "";
        
        const actionCompleteFunc = ( error ) =>
        {
            if ( error )
            {
                errorText += error + " ";
            }
            
            actionProcessedCount++;
            if ( actionProcessedCount >= actions.length )
            {
                cb( errorText );
            }
        };
        
        actions.forEach( ( action ) =>
        {
            this._respondToAction( game, action.value, actionCompleteFunc );
        });
    },
    
    _respondToAction: function( game, actionId, cb )
    {
        if ( !actionId )
        {
            cb( "No action ID provided." );
            return;
        }
        
        if ( actionId.indexOf( "join" ) === 0 )
        {
            const userId = actionId.substring( "join".length );
            game.addPlayer( userId, cb );
        }
        else if ( actionId.indexOf( "drop" ) === 0 )
        {
            const userId = actionId.substring( "drop".length );
            game.removePlayer( userId, cb );
        }
        else if ( actionId.indexOf( "addRole" ) === 0 )
        {
            const role = actionId.substring( "addRole".length );
            game.addRole( role, cb );
        }
        else if ( actionId.indexOf( "removeRole" ) === 0 )
        {
            const role = actionId.substring( "removeRole".length );
            game.removeRole( role, cb );
        }
        else if ( actionId.indexOf( "start" ) === 0 )
        {
            game.startGame( cb );
        }
        else
        {
            cb( "Invalid action." );
        }
    }
}