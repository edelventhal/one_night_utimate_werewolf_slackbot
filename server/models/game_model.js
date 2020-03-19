/*global module*/
/*global console*/
/*global require*/

const database = require( "../database.js" );
const config = require( "../config.js" );

const GAMES_LIST_KEY = "games";
const GAME_KEY_PREFIX = "game.";

//creates a new game and calls cb when done, with the game and a boolean parameter on whether this is a new game.
//automatically loads the game from the db if it's an existing game, otherwise creates a new one.
var GameModel = module.exports = function( gameId, cb )
{
    this.id = gameId;
    this.players = [];
    this.roles = {}; //a dict where the playerId is the key, and role is the value
    this.initialRoles = {}; //a dict where the playerId is the key, and the role is the value
    this.roleData = {}; // a dict where the role is the key, and some data is the value
    this.availableRoles = [];
    this.unusedRoles = [];
    this.phase = 0;
    this.nightPhase = 0;

    //if this game already exists, load it, otherwise just return a new game
    database.exists( this.getDatabaseKey(), function( exists )
    {
        if ( exists )
        {
            this.load( function()
            {
                cb( this, false );
            }.bind(this) );
            
        }
        else
        {
            database.push( GAMES_LIST_KEY, this.id, function()
            {
                this._initializeNewGame();
                this.save( cb.bind( this, this, true ) );
            }.bind(this));
        }
    }.bind( this ));
};

GameModel.prototype._initializeNewGame = function()
{
    this.players = [];
    this.phase = 0;
    this.nightPhase = 0;
    this.availableRoles = [];
    this.unusedRoles = [];
    this.roles = {};
    this.initialRoles = {};
    this.roleData = {};
    
    config.RoleList.forEach( ( role ) => {
        for ( let roleDupeIndex = 0; roleDupeIndex < config.RoleCounts[role]; roleDupeIndex++ )
        {
            this.unusedRoles.push( role );
        }
    });
};

GameModel.prototype.getDatabaseKey = function()
{
    return GAME_KEY_PREFIX + this.id;
};

GameModel.prototype.save = function( cb )
{
    database.setJsonFromObject( this.getDatabaseKey(), this, cb );
};

//refreshes this object's values based upon what's in the database
GameModel.prototype.load = function( cb )
{
    database.writeJsonToObject( this.getDatabaseKey(), this, function()
    {
        cb();
    }.bind(this));
};

GameModel.prototype.remove = function( cb )
{
    database.removeFromList( GAMES_LIST_KEY, this.id, function()
    {
        database.del( this.getDatabaseKey(), cb );
    }.bind(this));
};

GameModel.prototype.reset = function()
{
    this._initializeNewGame();
};

GameModel.prototype.addPlayer = function( userId, cb )
{
    if ( this.players.indexOf( userId ) >= 0 )
    {
        cb( "That player is already in the game." );
    }
    else
    {
        this.players.push( userId );
        this.save( cb );
    }
};

GameModel.prototype.removePlayer = function( userId, cb )
{
    let userIndex = this.players.indexOf( userId );
    if ( userIndex < 0 )
    {
        cb();
    }
    else
    {
        this.players.splice( userIndex, 1 );
        this.save( cb );
    }
};

GameModel.prototype._addDefaultRoles = function( playerCount )
{
    this.availableRoles =
    [
        "werewolf",
        "werewolf",
        "seer",
        "robber",
        "troublemaker",
        "villager"
    ];
    
    const extraVillagerCount = Math.min( 2, playerCount - 3 );
    for ( let extraVillagerIndex = 0; extraVillagerIndex < extraVillagerCount; extraVillagerIndex++ )
    {
        this.availableRoles.push( "villager" );
    }
    
    //update the available roles list
    this.availableRoles.forEach( ( role ) =>
    {
        let roleIndex = this.unusedRoles.indexOf( role );
        if ( roleIndex >= 0 )
        {
            this.unusedRoles.splice( roleIndex, 1 );
        }
    });
    
    this._fillRolesRandomly( playerCount );
};

