var GameModel = require( "../../server/models/game_model.js" );

var TestUtils = module.exports =
{
    dummyPlayerIds:
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
        "#9",
        "#10"
    ],

    dummyRoles:
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
    ],

    addMultiplePlayers: function( game, targetPlayerCount, cb )
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
            game.addPlayer( this.dummyPlayerIds[playerIndex], playerAddedResultFunc );
        }
    },

    addMultipleRoles: function( game, targetRoleCount, cb )
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
            game.addRole( this.dummyRoles[roleIndex], roleAddedResultFunc );
        }
    },
    
    //we force the game to use these specific roles
    forcedRoles:
    [
        "villager",
        "doppelganger",
        "seer",
        "robber",
        "troublemaker",
        "drunk",
        "insomniac",
        "werewolf"
    ],
    
    //these will be in the available roles after assignment
    forcedExtraRoles:
    [
        "villager",
        "mason",
        "werewolf"
    ],
    
    createTestGame: function( cb, omittedForcedRoles )
    {
        const targetPlayerCount = TestUtils.forcedRoles.length;
        const targetRoleCount = targetPlayerCount + 3; //3 is a game design choice
        
        new GameModel( -1, function( game )
        {
            //clear out any old data
            game.reset( function( error )
            {
                TestUtils.addMultiplePlayers( game, targetPlayerCount, function()
                {
                    TestUtils.addMultipleRoles( game, targetRoleCount, function()
                    {
                        game.startGame( function( error2 )
                        {
                            //force the roles in
                            game.players.forEach( ( playerId, index ) =>
                            {
                                //note that this may cause duplicates of some roles
                                if ( index < TestUtils.forcedRoles.length )
                                {
                                    let role = TestUtils.forcedRoles[ index ];
                                    
                                    if ( omittedForcedRoles && omittedForcedRoles.indexOf( TestUtils.forcedRoles[index] ) >= 0 )
                                    {
                                        role = "villager";
                                    }
                                    
                                    game.roles[ playerId ] = role;
                                    game.initialRoles[ playerId ] = role;
                                }
                            });
                            
                            //force the game to go back to the proper night phase with these new roles
                            game.nightPhase = -1;
                            game._goToNextNightPhase();
                            
                            game.availableRoles = JSON.parse( JSON.stringify( TestUtils.forcedExtraRoles ) );
                            
                            cb( game );
                        });
                    });
                });
            });
        });
    },
    
    findPlayerWithRole: function( game, role )
    {
        let result = null;
        game.players.forEach( ( playerId ) =>
        {
            if ( game.roles[playerId] === role && !result )
            {
                result = playerId;
            }
        });
        
        return result;
    },
    
    //these are cascading role functions – they *must* be called in order
    doDoppelgangerCopy: function( game, targetRole, cb )
    {
        const doppelgangerPlayerId = TestUtils.findPlayerWithRole( game, "doppelganger" );
        const targetPlayerId = TestUtils.findPlayerWithRole( game, targetRole );
        game.doppelgangerCopy( doppelgangerPlayerId, targetPlayerId, cb.bind( this, doppelgangerPlayerId ) );
    },
    
    doWerewolfReveal: function( game, cb, skipDoppelganger )
    {
        const werewolfFunc = function()
        {
            const werewolfPlayerId = TestUtils.findPlayerWithRole( game, "werewolf" );
            game.werewolfReveal( werewolfPlayerId, cb );
        };
        
        if ( skipDoppelganger )
        {
            werewolfFunc();
        }
        else
        {
            TestUtils.doDoppelgangerCopy( game, "villager", werewolfFunc );
        }
    },
    
    doSeerReveal: function( game, targetRole, cb, skipDoppelganger )
    {
        TestUtils.doWerewolfReveal( game, function()
        {
            const seerPlayerId = TestUtils.findPlayerWithRole( game, "seer" );
            const targetPlayerId = TestUtils.findPlayerWithRole( game, targetRole );
            game.seerReveal( seerPlayerId, targetPlayerId, cb );
        }, skipDoppelganger );
    },
    
    doRobberSteal: function( game, cb, skipDoppelganger )
    {
        TestUtils.doSeerReveal( game, null, function()
        {
            const robberPlayerId = TestUtils.findPlayerWithRole( game, "robber" );
            const targetPlayerId = TestUtils.findPlayerWithRole( game, "villager" );
            game.robberSteal( robberPlayerId, targetPlayerId, cb.bind( this, robberPlayerId, targetPlayerId ) );
        }, skipDoppelganger);
    },
    
    doTroublemakerSwap: function( game, cb, skipDoppelganger )
    {
        TestUtils.doRobberSteal( game, function()
        {
            const troublemakerPlayerId = TestUtils.findPlayerWithRole( game, "troublemaker" );
            const seerPlayerId = TestUtils.findPlayerWithRole( game, "seer" );
            const werewolfPlayerId = TestUtils.findPlayerWithRole( game, "werewolf" );
            game.troublemakerSwap( troublemakerPlayerId, seerPlayerId, werewolfPlayerId, cb.bind( this, seerPlayerId, werewolfPlayerId ) );
        }, skipDoppelganger);
    },
    
    doDrunkSwap: function( game, cb, skipDoppelganger )
    {
        TestUtils.doTroublemakerSwap( game, function()
        {
            const drunkPlayerId = TestUtils.findPlayerWithRole( game, "drunk" );
            game.drunkSwap( drunkPlayerId, cb.bind( this, drunkPlayerId, JSON.parse( JSON.stringify( game.availableRoles ) ) ) );
        }, skipDoppelganger);
    },
    
    doInsomniacInspect: function( game, cb, skipDoppelganger )
    {
        TestUtils.doDrunkSwap( game, function()
        {
            const insomniacPlayerId = TestUtils.findPlayerWithRole( game, "insomniac" );
            game.insomniacInspect( insomniacPlayerId, cb.bind( this, insomniacPlayerId ) );
        }, skipDoppelganger);
    }
};