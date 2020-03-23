var GameModel = require( "../../../../server/models/game_model.js" );
var config = require( "../../../../server/config.js" );
var utils = require( "../../../utility/testUtils.js" );
var game;

describe( "Insomniac", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            cb();
        });
    });
    
    it( "should be able to view its own card", function( cb )
    {
        utils.doInsomniacInspect( game, function( insomniacPlayerId, error, revealedRole )
        {
            expect(error).toBeFalsy();
            expect(game.roles[insomniacPlayerId]).toEqual("insomniac");
            expect(revealedRole).toEqual("insomniac");
            cb();
        });
    });
});