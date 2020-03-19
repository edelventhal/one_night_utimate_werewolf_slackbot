/*global module*/
/*global require*/

var database = require( "../database.js" );
var utility = require( "../utility/utility.js" );

var WerewolfController = module.exports =
{
    get: function( request, response )
    {
        database.get( request.query.key, function( val )
        {
            response.status( 200 ).json( val );
        });
    }
};