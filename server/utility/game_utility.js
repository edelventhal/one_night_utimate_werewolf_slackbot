/*global module*/
/*global console*/
/*global require*/

var GameModel = require( "../models/game_model.js" );

var GameUtility = module.exports =
{
    get: function( gameId, cb )
    {
        new GameModel( gameId, cb );
    }
}