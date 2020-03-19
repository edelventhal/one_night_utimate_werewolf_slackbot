/*global module*/
/*global require*/

var database = require( "../database.js" );
var utility = require( "../utility/utility.js" );

//Useful for directly testing the database. Use with caution! Should delete / make private before going live.
var DatabaseController = module.exports =
{
    get: function( request, response )
    {
        database.get( request.query.key, function( val )
        {
            response.status( 200 ).json( val );
        });
    },
    
    set: function( request, response )
    {
        database.set( request.query.key, request.query.value, function( success )
        {
            response.status( success ? 200 : 500 ).json( { success: success } );
        });
    },
    
    clear: function( request, response )
    {
        database.delAll( function( success )
        {
            response.status( success ? 200 : 500 ).json( { success: success } );
        });
    },
    
    dump: function( request, response )
    {
        utility.getDatabaseDump( function( result )
        {
            response.status( 200 ).json( result );
        });
    },
    
    restore: function( request, response )
    {
        utility.restoreDatabaseFromDump( request.query.dump, function( success )
        {
            response.status( 200 ).json( { success: success } );
        });
    }
};