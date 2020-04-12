/*global module*/
/*global console*/
/*global require*/

const database = require( "../database.js" );
const config = require( "../config.js" );

const GAMES_LIST_KEY = "games";
const GAME_KEY_PREFIX = "game.";

//creates a new game and calls cb when done, with the game and a boolean parameter on whether this is a new game.
//automatically loads the game from the db if it's an existing game, otherwise creates a new one.
//optionally you can provide a callback that will be called when we update
var GameModel = module.exports = function( channelId, cb )
{
    this.id = channelId;
    
    //all players in this game by id
    this.players = [];
    
    //maps player ids to roles that have been assigned to them (including after swaps)
    this.roles = {};
    
    //maps player ids to the roles that were initially assigned to that player, before swaps
    this.initialRoles = {};
    
    //maps a role to additional data for that role (currently only used by the doppelganger for their copied role)
    this.roleData = {};
    
    //a list of all roles that are in this game but haven't been assigned.
    //before assigning roles, this will have every possible role that can be dealt,
    //and will be filled automatically to be playerCount + 3, as the game demands.
    //after assigning roles, this will have exactly 3 roles in it – those that are unassigned
    this.availableRoles = [];
    
    //these are roles that are not being used in this game at all – mutually exclusive with
    //roles that end up in the availableRoles array
    this.unusedRoles = [];
    
    //the phase of the game, matches an enum config.GamePhase
    this.phase = 0;
    
    //the phase of the night if the current phase is GamePhase.night, matches config.NightPhase
    this.nightPhase = 0;
    
    //maps player ids to response urls – when the game updates, it sends the updates to all the URLs
    this.responseUrls = {};

    //if this game already exists, load it, otherwise just return a new game
    database.exists( this.getDatabaseKey(), function( error, exists )
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
                this._initializeNewGame( true );
                this.save( cb.bind( this, this, true ) );
            }.bind(this));
        }
    }.bind( this ));
};

GameModel.prototype._initializeNewGame = function( clearPlayers )
{
    if ( clearPlayers )
    {
        this.players = [];
    }
    
    this.phase = 0;
    this.nightPhase = 0;
    this.availableRoles = [];
    this.unusedRoles = [];
    this.roles = {};
    this.initialRoles = {};
    this.roleData = {};
    this.responseUrls = {};
    
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
    //this is just a safety thing in case someone tries to save data in memory later.
    this._initializeNewGame( true );
    
    //delete from the db
    database.removeFromList( GAMES_LIST_KEY, this.id, function()
    {
        database.del( this.getDatabaseKey(), cb );
    }.bind(this));
};

//clears all settings
GameModel.prototype.reset = function( cb )
{
    this._initializeNewGame( true );
    this.save( cb );
};

//keeps the players, but clears all the gameplay data
GameModel.prototype.restart = function( cb )
{
    this._initializeNewGame( false );
    this.save( cb );
};

//adds a new player, and includes an optional responseUrl for them
GameModel.prototype.addPlayer = function( userId, cb, responseUrl )
{
    if ( this.players.indexOf( userId ) >= 0 )
    {
        cb( "That player is already in the game." );
    }
    else if ( this.phase !== config.GamePhase.WaitingForPlayers )
    {
        cb( "The game has already started." );
    }
    else if ( this.players.length >= config.maximumPlayerCount )
    {
        cb( "The game is full." );
    }
    else
    {
        this.players.push( userId );
        
        if ( responseUrl )
        {
            this.responseUrls[userId] = responseUrl;
        }
        
        this.save( cb );
    }
};

GameModel.prototype.removePlayer = function( userId, cb )
{
    //do we really want this?
    if ( this.phase !== config.GamePhase.WaitingForPlayers )
    {
        cb( "The game has already started! Dropping isn't possible!" );
    }
    else
    {
        let userIndex = this.players.indexOf( userId );
        if ( userIndex < 0 )
        {
            cb( "That player already isn't in the game!" );
        }
        else
        {
            this.players.splice( userIndex, 1 );
            delete this.responseUrls[userId];
            delete this.roles[userId];
            delete this.initialRoles[userId];
            this.save( cb );
        }
    }
};

