var GameModel = require( "../../../../server/models/game_model.js" );
var config = require( "../../../../server/config.js" );
var utils = require( "../../../utility/testUtils.js" );
var game;


describe( "Troublemaker", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            cb();
        });
    });
    
    it( "should be able to swap the werewolf's and seer's cards", function( cb )
    {
        utils.doTroublemakerSwap( game, function( targetPlayerId0, targetPlayerId1, error )
        {
            expect(error).toBeFalsy();
            expect(game.roles[targetPlayerId0]).toEqual("werewolf");
            expect(game.roles[targetPlayerId1]).toEqual("seer");
            expect(game.initialRoles[targetPlayerId0]).toEqual("seer");
            expect(game.initialRoles[targetPlayerId1]).toEqual("werewolf");
            cb();
        });
    });
});