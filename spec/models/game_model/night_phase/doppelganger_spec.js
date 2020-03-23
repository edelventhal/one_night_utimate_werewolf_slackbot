var GameModel = require( "../../../../server/models/game_model.js" );
var config = require( "../../../../server/config.js" );
var utils = require( "../../../utility/testUtils.js" );
var game;

describe( "Doppelganger", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            cb();
        });
    });
    
    it( "should be able to swap to a villager", function( cb )
    {
        utils.doDoppelgangerCopy( game, "villager", function( doppelgangerPlayerId, error, newRole )
        {
            expect(error).toBeFalsy();
            expect(newRole).toEqual("villager");
            expect(game.roleData.doppelganger).toEqual("villager");
            cb();
        });
    });
    
    it( "should be able to reveal the villager's card as a seer", function( cb )
    {
        utils.doDoppelgangerCopy( game, "seer", function( doppelgangerPlayerId, error, newRole )
        {
            expect(game.roleData.doppelganger).toEqual("seer");
            const villagerPlayerId = utils.findPlayerWithRole( game,"villager");

            game.seerReveal( doppelgangerPlayerId, villagerPlayerId, function( error, revealedRoles )
            {
                expect(error).toBeFalsy();
                expect(revealedRoles.length).toEqual(1);
                expect(revealedRoles[0]).toEqual("villager");
                cb();
            });
        });
    });

    it( "should be able to reveal 2 unassigned cards as a seer", function( cb )
    {
        utils.doDoppelgangerCopy( game, "seer", function( doppelgangerPlayerId, error, newRole )
        {
            expect(game.roleData.doppelganger).toEqual("seer");

            game.seerReveal( doppelgangerPlayerId, null, function( error, revealedRoles )
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
    });

    it( "should be able to steal the villager as a robber", function( cb )
    {
        utils.doDoppelgangerCopy( game, "robber", function( doppelgangerPlayerId, error, newRole )
        {
            expect(game.roleData.doppelganger).toEqual("robber");
            const villagerPlayerId = utils.findPlayerWithRole( game,"villager");

            game.robberSteal( doppelgangerPlayerId, villagerPlayerId, function( error, stolenRole )
            {
                expect(error).toBeFalsy();
                expect(stolenRole).toEqual("villager");
                expect(game.roles[doppelgangerPlayerId]).toEqual("villager");
                expect(game.roles[villagerPlayerId]).toEqual("doppelganger");
                expect(game.initialRoles[doppelgangerPlayerId]).toEqual("doppelganger");
                expect(game.initialRoles[villagerPlayerId]).toEqual("villager");
                cb();
            });
        });
    });

    it( "should be able to swap the werewolf's and seer's cards as a troublemaker", function( cb )
    {
        utils.doDoppelgangerCopy( game, "troublemaker", function( doppelgangerPlayerId, error, newRole )
        {
            expect(game.roleData.doppelganger).toEqual("troublemaker");
            const targetPlayerId0 = utils.findPlayerWithRole( game,"seer");
            const targetPlayerId1 = utils.findPlayerWithRole( game,"werewolf");

            game.troublemakerSwap( doppelgangerPlayerId, targetPlayerId0, targetPlayerId1, function( error )
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

    it( "should be able to take a random card from the center as a drunk", function( cb )
    {
        utils.doDoppelgangerCopy( game, "drunk", function( doppelgangerPlayerId, error, newRole )
        {
            expect(game.roleData.doppelganger).toEqual("drunk");
            const availableRolesBefore = JSON.parse( JSON.stringify( game.availableRoles ) );

            game.drunkSwap( doppelgangerPlayerId, function( error )
            {
                expect(error).toBeFalsy();
                expect(game.roles[doppelgangerPlayerId]).not.toEqual("doppelganger");
                expect(game.initialRoles[doppelgangerPlayerId]).toEqual("doppelganger");
                expect(availableRolesBefore.indexOf(game.roles[doppelgangerPlayerId])).toBeGreaterThanOrEqual(0);
                expect(game.availableRoles.indexOf("doppelganger")).toBeGreaterThanOrEqual(0);
                cb();
            });
        });
    });
    
    it( "should be able to view its own card as an insomniac", function( cb )
    {
        utils.doDoppelgangerCopy( game, "insomniac", function( doppelgangerPlayerId, error, newRole )
        {
            expect(game.roleData.doppelganger).toEqual("insomniac");
            
            //let the regular insomniac go - need to wait for the doppelganger's turn
            utils.doInsomniacInspect( game, function()
            {
                expect(game.roleData.doppelganger).toEqual("insomniac");
                
                //no we can do the insomniac's action as the doppelganger
                game.insomniacInspect( doppelgangerPlayerId, function( error, revealedRole )
                {
                    expect(error).toBeFalsy();
                    expect(game.roles[doppelgangerPlayerId]).toEqual("doppelganger");
                    expect(revealedRole).toEqual("doppelganger");
                    cb();
                });
            }, true );
        });
    });
});