GameModel.prototype.hasPlayer = function( userId )
{
    return this.players.indexOf( userId ) >= 0;
};

GameModel.prototype.setResponseUrl = function( userId, responseUrl, cb )
{
    if ( this.players.indexOf( userId ) < 0 )
    {
        cb( "That player is not in the game." );
        return;
    }
    
    this.responseUrls[userId] = responseUrl;
    this.save( cb );
};

GameModel.prototype.getUsedRoles = function()
{
    const usedRoles = [];
    Object.keys( this.roles ).forEach( function( role )
    {
        usedRoles.add( role );
    });
    this.availableRoles.forEach( function( role )
    {
        usedRoles.add( role );
    });
    return usedRoles;
};

GameModel.prototype.isUserTurn = function( userId )
{
    if ( this.phase !== config.GamePhase.Night )
    {
        return false;
    }
    
    const role = this.roles[userId];
    if ( !role )
    {
        return false;
    }
    
    if ( !config.ActiveNightRoles[role] )
    {
        return false;
    }
    
    return ( this.nightPhase === config.NightPhase[role] );
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
    //if we have too many players, just start adding random roles up to playerCount + 3 (3 is a game design choice)
    for ( let remainingRoleIndex = this.availableRoles.length; remainingRoleIndex < playerCount + 3 && this.unusedRoles.length > 0; remainingRoleIndex++ )
    {
        const randomRoleIndex = Math.floor( Math.random() * this.unusedRoles.length );
        this.availableRoles.push( this.unusedRoles[ randomRoleIndex ] );
        this.unusedRoles.splice( randomRoleIndex, 1 );
    }
};

GameModel.prototype.addRole = function( role, cb )
{
    if ( this.phase !== config.GamePhase.WaitingForPlayers )
    {
        cb( "The game has already started!" );
    }
    else
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
}

GameModel.prototype.removeRole = function( role, cb )
{
    if ( this.phase !== config.GamePhase.WaitingForPlayers )
    {
        cb( "The game has already started!" );
    }
    else
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
}

GameModel.prototype.hasRole = function( role )
{
    if ( this.phase === config.GamePhase.WaitingForPlayers )
    {
        return this.availableRoles.indexOf( role ) >= 0;
    }
    
    return Object.values( this.roles ).indexOf( role ) >= 0;
};

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

GameModel.prototype.beginCountdownToNight = function( cb, countdownCompleteCb )
{
    if ( this.phase !== config.GamePhase.WaitingForPlayers )
    {
        cb( "The game has already started!" );
    }
    
    this.phase = config.GamePhase.CountdownToNight;
    
    this._prepareRolesForNight();
    
    this.save( cb );
    
    //this is messy, but the easiest way - just move on to the next phase after a delay
    setTimeout( () =>
    {
        if ( this.phase === config.GamePhase.CountdownToNight )
        {
            this.startNight( countdownCompleteCb );
        }
        else
        {
            countdownCompleteCb();
        }
    }, config.countdownToNightLength );
};

GameModel.prototype.startNight = function( cb )
{
    if ( this.phase === config.GamePhase.Finished )
    {
        cb( "The game was completed. Create a new one!" );
    }
    else if ( this.phase !== config.GamePhase.WaitingForPlayers &&
              this.phase !== config.GamePhase.CountdownToNight )
    {
        cb( "The game has already started!" );
    }
    else
    {
        //tests and the admin panel can start the game immediately, this fixes that case
        if ( !this.roles[this.players[0]] )
        {
            this._prepareRolesForNight();
        }
        
        this.phase = config.GamePhase.Night;
        
        //advance the night phase to whatever role is first
        this.nightPhase = -1;
        this._goToNextNightPhase();
    
        this.save( cb );
    }
};

