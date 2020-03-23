var GameModel = require( "../../../../server/models/game_model.js" );
var config = require( "../../../../server/config.js" );
var utils = require( "../../../utility/testUtils.js" );
var game;

describe( "Robber", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            cb();
        });
    });
    
    it( "should be able to steal the villager", function( cb )
    {
        
        utils.doRobberSteal( game, function( robberPlayerId, targetPlayerId, error, stolenRole )
        {
            expect(error).toBeFalsy();
            expect(stolenRole).toEqual("villager");
            expect(game.roles[robberPlayerId]).toEqual("villager");
            expect(game.roles[targetPlayerId]).toEqual("robber");
            expect(game.initialRoles[robberPlayerId]).toEqual("robber");
            expect(game.initialRoles[targetPlayerId]).toEqual("villager");
            cb();
        });
    });
});