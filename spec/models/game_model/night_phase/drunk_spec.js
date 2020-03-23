var GameModel = require( "../../../../server/models/game_model.js" );
var config = require( "../../../../server/config.js" );
var utils = require( "../../../utility/testUtils.js" );
var game;

describe( "Drunk", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            cb();
        });
    });
    
    it( "should be able to take a random card from the center", function( cb )
    {
        utils.doDrunkSwap( game, function( drunkPlayerId, availableRolesBefore, error )
        {
            expect(error).toBeFalsy();
            expect(game.roles[drunkPlayerId]).not.toEqual("drunk");
            expect(game.initialRoles[drunkPlayerId]).toEqual("drunk");
            expect(availableRolesBefore.indexOf(game.roles[drunkPlayerId])).toBeGreaterThanOrEqual(0);
            expect(game.availableRoles.indexOf("drunk")).toBeGreaterThanOrEqual(0);
            cb();
        });
    });
    
    it( "should throw an error when going out of order", function( cb )
    {
        const drunkPlayerId = utils.findPlayerWithRole( game,"drunk");
        game.drunkSwap( drunkPlayerId, function( error )
        {
            expect(error).toEqual("It's not the drunk's turn yet!");
            cb();
        });
    });
});