GameModel.prototype._fillRolesRandomly = function( playerCount )
{
    //if we have too many players, just start adding random roles
    for ( let remainingRoleIndex = this.availableRoles.length; remainingRoleIndex < playerCount && this.unusedRoles.length > 0; remainingRoleIndex++ )
    {
        const randomRoleIndex = Math.floor( Math.random() * this.unusedRoles.length );
        this.availableRoles.push( this.unusedRoles[ randomRoleIndex ] );
        this.unusedRoles.splice( randomRoleIndex, 1 );
    }
};

GameModel.prototype.addRole = function( role, cb )
{
    role = role.toLowerCase();
    let index = this.unusedRoles.indexOf( role );
    if ( index < 0 )
    {
        cb( "You can't add another " + role + " to this game." );
        return;
    }
    this.unusedRoles.splice( index, 1 );
    this.availableRoles.push( role );
    this.save( cb );
}

GameModel.prototype.removeRole = function( role, cb )
{
    role = role.toLowerCase();
    let index = this.availableRoles.indexOf( role );
    if ( index < 0 )
    {
        cb( "There is not a " + role + " in this game." );
        return;
    }
    this.availableRoles.splice( index, 1 );
    this.unusedRoles.push( role );
    this.save( cb );
}

GameModel.prototype._getCountForRole = function( role )
{
    role = role.toLowerCase();
    let count = 0;
    this.availableRoles.forEach( ( foundRole ) =>
    {
        if ( foundRole === role )
        {
            count++;
        }
    });
    
    return count;
}

GameModel.prototype.startGame = function( cb )
{
    //if we have no roles, fill them with the defaults
    if ( this.availableRoles.length <= 0 )
    {
        this._addDefaultRoles( this.players.length );
    }
    //just in case, fill up any additional roles that are needed
    else
    {
        this._fillRolesRandomly( this.players.length );
    }
    
    this._assignRoles();
    //TODO - need to Slack private message all the players their roles
    this.phase++;
    
    this.save( cb );
};

//calls cb with the viewed card passed as param 2, and reassigns the doppelganger
GameModel.prototype.doppelgangerCopy = function( doppelPlayerId, targetPlayerId, cb )
{
    if ( this.initialRoles[ doppelPlayerId ] !== "doppelganger" )
    {
        cb( "You're not a doppelganger!" );
        return;
    }
    
    if ( doppelPlayerId === targetPlayerId )
    {
        cb( "You can't target yourself!" );
        return;
    }
    
    if ( !this.roles[ targetPlayerId ] )
    {
        cb( "That player is not in the game!" );
        return;
    }
    
    if ( this.phase !== config.GamePhase.Night )
    {
        cb( "That can only be done at night!" );
        return;
    }
    
    if ( this.nightPhase !== config.NightPhase.doppelganger )
    {
        cb( "It's not the doppelganger's turn yet!" );
    }
    
    this._goToNextNightPhase();
    
    this.roleData.doppelganger = this.roles[ targetPlayerId ];
    
    this.save( ( error ) =>
    {
        if ( error )
        {
            cb( error );
        }
        else
        {
            cb( null, this.roleData.doppelganger );
        }
    });
};

