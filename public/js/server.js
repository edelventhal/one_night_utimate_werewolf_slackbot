/*global encodeURIComponent*/
/*global XMLHttpRequest*/
/*global alert*/

//can conventiently be used to asynchronously make RESTful server calls
//see the testMyRoute and testUseParameter examples below.
var server =
{
    _sendRequest: function( url, cb, params )
    {
        var fullUrl = url;
        
        if ( params )
        {
            var addedParam = false;
            var key;
            for ( key in params )
            {
                if ( !addedParam )
                {
                    fullUrl += "?";
                    addedParam = true;
                }
                else
                {
                    fullUrl += "&";
                }
            
                fullUrl += encodeURIComponent(key);
                fullUrl += "=";
                fullUrl += encodeURIComponent( params[key] );
            }
        }
        
        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", this._loadResponse.bind( this, oReq, fullUrl, cb ) );
        oReq.addEventListener("error", this._loadError.bind( this, oReq, fullUrl, cb ) );
        oReq.open("GET", fullUrl );
        oReq.send();
    },
    
    _loadResponse: function( oReq, url, cb )
    {
        if ( oReq.status !== 200 )
        {
            this._loadError( oReq, url, cb );
        }
        else
        {
            cb( JSON.parse( oReq.responseText ) );
        }
    },
    
    _loadError: function( oReq, url, cb )
    {
        alert( "Failed to load URL: " + url + ". Error " + oReq.status + ".\n" + oReq.responseText );
        cb();
    },
    
    addPlayer: function( gameId, playerId, cb )
    {
        console.log( "Adding player " + playerId + " to game " + gameId );
        this._sendRequest( "game/join", cb, { gameId: gameId, joiningPlayerId: playerId } );
    },
    
    removePlayer: function( gameId, playerId, cb )
    {
        this._sendRequest( "game/drop", cb, { gameId: gameId, droppingPlayerId: playerId } );
    },
    
    getGameData: function( gameId, cb )
    {
        this._sendRequest( "game/getData", cb, { gameId: gameId } );
    },
    
    startNight: function( gameId, cb )
    {
        this._sendRequest( "game/start", cb, { gameId: gameId } );
    },
    
    restartNight: function( gameId, cb )
    {
        this._sendRequest( "game/restart", cb, { gameId: gameId } );
    },
    
    nextTurn: function( gameId, cb )
    {
        this._sendRequest( "game/nextTurn", cb, { gameId: gameId } );
    }
};