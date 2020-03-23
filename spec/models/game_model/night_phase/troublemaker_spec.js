var GameModel = require( "../../../../server/models/game_model.js" );
var config = require( "../../../../server/config.js" );
var utils = require( "../../../utility/testUtils.js" );
var game;
var troublemakerPlayerId;
var villagerPlayerId;
var seerPlayerId;

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
    
    it( "should throw an error when they don't go in order", function( cb )
    {
        troublemakerPlayerId = utils.findPlayerWithRole( game, "troublemaker" );
        villagerPlayerId = utils.findPlayerWithRole( game, "villager" );
        seerPlayerId = utils.findPlayerWithRole( game, "seer" );
        game.troublemakerSwap( troublemakerPlayerId, villagerPlayerId, seerPlayerId, function( error )
        {
            expect(error).toEqual("It's not the troublemaker's turn yet!");
            cb();
        });
    });
});

describe( "Troublemaker", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            utils.doRobberSteal( game, function()
            {
                troublemakerPlayerId = utils.findPlayerWithRole( game, "troublemaker" );
                villagerPlayerId = utils.findPlayerWithRole( game, "villager" );
                seerPlayerId = utils.findPlayerWithRole( game, "seer" );
                cb();
            });
        });
    });
    
    it( "should throw an error when a non-robber tries to steal a card", function( cb )
    {
        game.troublemakerSwap( villagerPlayerId, seerPlayerId, troublemakerPlayerId, function( error )
        {
            expect(error).toEqual("You're not a troublemaker!");
            cb();
        });
    });
    
    it( "should throw an error when they try to swap during the day", function( cb )
    {
        game.phase = config.GamePhase.Day;

        game.troublemakerSwap( troublemakerPlayerId, villagerPlayerId, seerPlayerId, function( error )
        {
            expect(error).toEqual("That can only be done at night!");
            cb();
        });
    });
    
    it( "should throw an error when they try to swap themselves in slot 0", function( cb )
    {
        game.troublemakerSwap( troublemakerPlayerId, troublemakerPlayerId, seerPlayerId, function( error )
        {
            expect(error).toEqual("You can't target yourself!");
            cb();
        });
    });
    
    it( "should throw an error when they try to swap themselves in slot 1", function( cb )
    {
        game.troublemakerSwap( troublemakerPlayerId, seerPlayerId, troublemakerPlayerId, function( error )
        {
            expect(error).toEqual("You can't target yourself!");
            cb();
        });
    });
    
    it( "should throw an error when they target a non-existent player", function( cb )
    {
        game.troublemakerSwap( troublemakerPlayerId, "fakePlayerId",  "otherFakePlayerId", function( error )
        {
            expect(error).toEqual("One of those players is not in the game!");
            cb();
        });
    });
});