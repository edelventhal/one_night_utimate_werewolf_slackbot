var GameModel = require( "../../../../server/models/game_model.js" );
var config = require( "../../../../server/config.js" );
var utils = require( "../../../utility/testUtils.js" );
var game;

describe( "GameModel (Finished)", function()
{
    it( "should be able to restart a game without removing existing players", function( cb )
    {
        utils.createTestGame( function( game )
        {
            const playerCount = game.players.length;
            expect(game.phase).toEqual(config.GamePhase.Night);
            
            game.restart( function( error )
            {
                expect(error).toBeFalsy();
                expect(game.players.length).toEqual(playerCount);
                expect(game.phase).toEqual(config.GamePhase.WaitingForPlayers);
            
                cb();
            });
        });
    });
});