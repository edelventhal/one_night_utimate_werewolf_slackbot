var GameModel = require( "../../../../server/models/game_model.js" );
var config = require( "../../../../server/config.js" );
var utils = require( "../../../utility/testUtils.js" );
var game;
var robberPlayerId;

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
    
    it( "should throw an error when they don't go in order", function( cb )
    {
        const robberPlayerId = utils.findPlayerWithRole( game, "robber" );
        const villagerPlayerId = utils.findPlayerWithRole( game, "villager" );
        game.robberSteal( robberPlayerId, villagerPlayerId, function( error )
        {
            expect(error).toEqual("It's not the robber's turn yet!");
            cb();
        });
    });
});

describe( "Robber", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            utils.doSeerReveal( game, "villager", function()
            {
                robberPlayerId = utils.findPlayerWithRole( game, "robber" );
                cb();
            });
        });
    });
    
    it( "should throw an error when a non-robber tries to steal a card", function( cb )
    {
        const villagerPlayerId = utils.findPlayerWithRole( game, "villager" );
        game.robberSteal( villagerPlayerId, null, function( error )
        {
            expect(error).toEqual("You're not a robber!");
            cb();
        });
    });
    
    it( "should throw an error when they try to steal during the day", function( cb )
    {
        game.phase = config.GamePhase.Day;
        const villagerPlayerId = utils.findPlayerWithRole( game, "villager" );
    
        game.robberSteal( robberPlayerId, villagerPlayerId, function( error )
        {
            expect(error).toEqual("That can only be done at night!");
            cb();
        });
    });
    
    it( "should throw an error when they try to steal from themselves", function( cb )
    {
        game.robberSteal( robberPlayerId, robberPlayerId, function( error )
        {
            expect(error).toEqual("You can't target yourself!");
            cb();
        });
    });
    
    it( "should throw an error when they target a non-existent player", function( cb )
    {
        game.robberSteal( robberPlayerId, "fakePlayerId", function( error )
        {
            expect(error).toEqual("That player is not in the game!");
            cb();
        });
    });
});