//calls cb with an array of viewed cards as param 2.
//if null is passed for the targetPlayerId, 2 of the center cards are revealed instead
GameModel.prototype.seerReveal = function( seerPlayerId, targetPlayerIdOrNull, cb )
{
    if ( !( this.initialRoles[ seerPlayerId ] === "seer" ||
          ( this.initialRoles[ seerPlayerId ] === "doppelganger" && this.roleData[ seerPlayerId ] === "seer" ) ) )
    {
        cb( "You're not a seer!" );
        return;
    }
    
    if ( seerPlayerId === targetPlayerId )
    {
        cb( "You can't target yourself!" );
        return;
    }
    
    if ( this.phase !== config.GamePhase.Night )
    {
        cb( "That can only be done at night!" );
        return;
    }
    
    if ( !( this.nightPhase === config.NightPhase.seer ||
          ( this.nightPhase === config.NightPhase.doppelganger && this.roleData[ seerPlayerId ] === "seer" ) ) )
    {
        cb( "It's not the seer's turn yet!" );
    }
    
    this._goToNextNightPhase();
    
    if ( targetPlayerIdOrNull )
    {
        if ( !this.roles[ targetPlayerIdOrNull ] )
        {
            cb( "That player is not in the game!" );
            return;
        }
        
        cb( null, [ this.roles[ targetPlayerIdOrNull ] ] );
    }
    else
    {
        const possibleRoles = [];
        this.availableRoles.forEach( ( role ) =>
        {
            possibleRoles.push( role );
        });
        
        const resultsArr = [];
        const revealCount = 2;
        for ( let revealIndex = 0; revealIndex < revealCount; revealIndex++ )
        {
            const possibleRoleIndex = Math.floor( Math.random() * possibleRoles.length );
            resultsArr.push( possibleRoles[ possibleRoleIndex ] );
            possibleRoles.splice( possibleRoleIndex, 1 );
        }
        
        cb( null, resultsArr );
    }
};

//calls cb with the swapped card passed as param 2, and reassigns the robber and the target
GameModel.prototype.robberSteal = function( robberPlayerId, targetPlayerId, cb )
{
    if ( !( this.initialRoles[ robberPlayerId ] === "robber" ||
          ( this.initialRoles[ robberPlayerId ] === "doppelganger" && this.roleData[ robberPlayerId ] === "robber" ) ) )
    {
        cb( "You're not a robber!" );
        return;
    }
    
    if ( robberPlayerId === targetPlayerId )
    {
        cb( "You can't target yourself!" );
        return;
    }
    
    if ( !this.roles[ targetPlayerId ] )
    {
        cb( "That player is not in the game!" );
        return;
    }
    
    if ( this.phase !== config.GamePhase.Night )
    {
        cb( "That can only be done at night!" );
        return;
    }
    
    if ( !( this.nightPhase === config.NightPhase.robber ||
          ( this.nightPhase === config.NightPhase.doppelganger && this.roleData[ robberPlayerId ] === "robber" ) ) )
    {
        cb( "It's not the robber's turn yet!" );
    }
    
    this._goToNextNightPhase();
    
    this.roles[ robberPlayerId ] = this.roles[ targetPlayerId ];
    this.roles[ targetPlayerId ] = "robber";
    
    this.save( ( error ) =>
    {
        if ( error )
        {
            cb( error );
        }
        else
        {
            cb( null, this.roles[ robberPlayerId ] );
        }
    });
};

//reassigns the swapped targets
GameModel.prototype.troublemakerSwap = function( troublemakerPlayerId, targetPlayerId0, targetPlayerId1, cb )
{
    if ( !( this.initialRoles[ troublemakerPlayerId ] === "troublemaker" ||
          ( this.initialRoles[ troublemakerPlayerId ] === "doppelganger" && this.roleData[ troublemakerPlayerId ] === "troublemaker" ) ) )
    {
        cb( "You're not a troublemaker!" );
        return;
    }
    
    if ( troublemakerPlayerId === targetPlayerId0 || troublemakerPlayerId === targetPlayerId1 )
    {
        cb( "You can't target yourself!" );
        return;
    }
    
    if ( !this.roles[ targetPlayerId0 ] || !this.roles[ targetPlayerId1 ] )
    {
        cb( "One of those players is not in the game!" );
        return;
    }
    
    if ( this.phase !== config.GamePhase.Night )
    {
        cb( "That can only be done at night!" );
        return;
    }
    
    if ( !( this.nightPhase === config.NightPhase.troublemaker ||
          ( this.nightPhase === config.NightPhase.doppelganger && this.roleData[ troublemakerPlayerId ] === "troublemaker" ) ) )
    {
        cb( "It's not the troublemaker's turn yet!" );
    }
    
    this._goToNextNightPhase();
    
    const targetPlayerRole0 = this.roles[ targetPlayerId0 ];
    this.roles[ targetPlayerId0 ] = this.roles[ targetPlayerId1 ];
    this.roles[ targetPlayerId1 ] = targetPlayerRole0;
    
    this.save( cb );
};

