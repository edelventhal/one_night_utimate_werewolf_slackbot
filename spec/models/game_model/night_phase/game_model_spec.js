var GameModel = require( "../../../../server/models/game_model.js" );
var config = require( "../../../../server/config.js" );
var utils = require( "../../../utility/testUtils.js" );
var game;

describe( "GameModel (Night)", function()
{
    it( "should go to the next phase after all players have gone", function( cb )
    {
        utils.createTestGame( function( game )
        {
            utils.doInsomniacInspect( game, function()
            {
                expect(game.phase).toEqual(config.GamePhase.Day);
                cb();
            });
        });
    });
});