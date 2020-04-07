/*global module*/
/*global console*/
/*global require*/

var GameModel = require( "../models/game_model.js" );

var GameUtility = module.exports =
{
    get: function( gameId, cb, updateCb )
    {
        new GameModel( gameId, function( game )
        {
            if ( updateCb )
            {
                game.setUpdateCb( updateCb, function( error )
                {
                    cb( game );
                });
            }
            else
            {
                cb( game );
            }
        });
    }
}