//reassigns the drunk with one of the cards from the center
GameModel.prototype.drunkSwap = function( drunkPlayerId, cb )
{
    if ( !( this.initialRoles[ troublemakerPlayerId ] === "drunk" ||
          ( this.initialRoles[ troublemakerPlayerId ] === "doppelganger" && this.roleData[ troublemakerPlayerId ] === "drunk" ) ) )
    {
        cb( "You're not a drunk!" );
        return;
    }
    
    if ( this.phase !== config.GamePhase.Night )
    {
        cb( "That can only be done at night!" );
        return;
    }
    
    if ( !( this.nightPhase === config.NightPhase.drunk ||
          ( this.nightPhase === config.NightPhase.doppelganger && this.roleData[ drunkPlayerId ] === "drunk" ) ) )
    {
        cb( "It's not the drunk's turn yet!" );
    }
    
    this._goToNextNightPhase();
    
    const availableIndex = Math.floor( Math.random() * this.availableRoles );
    this.roles[ drunkPlayerId ] = this.availableRoles[ availableIndex ];
    this.availableRoles[ availableIndex ] = "drunk";
    
    this.save( cb );
};

//calls cb with the insomniac's role as param 2
GameModel.prototype.insomniacInspect = function( insomniacPlayerId, cb )
{
    if ( !( this.initialRoles[ insomniacPlayerId ] === "insomniac" ||
          ( this.initialRoles[ insomniacPlayerId ] === "doppelganger" && this.roleData[ insomniacPlayerId ] === "insomniac" ) ) )
    {
        cb( "You're not an insomniac!" );
        return;
    }
    
    if ( this.phase !== config.GamePhase.Night )
    {
        cb( "That can only be done at night!" );
        return;
    }
    
    if ( !( this.nightPhase === config.NightPhase.insomniac ||
          ( this.nightPhase === config.NightPhase.doppelganger && this.roleData[ insomniacPlayerId ] === "insomniac" ) ) )
    {
        cb( "It's not the insomniac's turn yet!" );
    }
    
    this._goToNextNightPhase();
    
    this.save( ( error ) =>
    {
        if ( error )
        {
            cb( error );
        }
        else
        {
            cb( null, this.roles[ insomniacPlayerId ] );
        }
    });
};

GameModel.prototype._assignRoles = function()
{
    this.players.forEach( ( playerId ) =>
    {
        let roleIndex = Math.floor( Math.random() * this.availableRoles.length );
        this.roles[ playerId ] = this.availableRoles[ roleIndex ];
        this.initialRoles[ playerId ] = this.roles[ playerId ];
        this.availableRoles.splice( roleIndex, 1 );
    });
};

//returns true if we moved onto the Day phase
GameModel.prototype._goToNextNightPhase = function()
{
    //keep going up until we find a role that exists in this game and we need to do something for
    while ( this.nightPhase <= config.NightPhaseList.length )
    {
        this.nightPhase++;
        const role = config.NightPhaseList[ this.nightPhase ];
        
        if ( this.initialRoles[ role ] && config.ActiveNightRoles[ role ] )
        {
            break;
        }
    }
    
    if ( this.nightPhase >= config.NightPhaseList.length )
    {
        this.phase++;
        return true;
    }
    
    return false;
};