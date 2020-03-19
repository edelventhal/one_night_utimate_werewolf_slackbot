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
    
    updateMessage: function( newMessage, cb )
    {
        this._sendRequest( "coffee/updateMessage", cb, { message: newMessage } );
    },
    
    scheduleCoffee: function( channel, dryRun, cb )
    {
        this._sendRequest( "coffee/scheduleCoffee", cb, { channel: channel, dryRun: dryRun } );
    },
    
    clearPairs: function( cb )
    {
        this._sendRequest( "coffee/clearPairs", cb );
    }
};