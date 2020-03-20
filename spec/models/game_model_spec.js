var GameModel = require( "../../server/models/game_model.js" );
var config = require( "../../server/config.js" );
var utils = require( "../utility/testUtils.js" );
var game;

describe( "GameModel (WaitingForPlayers)", function()
{
    beforeEach(function( cb )
    {
        new GameModel( -1, function( setGame )
        {
            game = setGame;
            setGame.reset( cb );
        });
    });

    it( "should be able to add a player", function( cb )
    {
        game.addPlayer( utils.dummyPlayerIds[0], function( error )
        {
            expect(error).toBeFalsy();
            expect(game.players.length).toEqual(1);
            expect(game.players[0]).toEqual(utils.dummyPlayerIds[0]);
            
            cb();
        });
    });
    
    it( "should not be able to add players twice", function( cb )
    {
        game.addPlayer( utils.dummyPlayerIds[0], function( error )
        {
            game.addPlayer( utils.dummyPlayerIds[0], function( error2 )
            {
                expect(error2).toEqual( "That player is already in the game." );
                cb();
            });
        });
    });
    
    it( "should be able to remove a player", function( cb )
    {
        game.addPlayer( utils.dummyPlayerIds[0], function( error )
        {
            game.removePlayer( utils.dummyPlayerIds[0], function( error2 )
            {
                expect(error2).toBeFalsy();
                expect(game.players.length).toEqual(0);
                cb();
            });
        });
    });
    
    it( "should be able to add a role", function( cb )
    {
        const unusedRoleCount = game.unusedRoles.length;
        
        game.addRole( utils.dummyRoles[0], function( error )
        {
            expect(error).toBeFalsy();
            expect(game.availableRoles.length).toEqual(1);
            expect(game.availableRoles[0]).toEqual(utils.dummyRoles[0]);
            expect(game.unusedRoles.length).toEqual(unusedRoleCount - 1);
            cb();
        });
    });
    
    it( "should be able to remove a role", function( cb )
    {
        const unusedRoleCount = game.unusedRoles.length;
        
        game.addRole( utils.dummyRoles[0], function( error )
        {
            game.removeRole( utils.dummyRoles[0], function( error2 )
            {
                expect(error2).toBeFalsy();
                expect(game.availableRoles.length).toEqual(0);
                expect(game.unusedRoles.length).toEqual(unusedRoleCount);
                cb();
            });
        });
    });
    
    it( "should fill up all unused roles", function( cb )
    {
        expect(game.unusedRoles.length).toEqual(16);
        expect(game.unusedRoles[0]).toEqual("doppelganger");
        expect(game.unusedRoles[1]).toEqual("werewolf");
        expect(game.unusedRoles[2]).toEqual("werewolf");
        expect(game.unusedRoles[3]).toEqual("minion");
        expect(game.unusedRoles[4]).toEqual("mason");
        expect(game.unusedRoles[5]).toEqual("mason");
        expect(game.unusedRoles[6]).toEqual("seer");
        expect(game.unusedRoles[7]).toEqual("robber");
        expect(game.unusedRoles[8]).toEqual("troublemaker");
        expect(game.unusedRoles[9]).toEqual("drunk");
        expect(game.unusedRoles[10]).toEqual("insomniac");
        expect(game.unusedRoles[11]).toEqual("villager");
        expect(game.unusedRoles[12]).toEqual("villager");
        expect(game.unusedRoles[13]).toEqual("villager");
        expect(game.unusedRoles[14]).toEqual("tanner");
        expect(game.unusedRoles[15]).toEqual("hunter");
        cb();
    });
    
    it( "should be able to fill missing roles randomly", function( cb )
    {
        const targetPlayerCount = 8;
        utils.addMultiplePlayers( game, targetPlayerCount, function()
        {
            game._fillRolesRandomly( targetPlayerCount );
            expect(game.availableRoles.length).toEqual(targetPlayerCount + 3);
            cb();
        });
    });
    
    it( "should be able to start a game", function( cb )
    {
        const targetPlayerCount = 8;
        const targetRoleCount = targetPlayerCount + 3;
        
        utils.addMultiplePlayers( game, targetPlayerCount, function()
        {
            utils.addMultipleRoles( game, targetRoleCount, function()
            {
                expect(game.phase).toEqual(config.GamePhase.WaitingForPlayers);
    
                game.startGame( function( error )
                {
                    expect(error).toBeFalsy();
                    expect(game.phase).toEqual(config.GamePhase.Night);
        
                    cb();
                });
            });
        });
    });
    
    it( "should automatically fill default roles", function( cb )
    {
        const targetPlayerCount = 5;
        const expectedRoles =
        [
            "werewolf",
            "werewolf",
            "seer",
            "robber",
            "troublemaker",
            "villager",
            "villager",
            "villager"
        ];
        
        utils.addMultiplePlayers( game, targetPlayerCount, function()
        {
            game.startGame( function( error )
            {
                expect(error).toBeFalsy();
                expect(game.availableRoles.length).toEqual(3);
                
                for ( let playerIndex = 0; playerIndex < targetPlayerCount; playerIndex++ )
                {
                    const role = game.roles[utils.dummyPlayerIds[playerIndex]];
                    const index = expectedRoles.indexOf( role );
                    expect(index).toBeGreaterThanOrEqual(0);
                    expectedRoles.splice(index, 1);
                }
                
                //exactly 3 should be left over
                expect(expectedRoles.length).toEqual(3);
                
                //and they should exactly match the roles in availableRoles
                for ( let roleIndex = 0; roleIndex < game.availableRoles.length; roleIndex++ )
                {
                    const role = game.availableRoles[roleIndex];
                    const index = expectedRoles.indexOf( role );
                    expect(index).toBeGreaterThanOrEqual(0);
                    expectedRoles.splice(index, 1);
                }
                
                //now exactly 0 should be left over
                expect(expectedRoles.length).toEqual(0);
            });
        });
        
        cb();
    });
    
    it( "should automatically fill missing roles if necessary", function( cb )
    {
        const targetPlayerCount = 10;
        utils.addMultiplePlayers( game, targetPlayerCount, function()
        {
            game.startGame( function( error )
            {
                expect(error).toBeFalsy();
                
                //should be exactly 3 roles left over
                expect(game.availableRoles.length).toEqual(3);
                
                //every player should have a role
                for ( let playerIndex = 0; playerIndex < targetPlayerCount; playerIndex++ )
                {
                    expect(game.roles[utils.dummyPlayerIds[playerIndex]]).toBeTruthy();
                }
            });
        });
        
        cb();
    });
});

