var GameModel = require( "../../../../server/models/game_model.js" );
var config = require( "../../../../server/config.js" );
var utils = require( "../../../utility/testUtils.js" );
var game;
var seerPlayerId;

describe( "Seer", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            cb();
        });
    });
    
    it( "should be able to reveal the villager's card", function( cb )
    {
        utils.doSeerReveal( game, "villager", function( error, revealedRoles )
        {
            expect(error).toBeFalsy();
            expect(revealedRoles.length).toEqual(1);
            expect(revealedRoles[0]).toEqual("villager");
            cb();
        });
    });
    
    it( "should be able to reveal 2 unassigned cards", function( cb )
    {
        utils.doSeerReveal( game, null, function( error, revealedRoles )
        {
            expect(error).toBeFalsy();
            expect(revealedRoles.length).toEqual(2);
            expect(game.availableRoles.indexOf(revealedRoles[0])).toBeGreaterThanOrEqual(0);
            expect(game.availableRoles.indexOf(revealedRoles[1])).toBeGreaterThanOrEqual(0);
            //this is a bad test - it's possible to have 2 villagers, werewolves, or masons
            //expect(revealedRoles[0]).not.toEqual(revealedRoles[1]);
            cb();
        });
    });
    
    it( "should throw an error when they don't go in order", function( cb )
    {
        const seerPlayerId = utils.findPlayerWithRole( game,"seer");
        game.seerReveal( seerPlayerId, null, function( error )
        {
            expect(error).toEqual("It's not the seer's turn yet!");
            cb();
        });
    });
});

describe( "Seer", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            utils.doDoppelgangerCopy( game, "villager", function()
            {
                seerPlayerId = utils.findPlayerWithRole( game, "seer" );
                cb();
            });
        });
    });
    
    it( "should throw an error when a non-seer tries to reveal cards", function( cb )
    {
        const drunkPlayerId = utils.findPlayerWithRole( game, "drunk" );
        game.seerReveal( drunkPlayerId, null, function( error )
        {
            expect(error).toEqual("You're not a seer!");
            cb();
        });
    });
    
    it( "should throw an error when they try to reveal during the day", function( cb )
    {
        game.phase = config.GamePhase.Day;
    
        game.seerReveal( seerPlayerId, null, function( error )
        {
            expect(error).toEqual("That can only be done at night!");
            cb();
        });
    });
    
    it( "should throw an error when they try to reveal themselves", function( cb )
    {
        game.seerReveal( seerPlayerId, seerPlayerId, function( error )
        {
            expect(error).toEqual("You can't target yourself!");
            cb();
        });
    });
    
    it( "should throw an error when they target a non-existent player", function( cb )
    {
        game.seerReveal( seerPlayerId, "fakePlayerId", function( error )
        {
            expect(error).toEqual("That player is not in the game!");
            cb();
        });
    });
});