/*global module*/
/*global console*/
/*global require*/

var database = require( "../database.js" );
var request = require( "request" );

//database-related utility functions
var Utility = module.exports =
{
    //returns a dump of the entire redis db, helps for debugging
    getDatabaseDump: function( cb )
    {
        database.getAllKeys( function( keys )
        {
            var result = {};
            var resultsRemaining = keys.length;
            
            var resultFunc = function( key, dump )
            {
                result[ key ] = dump;
                resultsRemaining--;
                
                if ( resultsRemaining <= 0 )
                {
                    cb( result );
                }
            };
            
            var keyIndex;
            for ( keyIndex = 0; keyIndex < keys.length; keyIndex++ )
            {
                database.dump( keys[ keyIndex ], resultFunc.bind(this,keys[keyIndex]));
            }
            
            if ( keys.length <= 0 )
            {
                cb( {} );
            }
        }.bind(this));
    },
    
    //for saving and restoring the redis db
    restoreDatabaseFromDump: function( dump, cb )
    {
        if ( typeof( dump ) === "string" )
        {
            try { dump = JSON.parse( dump ); } catch (err) {}
        }
        database.delAll( function( success )
        {
            var keysRemaining = 0;
        
            var key;
            for ( key in dump )
            {
                keysRemaining++;
            }
                
            var restoreFunc = function( success )
            {
                keysRemaining--;
            
                if ( keysRemaining <= 0 )
                {
                    cb( true );
                }
            }.bind(this);
            
            if ( keysRemaining <= 0 )
            {
                cb( true );
            }
            else
            {
                for ( key in dump )
                {
                    database.restore( key, dump[ key ], restoreFunc );
                }
            }
        }.bind(this));
    },
    
    httpsPostJson: function( url, data, auth, cb )
    {
        const headers = {
            "Authorization": auth ? "Bearer " + auth : "",
            "Content-type": "application/json"
        };
        
        console.log( "Sending headers: ", headers );

        const dataString = data ? JSON.stringify( data ) : "{}";

        const options = {
            url: url,
            method: 'POST',
            headers: headers,
            body: dataString
        };

        request( options, function( error, response, body )
         {
             if ( !error && body && typeof( body === "string" ) )
             {
                 body = JSON.parse( body );
             }
             cb( error, body );
         });
    }
};