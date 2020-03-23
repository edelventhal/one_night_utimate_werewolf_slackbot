var GameModel = require( "../../../../server/models/game_model.js" );
var config = require( "../../../../server/config.js" );
var utils = require( "../../../utility/testUtils.js" );
var game;
var drunkPlayerId;
var villagerPlayerId;

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
        drunkPlayerId = utils.findPlayerWithRole( game,"drunk");
        game.drunkSwap( drunkPlayerId, function( error )
        {
            expect(error).toEqual("It's not the drunk's turn yet!");
            cb();
        });
    });
});

describe( "Drunk", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            utils.doTroublemakerSwap( game, function()
            {
                drunkPlayerId = utils.findPlayerWithRole( game, "drunk" );
                villagerPlayerId = utils.findPlayerWithRole( game, "villager" );
                cb();
            });
        });
    });
    
    it( "should throw an error when a non-drunk tries to swap a card", function( cb )
    {
        game.drunkSwap( villagerPlayerId, function( error )
        {
            expect(error).toEqual("You're not a drunk!");
            cb();
        });
    });
    
    it( "should throw an error when they try to swap during the day", function( cb )
    {
        game.phase = config.GamePhase.Day;

        game.drunkSwap( drunkPlayerId, function( error )
        {
            expect(error).toEqual("That can only be done at night!");
            cb();
        });
    });
});