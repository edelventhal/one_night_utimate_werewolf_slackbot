var GameModel = require( "../../../../server/models/game_model.js" );
var config = require( "../../../../server/config.js" );
var utils = require( "../../../utility/testUtils.js" );
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

//NEXT NEXT - add tests for all the error checking, like when you try to go not on your turn
//NEXT NEXT NEXT - put in the controller and all the slack interactions, put the slack stuff
//behind an abstraction so it could easily be changed for discord etc