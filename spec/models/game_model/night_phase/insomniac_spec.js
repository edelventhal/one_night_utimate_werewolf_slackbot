var GameModel = require( "../../../../server/models/game_model.js" );
var config = require( "../../../../server/config.js" );
var utils = require( "../../../utility/testUtils.js" );
var game;
var insomniacPlayerId;
var villagerPlayerId;

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
    
    it( "should throw an error when going out of order", function( cb )
    {
        insomniacPlayerId = utils.findPlayerWithRole( game,"insomniac");
        game.insomniacInspect( insomniacPlayerId, function( error )
        {
            expect(error).toEqual("It's not the insomniac's turn yet!");
            cb();
        });
    });
});

describe( "Insomniac", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            utils.doDrunkSwap( game, function()
            {
                insomniacPlayerId = utils.findPlayerWithRole( game, "insomniac" );
                villagerPlayerId = utils.findPlayerWithRole( game, "villager" );
                cb();
            });
        });
    });
    
    it( "should throw an error when a non-insomniac tries to inspect their role", function( cb )
    {
        game.insomniacInspect( villagerPlayerId, function( error )
        {
            expect(error).toEqual("You're not an insomniac!");
            cb();
        });
    });
    
    it( "should throw an error when they try to inspect during the day", function( cb )
    {
        game.phase = config.GamePhase.Day;

        game.insomniacInspect( insomniacPlayerId, function( error )
        {
            expect(error).toEqual("That can only be done at night!");
            cb();
        });
    });
});