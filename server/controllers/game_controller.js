/*global module*/
/*global require*/

var database = require( "../database.js" );
var utility = require( "../utility/utility.js" );
var gameUtility = require( "../utility/game_utility.js" );
var config = require( "../config.js" );
var GameModel = require("../models/game_model.js");

var GameController = module.exports =
{
    create: function( request, response )
    {
        if ( !request.query.gameId )
        {
            response.status(500).json( { success: false, error: "gameId is a required parameter." } );
        }
        else
        {
            //TODO - this is weak - the GameModel should do all this with a factory function or something
            gameUtility.get( request.query.gameId, function( game, wasNewGame )
            {
                //if this is a brand new game, carry on, we're ready to go
                if ( wasNewGame )
                {
                    response.status(200).json( { success: true } );
                }
                //otherwise, we may want to give an error since this game already 
                else
                {
                    //if the old game is finished, we can just reset it
                    if ( game.phase === config.GamePhase.Finished )
                    {
                        game.reset( function( resetError )
                        {
                            if ( error )
                            {
                                response.status(500).json( { success: false, error: "Failed to reset the existing finished game! " + resetError } );
                            }
                            else
                            {
                                response.status(200).json( { success: true } );
                            }
                        });
                    }
                    //if it's a game in progress, give an error
                    else
                    {
                        response.status(500).json( { success: false, error: "You already have a game in progress. Use the delete command to remove it." } );
                    }
                }
            });
        }
    },
    
    delete: function( request, response )
    {
        if ( !request.query.gameId )
        {
            response.status(500).json( { success: false, error: "gameId is a required parameter." } );
        }
        else
        {
            gameUtility.get( request.query.gameId, function( game )
            {
                game.remove( function( removeError )
                {
                    if ( error )
                    {
                        response.status(500).json( { success: false, error: "Failed to delete the game! " + removeError } );
                    }
                    else
                    {
                        response.status(200).json( { success: true } );
                    }
                });
            });
        }
    },
    
    join: function( request, response )
    {
        if ( !request.query.joiningPlayerId )
        {
            response.status(500).json( { success: false, error: "joiningPlayerId is a required parameter." } );
        }
        else if ( !request.query.gameId )
        {
            response.status(500).json( { success: false, error: "gameId is a required parameter." } );
        }
        else
        {
            gameUtility.get( request.query.gameId, function( game )
            {
                game.addPlayer( request.query.joiningPlayerId, function( error )
                {
                    if ( error )
                    {
                        response.status(500).json( { success: false, error: "Failed to join game! " + error } );
                    }
                    else
                    {
                        response.status(200).json( { success: true } );
                    }
                });
            });
        }
    },
    
    drop: function( request, response )
    {
        if ( !request.query.droppingPlayerId )
        {
            response.status(500).json( { success: false, error: "droppingPlayerId is a required parameter." } );
        }
        else if ( !request.query.gameId )
        {
            response.status(500).json( { success: false, error: "gameId is a required parameter." } );
        }
        else
        {
            gameUtility.get( request.query.gameId, function( game )
            {
                game.removePlayer( request.query.droppingPlayerId, function( error )
                {
                    if ( error )
                    {
                        response.status(500).json( { success: false, error: "Failed to drop player! " + error } );
                    }
                    else
                    {
                        response.status(200).json( { success: true } );
                    }
                });
            });
        }
    },
    
    start: function( request, response )
    {
        if ( !request.query.gameId )
        {
            response.status(500).json( { success: false, error: "gameId is a required parameter." } );
        }
        else
        {
            gameUtility.get( request.query.gameId, function( game )
            {
                game.startGame( function( error )
                {
                    if ( error )
                    {
                        response.status(500).json( { success: false, error: "Failed to start game! " + error } );
                    }
                    else
                    {
                        response.status(200).json( { success: true } );
                    }
                });
            });
        }
    },
    
    restart: function( request, response )
    {
        if ( !request.query.gameId )
        {
            response.status(500).json( { success: false, error: "gameId is a required parameter." } );
        }
        else
        {
            gameUtility.get( request.query.gameId, function( game )
            {
                game.restart( function( error )
                {
                    if ( error )
                    {
                        response.status(500).json( { success: false, error: "Failed to restart game! " + error } );
                    }
                    else
                    {
                        response.status(200).json( { success: true } );
                    }
                });
            });
        }
    },
    
    addRole: function( request, response )
    {
        if ( !request.query.role )
        {
            response.status(500).json( { success: false, error: "role is a required parameter." } );
        }
        else if ( !request.query.gameId )
        {
            response.status(500).json( { success: false, error: "gameId is a required parameter." } );
        }
        else
        {
            gameUtility.get( request.query.gameId, function( game )
            {
                game.addRole( request.query.role, function( error )
                {
                    if ( error )
                    {
                        response.status(500).json( { success: false, error: "Failed to add role! " + error } );
                    }
                    else
                    {
                        response.status(200).json( { success: true } );
                    }
                });
            });
        }
    },
    
    removeRole: function( request, response )
    {
        if ( !request.query.role )
        {
            response.status(500).json( { success: false, error: "role is a required parameter." } );
        }
        else if ( !request.query.gameId )
        {
            response.status(500).json( { success: false, error: "gameId is a required parameter." } );
        }
        else
        {
            gameUtility.get( request.query.gameId, function( game )
            {
                game.removeRole( request.query.role, function( error )
                {
                    if ( error )
                    {
                        response.status(500).json( { success: false, error: "Failed to remove role! " + error } );
                    }
                    else
                    {
                        response.status(200).json( { success: true } );
                    }
                });
            });
        }
    },
    
    getData: function( request, response )
    {
        if ( !request.query.gameId )
        {
            response.status(500).json( { success: false, error: "gameId is a required parameter." } );
        }
        else
        {
            gameUtility.get( request.query.gameId, function( game )
            {
                response.status(200).json( game );
            });
        }
    },
    
    //for debugging
    nextTurn: function( request, response )
    {
        if ( !request.query.gameId )
        {
            response.status(500).json( { success: false, error: "gameId is a required parameter." } );
        }
        else
        {
            gameUtility.get( request.query.gameId, function( game )
            {
                game.goToNextNightPhase( function( error )
                {
                    if ( error )
                    {
                        response.status(500).json( { success: false, error: "Failed to go to next night phase! " + error } );
                    }
                    else
                    {
                        response.status(200).json( { success: true } );
                    }
                });
            });
        }
    }
};