GameModel.prototype.beginCountdownToDay = function( cb, countdownCompleteCb )
{
    //allow CountdownToDay in case we want to trigger this later
    if ( this.phase !== config.GamePhase.Night &&
         this.phase !== config.GamePhase.CountdownToDay )
    {
        cb( "The game must in the Night phase!" );
    }
    
    this.phase = config.GamePhase.CountdownToDay;
    
    this.save( cb );
    
    //this is messy, but the easiest way - just move on to the next phase after a delay
    setTimeout( () =>
    {
        if ( this.phase === config.GamePhase.CountdownToDay )
        {
            this.phase = config.GamePhase.Day;
            this.save( countdownCompleteCb );
        }
        else
        {
            countdownCompleteCb();
        }
    }, config.countdownToDayLength );
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
        return;
    }
    
    const newRole = this.roles[ targetPlayerId ];
    
    //only go to the next phase if the doppelganger doesn't immediately have to do something else
    //if they do, then they'll have to do that action and that will cause the next phase to happen
    if ( newRole !== "seer" && newRole !== "robber" && newRole !== "troublemaker" && newRole !== "drunk" )
    {
        this._goToNextNightPhase();
    }
    
    this.roleData.doppelganger = newRole;
        
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

//calls cb with a viewed card as param 2
//can only be called if there is exactly one werewolf
GameModel.prototype.werewolfReveal = function( werewolfPlayerId, cb )
{
    if ( !( this.initialRoles[ werewolfPlayerId ] === "werewolf" ||
          ( this.initialRoles[ werewolfPlayerId ] === "doppelganger" && this.roleData.doppelganger === "werewolf" ) ) )
    {
        cb( "You're not a werewolf!" );
        return;
    }
    
    if ( this.phase !== config.GamePhase.Night )
    {
        cb( "That can only be done at night!" );
        return;
    }
    
    if ( this.nightPhase !== config.NightPhase.werewolf )
    {
        cb( "It's not the werewolf's turn yet!" );
        return;
    }
    
    if ( this._getWerewolfCount() > 1 )
    {
        cb( "A werewolf can only view a center card if they are alone!" );
        return;
    }
    
    this._goToNextNightPhase();
    this.save( ( error ) =>
    {
        if ( error )
        {
            cb( error )
        }
        else
        {
            cb( null, this._getRandomAvaialableRoles(1) );
        }
    });
    
};

//calls cb with an array of viewed cards as param 2.
//if null is passed for the targetPlayerId, 2 of the center cards are revealed instead
GameModel.prototype.seerReveal = function( seerPlayerId, targetPlayerIdOrNull, cb )
{
    if ( !( this.initialRoles[ seerPlayerId ] === "seer" ||
          ( this.initialRoles[ seerPlayerId ] === "doppelganger" && this.roleData.doppelganger === "seer" ) ) )
    {
        cb( "You're not a seer!" );
        return;
    }
    
    if ( seerPlayerId === targetPlayerIdOrNull )
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
          ( this.nightPhase === config.NightPhase.doppelganger && this.roleData.doppelganger === "seer" ) ) )
    {
        cb( "It's not the seer's turn yet!" );
        return;
    }
    
    if ( targetPlayerIdOrNull )
    {
        if ( !this.roles[ targetPlayerIdOrNull ] )
        {
            cb( "That player is not in the game!" );
            return;
        }
        
        this._goToNextNightPhase();
        
        this.save( ( error ) =>
        {
            if ( error )
            {
                cb( error )
            }
            else
            {
                cb( null, [ this.roles[ targetPlayerIdOrNull ] ] );
            }
        });
    }
    else
    {
        this._goToNextNightPhase();
        
        this.save( ( error ) =>
        {
            if ( error )
            {
                cb( error )
            }
            else
            {
                cb( null, this._getRandomAvaialableRoles( 2 ) );
            }
        });
    }
};

