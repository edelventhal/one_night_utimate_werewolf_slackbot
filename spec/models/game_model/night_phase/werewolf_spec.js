var GameModel = require( "../../../../server/models/game_model.js" );
var config = require( "../../../../server/config.js" );
var utils = require( "../../../utility/testUtils.js" );
var game;
var robberPlayerId;

describe( "Werewolf", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            cb();
        });
    });
    
    it( "should be able to view a center card as the werewolf", function( cb )
    {
        utils.doWerewolfReveal( game, function( error, revealedRoles )
        {
            expect(error).toBeFalsy();
            expect(revealedRoles.length).toEqual(1);
            expect(game.availableRoles.indexOf(revealedRoles[0])).toBeGreaterThanOrEqual(0);
            cb();
        });
    });
    
    it( "should throw an error when they don't go in order", function( cb )
    {
        const werewolfPlayerId = utils.findPlayerWithRole( game, "werewolf" );
        game.werewolfReveal( werewolfPlayerId, function( error )
        {
            expect(error).toEqual("It's not the werewolf's turn yet!");
            cb();
        });
    });
    
    it( "should throw an error when there is more than one werewolf", function( cb )
    {
        const werewolfPlayerId = utils.findPlayerWithRole( game, "werewolf" );
        utils.doDoppelgangerCopy( game, "werewolf", function( error )
        {
            game.werewolfReveal( werewolfPlayerId, function( error )
            {
                expect(error).toEqual("A werewolf can only view a center card if they are alone!");
                cb();
            });
        });
    });
});

describe( "Werewolf", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            utils.doDoppelgangerCopy( game, "villager", function()
            {
                cb();
            });
        });
    });
    
    it( "should throw an error when a non-werewolf tries to reveal a card", function( cb )
    {
        const villagerPlayerId = utils.findPlayerWithRole( game, "villager" );
        game.werewolfReveal( villagerPlayerId, function( error )
        {
            expect(error).toEqual("You're not a werewolf!");
            cb();
        });
    });
    
    it( "should throw an error when they try to reveal during the day", function( cb )
    {
        game.phase = config.GamePhase.Day;
        const werewolfPlayerId = utils.findPlayerWithRole( game, "werewolf" );
    
        game.werewolfReveal( werewolfPlayerId, function( error )
        {
            expect(error).toEqual("That can only be done at night!");
            cb();
        });
    });
});