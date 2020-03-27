/*global module*/
/*global require*/

var database = require( "../database.js" );
var utility = require( "../utility/utility.js" );
var config = require( "../config.js" );
var GameModel = require("../models/game_model.js");

var GameController = module.exports =
{
    create: function( request, response )
    {
        if ( !request.query.creatorId )
        {
            response.status(500).json( { success: false, error: "creatorId is a required parameter." } );
        }
        else
        {
            //TODO - this is weak - the GameModel should do all this with a factory function or something
            new GameModel( request.query.creatorId, function( game, wasNewGame )
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
        if ( !request.query.creatorId )
        {
            response.status(500).json( { success: false, error: "creatorId is a required parameter." } );
        }
        else
        {
            new GameModel( request.query.creatorId, function( game )
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
        else if ( !request.query.creatorId )
        {
            response.status(500).json( { success: false, error: "creatorId is a required parameter." } );
        }
        else
        {
            new GameModel( request.query.creatorId, function( game )
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
        else if ( !request.query.creatorId )
        {
            response.status(500).json( { success: false, error: "creatorId is a required parameter." } );
        }
        else
        {
            new GameModel( request.query.creatorId, function( game )
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
        if ( !request.query.creatorId )
        {
            response.status(500).json( { success: false, error: "creatorId is a required parameter." } );
        }
        else
        {
            new GameModel( request.query.creatorId, function( game )
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
        if ( !request.query.creatorId )
        {
            response.status(500).json( { success: false, error: "creatorId is a required parameter." } );
        }
        else
        {
            new GameModel( request.query.creatorId, function( game )
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
        else if ( !request.query.creatorId )
        {
            response.status(500).json( { success: false, error: "creatorId is a required parameter." } );
        }
        else
        {
            new GameModel( request.query.creatorId, function( game )
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
        else if ( !request.query.creatorId )
        {
            response.status(500).json( { success: false, error: "creatorId is a required parameter." } );
        }
        else
        {
            new GameModel( request.query.creatorId, function( game )
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
};