//calls cb with the swapped card passed as param 2, and reassigns the robber and the target
GameModel.prototype.robberSteal = function( robberPlayerId, targetPlayerId, cb )
{
    if ( !( this.initialRoles[ robberPlayerId ] === "robber" ||
          ( this.initialRoles[ robberPlayerId ] === "doppelganger" && this.roleData.doppelganger === "robber" ) ) )
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
          ( this.nightPhase === config.NightPhase.doppelganger && this.roleData.doppelganger === "robber" ) ) )
    {
        cb( "It's not the robber's turn yet!" );
        return;
    }
    
    this._goToNextNightPhase();
    
    const initialRole = this.roles[ robberPlayerId ];
    this.roles[ robberPlayerId ] = this.roles[ targetPlayerId ];
    this.roles[ targetPlayerId ] = initialRole;
    
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
          ( this.initialRoles[ troublemakerPlayerId ] === "doppelganger" && this.roleData.doppelganger === "troublemaker" ) ) )
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
          ( this.nightPhase === config.NightPhase.doppelganger && this.roleData.doppelganger === "troublemaker" ) ) )
    {
        cb( "It's not the troublemaker's turn yet!" );
        return;
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
    if ( !( this.initialRoles[ drunkPlayerId ] === "drunk" ||
          ( this.initialRoles[ drunkPlayerId ] === "doppelganger" && this.roleData.doppelganger === "drunk" ) ) )
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
          ( this.nightPhase === config.NightPhase.doppelganger && this.roleData.doppelganger === "drunk" ) ) )
    {
        cb( "It's not the drunk's turn yet!" );
        return;
    }
        
    this._goToNextNightPhase();
    
    const availableIndex = Math.floor( Math.random() * this.availableRoles.length );
    const initialRole = this.roles[ drunkPlayerId ];
    this.roles[ drunkPlayerId ] = this.availableRoles[ availableIndex ];
    this.availableRoles[ availableIndex ] = initialRole;
    
    this.save( cb );
};

//calls cb with the insomniac's role as param 2
GameModel.prototype.insomniacInspect = function( insomniacPlayerId, cb )
{
    if ( !( this.initialRoles[ insomniacPlayerId ] === "insomniac" ||
          ( this.initialRoles[ insomniacPlayerId ] === "doppelganger" && this.roleData.doppelganger === "insomniac" ) ) )
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
          ( this.nightPhase === config.NightPhase["doppelganger-insomniac"] && this.roleData.doppelganger === "insomniac" ) ) )
    {
        cb( "It's not the insomniac's turn yet!" );
        return;
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

GameModel.prototype.goToNextNightPhase = function( cb )
{
    if ( this.phase !== config.GamePhase.Night )
    {
        cb( "That can only be done at night!" );
        return;
    }
    
    this._goToNextNightPhase();
    this.save( cb );
};

GameModel.prototype._prepareRolesForNight = function()
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
        const rawRole = config.NightPhaseList[ this.nightPhase ];
        const role = rawRole === "doppelganger-insomniac" ? "doppelganger" : rawRole;
        
        let roleExists = false;
        for ( let playerIndex = 0; playerIndex < this.players.length; playerIndex++ )
        {
            if ( this.initialRoles[this.players[playerIndex]] === role )
            {
                roleExists = true;
                break;
            }
        }
        
        //we only use the doppelganger-insomniac phase if the doppelganger selected this role
        if ( rawRole === "doppelganger-insomniac" && this.roleData.doppelganger !== "insomniac" )
        {
            roleExists = false;
        }
        
        let isActiveRole = config.ActiveNightRoles[ role ];
        
        //edge case - only via the "lone wolf" rule can a werewolf do an activity
        if ( role === "werewolf" && this._getWerewolfCount() !== 1 )
        {
            isActiveRole = false;
        }
        
        if ( roleExists && isActiveRole )
        {
            break;
        }
    }
    
    if ( this.nightPhase >= config.NightPhaseList.length )
    {
        this.phase = config.GamePhase.CountdownToDay;
        return true;
    }
    
    return false;
};

GameModel.prototype._getRandomAvaialableRoles = function( selectCount )
{
    const possibleRoles = [];
    this.availableRoles.forEach( ( role ) =>
    {
        possibleRoles.push( role );
    });
    
    const resultsArr = [];
    for ( let selectIndex = 0; selectIndex < selectCount; selectIndex++ )
    {
        const possibleRoleIndex = Math.floor( Math.random() * possibleRoles.length );
        resultsArr.push( possibleRoles[ possibleRoleIndex ] );
        possibleRoles.splice( possibleRoleIndex, 1 );
    }
    
    return resultsArr;
};

GameModel.prototype._getWerewolfCount = function()
{
    let werewolfCount = this.roleData.doppelganger === "werewolf" ? 1 : 0;
    Object.values( this.roles ).forEach( function( role )
    {
        if ( role === "werewolf" )
        {
            werewolfCount++;
        }
    });
    return werewolfCount;
};