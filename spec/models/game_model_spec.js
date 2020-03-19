describe( "GameModel", function()
{
    var GameModel = require( "../../server/models/game_model.js" );
    var game;
    
    const dummyPlayerIds =
    [
        "#0",
        "#1",
        "#2",
        "#3",
        "#4",
        "#5",
        "#6"
    ];
    
    const dummyRoles =
    [
        "villager",
        "werewolf",
        "seer",
        "troublemaker",
        "robber",
        "werewolf",
        "drunk",
        "minion",
        "mason"
    ];

    beforeEach(function( cb )
    {
        game = new GameModel( -1, cb );
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
});
