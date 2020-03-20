var GameModel = require( "../../server/models/game_model.js" );
var config = require( "../../server/config.js" );
var game;

const dummyPlayerIds =
[
    "#0",
    "#1",
    "#2",
    "#3",
    "#4",
    "#5",
    "#6",
    "#7",
    "#8",
    "#9"
];

const dummyRoles =
[
    "villager",
    "werewolf",
    "seer",
    "troublemaker",
    "doppelganger",
    "robber",
    "werewolf",
    "drunk",
    "minion",
    "mason",
    "mason",
    "villager",
    "villager",
    "tanner",
    "hunter"
];

const addMultiplePlayers = function( game, targetPlayerCount, cb )
{
    let playerAddedCount = 0;
    const playerAddedResultFunc = function( error )
    {
        playerAddedCount++;
        if ( playerAddedCount >= targetPlayerCount )
        {
            cb();
        }
    };
    
    for ( let playerIndex = 0; playerIndex < targetPlayerCount; playerIndex++ )
    {
        game.addPlayer( dummyPlayerIds[playerIndex], playerAddedResultFunc );
    }
};

const addMultipleRoles = function( game, targetRoleCount, cb )
{
    let roleAddedCount = 0;
    const roleAddedResultFunc = function( error )
    {
        roleAddedCount++;
        if ( roleAddedCount >= targetRoleCount )
        {
            cb();
        }
    };

    for ( let roleIndex = 0; roleIndex < targetRoleCount; roleIndex++ )
    {
        game.addRole( dummyRoles[roleIndex], roleAddedResultFunc );
    }
};

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
        game.addPlayer( dummyPlayerIds[0], function( error )
        {
            expect(error).toBeFalsy();
            expect(game.players.length).toEqual(1);
            expect(game.players[0]).toEqual(dummyPlayerIds[0]);
            
            cb();
        });
    });
    
    it( "should not be able to add players twice", function( cb )
    {
        game.addPlayer( dummyPlayerIds[0], function( error )
        {
            game.addPlayer( dummyPlayerIds[0], function( error2 )
            {
                expect(error2).toEqual( "That player is already in the game." );
                cb();
            });
        });
    });
    
    it( "should be able to remove a player", function( cb )
    {
        game.addPlayer( dummyPlayerIds[0], function( error )
        {
            game.removePlayer( dummyPlayerIds[0], function( error2 )
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
        
        game.addRole( dummyRoles[0], function( error )
        {
            expect(error).toBeFalsy();
            expect(game.availableRoles.length).toEqual(1);
            expect(game.availableRoles[0]).toEqual(dummyRoles[0]);
            expect(game.unusedRoles.length).toEqual(unusedRoleCount - 1);
            cb();
        });
    });
    
    it( "should be able to remove a role", function( cb )
    {
        const unusedRoleCount = game.unusedRoles.length;
        
        game.addRole( dummyRoles[0], function( error )
        {
            game.removeRole( dummyRoles[0], function( error2 )
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
        addMultiplePlayers( game, targetPlayerCount, function()
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
        
        addMultiplePlayers( game, targetPlayerCount, function()
        {
            addMultipleRoles( game, targetRoleCount, function()
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
        
        addMultiplePlayers( game, targetPlayerCount, function()
        {
            game.startGame( function( error )
            {
                expect(error).toBeFalsy();
                expect(game.availableRoles.length).toEqual(3);
                
                for ( let playerIndex = 0; playerIndex < targetPlayerCount; playerIndex++ )
                {
                    const role = game.roles[dummyPlayerIds[playerIndex]];
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
        addMultiplePlayers( game, targetPlayerCount, function()
        {
            game.startGame( function( error )
            {
                expect(error).toBeFalsy();
                
                //should be exactly 3 roles left over
                expect(game.availableRoles.length).toEqual(3);
                
                //every player should have a role
                for ( let playerIndex = 0; playerIndex < targetPlayerCount; playerIndex++ )
                {
                    expect(game.roles[dummyPlayerIds[playerIndex]]).toBeTruthy();
                }
            });
        });
        
        cb();
    });
});

describe( "GameModel (Night)", function()
{
    //we force the game to use these specific roles
    const forcedRoles =
    [
        "villager",
        "doppelganger",
        "seer",
        "robber",
        "troublemaker",
        "drunk",
        "insomniac",
        "werewolf"
    ];
    
    //these will be in the available roles after assignment
    const forcedExtraRoles =
    [
        "villager",
        "mason",
        "werewolf"
    ];
    
    const targetPlayerCount = forcedRoles.length;
    const targetRoleCount = targetPlayerCount + 3; //3 is a game design choice
    
    const findPlayerWithRole = function( role )
    {
        let result = null;
        game.players.forEach( ( playerId ) =>
        {
            if ( game.roles[playerId] === role && !result )
            {
                result = playerId;
            }
        });
        
        if ( !result )
        {
            //console.log( "Could not find player with role " + role + " " + JSON.stringify(game.roles));
        }
        return result;
    };
    
    const forceRolesToExist = function( forcedRoles )
    {
        forcedRoles.forEach( (role) =>
        {
            if ( !findPlayerWithRole( role ) )
            {
                const unusedIndex = game.unusedRoles.indexOf( role );
                if ( unusedIndex >= 0 )
                {
                    game.players.forEach( ( playerId ) =>
                    {
                        if ( role && forcedRoles.indexOf( game.roles[playerId] ) < 0 )
                        {
                            game.unusedRoles.splice( unusedIndex, 1, game.roles[playerId] );
                            game.roles[playerId] = role;
                            game.initialRoles[playerId] = role;
                            role = null;
                        }
                    });
                }
                else
                {
                    const availableIndex = game.availableRoles.indexOf( role );
                    if ( availableIndex >= 0 )
                    {
                        game.players.forEach( ( playerId ) =>
                        {
                            if ( role && forcedRoles.indexOf( game.roles[playerId] ) < 0 )
                            {
                                game.availableRoles.splice( availableIndex, 1, game.roles[playerId] );
                                game.roles[playerId] = role;
                                game.initialRoles[playerId] = role;
                                role = null;
                            }
                        });
                    }
                }
            }
        });
    };
    
    //these are cascading role functions – they *must* be called in order
    const doDoppelgangerCopy = function( targetRole, cb )
    {
        const doppelgangerPlayerId = findPlayerWithRole( "doppelganger" );
        const targetPlayerId = findPlayerWithRole( targetRole );
        game.doppelgangerCopy( doppelgangerPlayerId, targetPlayerId, cb.bind( this, doppelgangerPlayerId ) );
    };
    
    const doSeerReveal = function( targetRole, cb )
    {
        doDoppelgangerCopy( "villager", function()
        {
            const seerPlayerId = findPlayerWithRole( "seer" );
            const targetPlayerId = findPlayerWithRole( targetRole );
            game.seerReveal( seerPlayerId, targetPlayerId, cb );
        });
    };
    
    const doRobberSteal = function( cb )
    {
        doSeerReveal( null, function()
        {
            const robberPlayerId = findPlayerWithRole( "robber" );
            const targetPlayerId = findPlayerWithRole( "villager" );
            game.robberSteal( robberPlayerId, targetPlayerId, cb.bind( this, robberPlayerId, targetPlayerId ) );
        });
    };
    
    const doTroublemakerSwap = function( cb )
    {
        doRobberSteal( function()
        {
            const troublemakerPlayerId = findPlayerWithRole( "troublemaker" );
            const seerPlayerId = findPlayerWithRole( "seer" );
            const werewolfPlayerId = findPlayerWithRole( "werewolf" );
            game.troublemakerSwap( troublemakerPlayerId, seerPlayerId, werewolfPlayerId, cb.bind( this, seerPlayerId, werewolfPlayerId ) );
        });
    };
    
    const doDrunkSwap = function( cb )
    {
        doTroublemakerSwap( function()
        {
            const drunkPlayerId = findPlayerWithRole( "drunk" );
            game.drunkSwap( drunkPlayerId, cb.bind( this, drunkPlayerId, JSON.parse( JSON.stringify( game.availableRoles ) ) ) );
        });
    };
    
    const doInsomniacInspect = function( cb )
    {
        doDrunkSwap( function()
        {
            const insomniacPlayerId = findPlayerWithRole( "insomniac" );
            game.insomniacInspect( insomniacPlayerId, cb.bind( this, insomniacPlayerId ) );
        });
    };
    
    beforeEach(function( cb )
    {
        new GameModel( -1, function( setGame )
        {
            game = setGame;
            
            //clear out any old data
            setGame.reset( function( error )
            {
                addMultiplePlayers( game, targetPlayerCount, function()
                {
                    addMultipleRoles( game, targetRoleCount, function()
                    {
                        game.startGame( function( error2 )
                        {
                            game.players.forEach( ( playerId, index ) =>
                            {
                                //note that this may cause duplicates of some roles
                                if ( index < forcedRoles.length )
                                {
                                    game.roles[ playerId ] = forcedRoles[ index ];
                                    game.initialRoles[ playerId ] = forcedRoles[ index ];
                                }
                            });
                            
                            game.availableRoles = JSON.parse( JSON.stringify( forcedExtraRoles ) );
                            
                            cb();
                        });
                    });
                });
            });
        });
    });
    
    it( "should be able to swap to a villager as the doppelganger", function( cb )
    {
        doDoppelgangerCopy( "villager", function( doppelgangerPlayerId, error, newRole )
        {
            expect(error).toBeFalsy();
            expect(newRole).toEqual("villager");
            expect(game.roleData.doppelganger).toEqual("villager");
            cb();
        });
    });
    
    it( "should be able to reveal the villager's card as the seer", function( cb )
    {
        doSeerReveal( "villager", function( error, revealedRoles )
        {
            expect(error).toBeFalsy();
            expect(revealedRoles.length).toEqual(1);
            expect(revealedRoles[0]).toEqual("villager");
            cb();
        });
    });
    
    it( "should be able to reveal 2 unassigned cards as the seer", function( cb )
    {
        doSeerReveal( null, function( error, revealedRoles )
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
        
        doRobberSteal( function( robberPlayerId, targetPlayerId, error, stolenRole )
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
        doTroublemakerSwap( function( targetPlayerId0, targetPlayerId1, error )
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
        doDrunkSwap( function( drunkPlayerId, availableRolesBefore, error )
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
        doInsomniacInspect( function( insomniacPlayerId, error, revealedRole )
        {
            expect(error).toBeFalsy();
            expect(game.roles[insomniacPlayerId]).toEqual("insomniac");
            expect(revealedRole).toEqual("insomniac");
            cb();
        });
    });
    
    it( "should be able to reveal the villager's card as the doppelganger-seer", function( cb )
    {
        doDoppelgangerCopy( "seer", function( doppelgangerPlayerId, error, newRole )
        {
            expect(game.roleData.doppelganger).toEqual("seer");
            const villagerPlayerId = findPlayerWithRole("villager");

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
        doDoppelgangerCopy( "seer", function( doppelgangerPlayerId, error, newRole )
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
        doDoppelgangerCopy( "robber", function( doppelgangerPlayerId, error, newRole )
        {
            expect(game.roleData.doppelganger).toEqual("robber");
            const villagerPlayerId = findPlayerWithRole("villager");

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
        doDoppelgangerCopy( "troublemaker", function( doppelgangerPlayerId, error, newRole )
        {
            expect(game.roleData.doppelganger).toEqual("troublemaker");
            const targetPlayerId0 = findPlayerWithRole("seer");
            const targetPlayerId1 = findPlayerWithRole("werewolf");

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
        doDoppelgangerCopy( "drunk", function( doppelgangerPlayerId, error, newRole )
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
    
    //TODO
    // it( "should be able to view its own card as the doppelganger-insomniac", function( cb )
    // {
    //     doDoppelgangerCopy( "insomniac", function( doppelgangerPlayerId, error, newRole )
    //     {expect(game.roleData.doppelganger).toEqual("insomniac");
    //         //TODO - we actually need to wait for everyone else first
    //         doInsomniacInspect( function( insomniacPlayerId, error, revealedRole )
    //         {
    //             expect(error).toBeFalsy();
    //             expect(game.roles[insomniacPlayerId]).toEqual("insomniac");
    //             expect(revealedRole).toEqual("insomniac");
    //             cb();
    //         });
    //     });
    // });
});

//NEXT - add tests for all the different doppelganger options
//doppel won't work if it's the insomniac, need to fix that... going to suck,
//likely easiest to just add a BS edge case in gotoNextPhase or something... that sucks though
//maybe add another phase that's like doppelInsomniac, then have a config that doesn't add
//this thing to all the various lists? weak tho
//NEXT NEXT - add tests for all the error checking, like when you try to go not on your turn
//NEXT NEXT NEXT - put in the controller and all the slack interactions, put the slack stuff
//behind an abstraction so it could easily be changed for discord etc