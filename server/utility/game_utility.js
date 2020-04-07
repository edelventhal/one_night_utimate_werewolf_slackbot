/*global module*/
/*global console*/
/*global require*/

var utility = require( "./utility.js" );
var GameModel = require( "../models/game_model.js" );

var GameUtility = module.exports =
{
    //for lots of operations on games in the same session, stops a redis hit
    _gamesCache: {},
    
    get: function( gameId, cb )
    {
        if ( this._gamesCache[gameId] )
        {
            cb( this._gamesCache[gameId] );
        }
        else
        {
            new GameModel( gameId, ( game ) =>
            {
                this._gamesCache[gameId] = game;
                cb(game);
            });
        }
    }
}