describe( "GameModel (Night)", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            cb();
        });
    });
    
    it( "should be able to swap to a villager as the doppelganger", function( cb )
    {
        utils.doDoppelgangerCopy( game, "villager", function( doppelgangerPlayerId, error, newRole )
        {
            expect(error).toBeFalsy();
            expect(newRole).toEqual("villager");
            expect(game.roleData.doppelganger).toEqual("villager");
            cb();
        });
    });
    
    it( "should be able to reveal the villager's card as the seer", function( cb )
    {
        utils.doSeerReveal( game, "villager", function( error, revealedRoles )
        {
            expect(error).toBeFalsy();
            expect(revealedRoles.length).toEqual(1);
            expect(revealedRoles[0]).toEqual("villager");
            cb();
        });
    });
    
    it( "should be able to reveal 2 unassigned cards as the seer", function( cb )
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
    
    it( "should be able to steal the villager as the robber", function( cb )
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
    
    it( "should be able to swap the werewolf's and seer's cards as the troublemaker", function( cb )
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
    
    it( "should be able to take a random card from the center as the drunk", function( cb )
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
    
    it( "should be able to view its own card as the insomniac", function( cb )
    {
        utils.doInsomniacInspect( game, function( insomniacPlayerId, error, revealedRole )
        {
            expect(error).toBeFalsy();
            expect(game.roles[insomniacPlayerId]).toEqual("insomniac");
            expect(revealedRole).toEqual("insomniac");
            cb();
        });
    });
    
    it( "should be able to reveal the villager's card as the doppelganger-seer", function( cb )
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

    it( "should be able to reveal 2 unassigned cards as the doppelganger-seer", function( cb )
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

    it( "should be able to steal the villager as the doppelganger-robber", function( cb )
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

    it( "should be able to swap the werewolf's and seer's cards as the doppelganger-troublemaker", function( cb )
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

    it( "should be able to take a random card from the center as the doppelganger-drunk", function( cb )
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
    
    it( "should be able to view its own card as the doppelganger-insomniac", function( cb )
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
    
    it( "should throw an error when a non-seer tries to reveal cards", function( cb )
    {
        utils.doDoppelgangerCopy( game, "villager", function()
        {
            const drunkPlayerId = utils.findPlayerWithRole( game,"drunk");
            game.seerReveal( drunkPlayerId, null, function( error )
            {
                expect(error).toEqual("You're not a seer!");
                cb();
            });
        });
    });
    
    it( "should throw an error when a seer tries to reveal themselves", function( cb )
    {
        utils.doDoppelgangerCopy( game, "villager", function()
        {
            const seerPlayerId = utils.findPlayerWithRole( game,"seer");
            game.seerReveal( seerPlayerId, seerPlayerId, function( error )
            {
                expect(error).toEqual("You can't target yourself!");
                cb();
            });
        });
    });
    
    it( "should throw an error when a seer tries to reveal during the day", function( cb )
    {
        utils.doDoppelgangerCopy( game, "villager", function()
        {
            game.phase = config.GamePhase.Day;
        
            const seerPlayerId = utils.findPlayerWithRole( game,"seer");
            game.seerReveal( seerPlayerId, null, function( error )
            {
                expect(error).toEqual("That can only be done at night!");
                cb();
            });
        });
    });
    
    it( "should throw an error when a seer doesn't go in order", function( cb )
    {
        const seerPlayerId = utils.findPlayerWithRole( game,"seer");
        game.seerReveal( seerPlayerId, null, function( error )
        {
            expect(error).toEqual("It's not the seer's turn yet!");
            cb();
        });
    });
    
    it( "should throw an error when a seer targets a non-existent player", function( cb )
    {
        utils.doDoppelgangerCopy( game, "villager", function()
        {
            const seerPlayerId = utils.findPlayerWithRole( game,"seer");
            game.seerReveal( seerPlayerId, "fakePlayerId", function( error )
            {
                expect(error).toEqual("That player is not in the game!");
                cb();
            });
        });
    });
    
    it( "should throw an error when the drunk doesn't go in order", function( cb )
    {
        const drunkPlayerId = utils.findPlayerWithRole( game,"drunk");
        game.drunkSwap( drunkPlayerId, function( error )
        {
            expect(error).toEqual("It's not the drunk's turn yet!");
            cb();
        });
    });
});

//NEXT - keep moving stuff from the general Night thing above to individual describes per role
//also probably move all of these into different files

describe( "GameModel (Night Doppelganger)", function()
{
    beforeEach(function( cb )
    {
        utils.createTestGame( function( setGame )
        {
            game = setGame;
            cb();
        });
    });
    
    it( "should be able to swap to a villager as the doppelganger", function( cb )
    {
        utils.doDoppelgangerCopy( game, "villager", function( doppelgangerPlayerId, error, newRole )
        {
            expect(error).toBeFalsy();
            expect(newRole).toEqual("villager");
            expect(game.roleData.doppelganger).toEqual("villager");
            cb();
        });
    });
    
    it( "should be able to reveal the villager's card as the doppelganger-seer", function( cb )
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

    it( "should be able to reveal 2 unassigned cards as the doppelganger-seer", function( cb )
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

    it( "should be able to steal the villager as the doppelganger-robber", function( cb )
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

    it( "should be able to swap the werewolf's and seer's cards as the doppelganger-troublemaker", function( cb )
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

    it( "should be able to take a random card from the center as the doppelganger-drunk", function( cb )
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
    
    it( "should be able to view its own card as the doppelganger-insomniac", function( cb )
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



//NEXT NEXT - add tests for all the error checking, like when you try to go not on your turn
//NEXT NEXT NEXT - put in the controller and all the slack interactions, put the slack stuff
//behind an abstraction so it could easily be changed for discord etc