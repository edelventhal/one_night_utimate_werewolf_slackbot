/*global require*/
/*global module*/
/*global console*/
/*global process*/

var redis = require( "redis" );
var client = redis.createClient(process.env.REDIS_URL);

client.on( "error", function(err)
{
    console.log( "Redis Error: " + err );
});

var Database = module.exports =
{
    verbose: false,
    
    set: function( key, val, cb )
    {
        this._log( "Redis: setting " + key + " to " + val );
        
        if ( val instanceof Array )
        {
            this.exists( key, function( exists )
            {
                if ( exists )
                {
                    this.del( key, function()
                    {
                        this.push( key, val, cb );
                    }.bind(this));
                }
                else
                {
                    this.push( key, val, cb );
                }
            }.bind(this));
        }
        else if ( this.isExpandableObject( val ) )
        {
            this.setJsonFromObject( key, val, cb );
        }
        else
        {
            client.set( key, this._getSetValue( val ), function( err, result )
            {
                cb( !err );
            }.bind(this));
        }
    },
    
    //gets the stored value for a passed key string
    //you can also pass an object with {type:"array"|"value",key:"string"}, in
    //case you want to store a different sort of object, like a list. You can
    //also use these types to automatically coerce the results into what you want,
    //since they are always stored as strings.
    get: function( key, cb )
    {
        var type = key.type;
        if ( type === "array" )
        {
            this.getArray( key, cb );
        }
        else if ( type === "object" )
        {
            this.getObject( key, cb );
        }
        else
        {
            key = key.key || key;
            client.get( key, function( err, reply )
            {
                this._log( "Redis: got " + reply + " for " + key );
                
                var val = reply;
                if ( type === "number" )
                {
                    val = Math.floor( val );
                }
                else if ( type === "boolean" )
                {
                    val = ( val === 1 || val === "1" );
                }
                else if ( type === "date" )
                {
                    val = new Date( val );
                }
                
                cb( val );
                
            }.bind(this));
        }
    },
    
    getArray: function( key, cb )
    {
        var arr = [];
        key = key.key || key;
        
        client.llen( key, function( err, length )
        {
            this._log( "Redis: got an array of length " + length + " for " + key );
            arr.length = length;
            var insertedCount = 0;
            
            var insertFunc = function( index, err, val )
            {
                arr[ index ] = val;
                insertedCount++;
                
                if ( insertedCount >= length )
                {
                    cb( arr );
                }
            };
            
            var index;
            for ( index = 0; index < length; index++ )
            {
                client.lindex( key, index, insertFunc.bind( this, index ) );
            }
            
            if ( length <= 0 )
            {
                cb( [] );
            }
        }.bind(this));
    },
    
    getObject: function( key, cb )
    {
        client.get( key, function( err, result )
        {
            if ( !err )
            {
                cb( JSON.parse( result ) );
            }
            else
            {
                cb( {} );
            }
        }.bind(this));
    },
    
    exists: function( key, cb )
    {
        client.exists( key, function( err, reply )
        {
            this._log( "Redis: does " + key + " exist? " + ( reply === 1 ) );
            cb( reply === 1 );
        }.bind(this));
    },
    
    del: function( key, cb )
    {
        client.del( key, function( err, reply )
        {
            this._log( "Redis: deleting " + key );
            cb( reply === 1 );
        }.bind(this));
    },
    
    delAllForPrefix: function( prefix, cb )
    {
        //this is some bullshit to stop jslint from complaining
        var e = "e";
        var clientEvalFunc = client[ e + "val" ];
        
        //a lua command for deleting everything with a prefix
        clientEvalFunc( [ "return redis.call('del', unpack(redis.call('keys', ARGV[1])))", 0, prefix + "*" ], function( err, reply )
        {
            cb( reply === 1 );
        });
    },
    
    delAll: function( cb )
    {
        client.flushall( function( err, reply )
        {
            this._log( "Redis: erasing entire DB!" );
            cb( !!reply );
        }.bind(this));
    },
    
    //pushes an array or a single value onto a redis list
    //cannot have expandable objects - instead you should do an array of keys
    push: function( key, valueOrArray, cb )
    {
        var arr = ( valueOrArray instanceof Array ) ? valueOrArray : [ valueOrArray ];
        
        if ( arr.length <= 0 )
        {
            cb( 0 );
        }
        else
        {
            var pushParams = [ key ];
            var index;
            for ( index = 0; index < arr.length; index++ )
            {
                pushParams.push( this._getSetValue( arr[ index ] ) );
            }
        
            this._log( "Redis: pushing to " + key + " " + JSON.stringify( arr ) );
            client.lpush( pushParams, function( err, newLength )
            {
                cb( newLength );
            });
        }
    },
    
    //removes all of this object from a list.
    //cannot have expandable objects or arrays
    removeFromList: function( listKey, removedVal, cb )
    {
        client.lrem( listKey, 0, removedVal, function( err, reply )
        {
            this._log( "Redis: removed " + reply + " instances of " + removedVal + " from " + listKey );
            cb( reply );
        }.bind(this));
    },
    
    isValidType: function( val )
    {
        var type = typeof( val );
        
        return type === "boolean" || type === "number" || type === "string" || val instanceof Array || val instanceof Date || this.isExpandableObject( val );
    },
    
    isExpandableObject: function( val )
    {
        if ( typeof( val ) !== "object" )
        {
            return false;
        }
        
        if ( val instanceof Array || val instanceof Date )
        {
            return false;
        }
        
        return true;
    },
    
    setJsonFromObject: function( key, obj, cb )
    {
        var jsonString = JSON.stringify( obj );
        this._log( "Redis: setting object " + key + " to " + jsonString );
        
        client.set( key, jsonString, function( err, result )
        {
            cb( !err );
        });
    },
    
    writeJsonToObject: function( key, obj, cb )
    {
        client.get( key, function( err, result )
        {
            this._log( "Redis: got object string " + result + " for " + key );
            
            if ( !err )
            {
                var data = JSON.parse( result );
                var dataKey;
                for ( dataKey in data )
                {
                    obj[ dataKey ] = data[ dataKey ];
                }
            }
            cb( !err );
        }.bind(this));
    },
    
    dump: function( key, cb )
    {
        client.get( key, function( err, result )
        {
            if ( err )
            {
                this.getArray( key, function( result2 )
                {
                    cb( JSON.stringify( result2 ) );
                }.bind(this));
            }
            else
            {
                cb( result );
            }
        }.bind(this));
    },
    
    restore: function( key, val, cb )
    {
        var setVal = val;
        try { setVal = JSON.parse( setVal ); } catch (err){}
        
        this.set( key, setVal, cb );
    },
    
    getAllKeys: function( cb )
    {
        client.keys( "*", function( err, result )
        {
            cb( result );
        }.bind(this));
    },
    
    _log: function( str )
    {
        if ( this.verbose )
        {
            console.log( str );
        }
    },
    
    //stringifies most things, except strings of course
    _getSetValue: function( val )
    {
        return String( val );
    }
};