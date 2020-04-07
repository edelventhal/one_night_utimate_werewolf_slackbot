/*global module*/
/*global console*/
/*global require*/

var utility = require( "./utility.js" );
var config = require( "../config.js" );
var gameUtility = require( "./game_utility.js" );
var GameModel = require( "../models/game_model.js" );

var SlackAPI = module.exports =
{
    getUsersList: function( cb )
    {
        console.log( "gimme users" );
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
    
    broadcastUpdates: function( gameId, cb )
    {
        let doneCount = 0;
        let doneTargetCount = 0;
        const doneFunc = () =>
        {
            doneCount++;
            if ( doneCount >= doneTargetCount && cb )
            {
                cb();
            }
        };
        
        gameUtility.get( gameId, ( game ) =>
        {
            Object.keys( game.responseUrls ).forEach( ( playerId ) =>
            {
                doneTargetCount++;
                
                const payload = {};
                this._preparePayload( game, playerId, payload );
                this._callResponseUrl( game.responseUrls[playerId], payload, doneFunc );
            });
            
            if ( doneTargetCount <= 0 )
            {
                doneFunc();
            }
        });
    },
    
    getParamsFromHook: function( body, query )
    {
        const incomingPayload = body.payload ? JSON.parse( body.payload ) : null;
        //console.log( "payload is " + JSON.stringify( incomingPayload ) );
        const channelId = incomingPayload && incomingPayload.container ? incomingPayload.container.channel_id : body.channel_id;
        const responseUrl = incomingPayload ? incomingPayload.response_url : body.response_url;
        const userId = incomingPayload && incomingPayload.user ? incomingPayload.user.id : body.user_id;
        const actions = incomingPayload ? incomingPayload.actions : null;
        
        return { channelId, responseUrl, userId, actions };
    },
    
    respondToHook: function( body, query, cb )
    {
        //console.log( "Body type " + body + " " + typeof(body));
        //console.log( "Body coming in: " + JSON.stringify(body));
        
        const params = this.getParamsFromHook( body, query );
        const channelId = params.channelId;
        
        if ( !channelId )
        {
            cb( "You can only use this bot in a channel." );
            return;
        }
        
        const responseUrl = params.responseUrl;
        const userId = params.userId;
        const actions = params.actions;
        
        const payload = {};
                
        gameUtility.get( channelId, function( game )
        {
            if ( actions )
            {
                this._respondToActions( game, actions, userId, responseUrl, function( error )
                {
                    if ( error )
                    {
                        cb( error );
                    }
                    else
                    {
                        this._preparePayload( game, userId, payload );
                        
                        //edit the original message with an updated message
                        if ( responseUrl )
                        {
                            this._callResponseUrl( responseUrl, payload, cb );
                        }
                        else
                        {
                            cb( null, payload );
                        }
                    }
                }.bind(this));
            }
            else
            {
                this._preparePayload( game, userId, payload );
                cb( null, payload );
            }
        }.bind(this) );
    },
    
    _callResponseUrl: function( responseUrl, payload, cb )
    {
        //if we set this flag then Slack will replace the original message with this updated one
        payload.replace_original = true;
        utility.httpsPostJson( responseUrl, payload, process.env.SLACK_AUTH, cb );
    },
    
    //TODO - should move all of this into a view of some kind
    _preparePayload: function( game, userId, payload )
    {
        //show buttons related to starting a new game, adding players, etc
        if ( game.phase === config.GamePhase.WaitingForPlayers )
        {
            this._preparePayloadWaitingForPlayers( game, userId, payload );
        }
        else if ( game.phase === config.GamePhase.Night )
        {
            this._preparePayloadNight( game, userId, payload );
        }
    },
    
    _preparePayloadWaitingForPlayers: function( game, userId, payload )
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
        
        //unused roles (add new ones)
        if ( game.unusedRoles.length > 0 )
        {
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
        }
        
        //used roles (remove existing ones)
        if ( game.availableRoles.length > 0 )
        {
            const roleRemoveAction =
            {
                "type": "static_select",
                "placeholder":
                {
                    "type": "plain_text",
                    "text": "Remove a role",
                    "emoji": true
                },
                "options":
                [
                    //dynamically added
                ]
            };
        
            game.availableRoles.forEach( function( role )
            {
                roleRemoveAction.options.push(
                {
                    "text":
                    {
                        "type": "plain_text",
                        "text": `${role.charAt(0).toUpperCase() + role.substring(1)}`,
                        "emoji": true
                    },
                    "value": "removeRole" + role
                });
            });
        
            actionsBlock.elements.push( roleRemoveAction );
        }
        
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
    
    _preparePayloadNight: function( game, userId, payload )
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
    
    _respondToActions: function( game, actions, userId, responseUrl, cb )
    {
        let actionProcessedCount = 0;
        let validActionCount = 0;
        let errorText = "";
        
        const actionCompleteFunc = function( error )
        {
            if ( error )
            {
                errorText += error + " ";
            }
            
            actionProcessedCount++;
            if ( actionProcessedCount >= validActionCount )
            {
                cb( errorText );
            }
        };
        
        actions.forEach( function( action )
        {
            const actionIds = this._findActionIds( action );
            validActionCount += actionIds.length;
            this._respondToAction( game, actionIds, userId, responseUrl, actionCompleteFunc );
            
            // actionIds.forEach( function( actionId )
            // {
            //     this._respondToAction( game, actionId, userId, actionCompleteFunc );
            // }.bind(this));
        }.bind(this));
    },
    
    _respondToAction: function( game, actionIds, userId, responseUrl, cb )
    {
        const actionId = actionIds.length > 0 ? actionIds[0] : null;
                
        if ( !actionId )
        {
            cb( "No action ID provided." );
            return;
        }
        
        if ( actionId.indexOf( "join" ) === 0 )
        {
            const userId = actionId.substring( "join".length );
            game.addPlayer( userId, cb, responseUrl );
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
        else if ( actionId.indexOf( "doppelgangerCopy" ) === 0 )
        {
            const targetId = actionId.substring( "doppelgangerCopy".length );
            game.doppelgangerCopy( userId, targetId, cb );
        }
        else if ( actionId.indexOf( "werewolfRevealMiddle" ) === 0 )
        {
            game.werewolfReveal( userId, cb );
        }
        else if ( actionId.indexOf( "seerRevealMiddle" ) === 0 )
        {
            game.seerReveal( userId, null, cb );
        }
        else if ( actionId.indexOf( "seerRevealTarget" ) === 0 )
        {
            const targetId = actionId.substring( "seerRevealTarget".length );
            game.seerReveal( userId, targetId, cb );
        }
        else if ( actionId.indexOf( "robberSteal" ) === 0 )
        {
            const targetId = actionId.substring( "robberSteal".length );
            game.robberSteal( userId, targetId, cb );
        }
        else if ( actionId.indexOf( "troublemakerSwap" ) === 0 )
        {
            if ( actionIds.length < 2 )
            {
                cb( "Must provide two targets." );
                return;
            }
            
            const targetId0 = actionIds[0].substring( "troublemakerSwap".length );
            const targetId1 = actionIds[1].substring( "troublemakerSwap".length );
            game.troublemakerSwap( userId, targetId0, targetId1, cb );
        }
        else if ( actionId.indexOf( "drunkSwap" ) === 0 )
        {
            const targetId = actionId.substring( "drunkSwap".length );
            game.drunkSwap( userId, targetId, cb );
        }
        else if ( actionId.indexOf( "insomniacInspect" ) === 0 )
        {
            game.insomniacInspect( userId, cb );
        }
        else
        {
            cb( "Invalid action." );
        }
    },
    
    _findActionIds: function( action )
    {
        const actionIds = [];
        
        if ( action.value )
        {
            actionIds.push( action.value );
        }
        else if ( action.selected_option )
        {
            actionIds.push( action.selected_option.value );
        }
        else if ( action.selected_options )
        {
            action.selected_options.forEach( function( optionData )
            {
                actionIds.push( optionData.value );
            });
        }
        
        return actionIds;
    }
}