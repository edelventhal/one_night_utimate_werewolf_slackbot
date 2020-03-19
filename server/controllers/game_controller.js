/*global module*/
/*global require*/

var database = require( "../database.js" );
var utility = require( "../utility/utility.js" );
var slack = require( "../utility/slackApi.js" );


var GameController = module.exports =
{
    create: function( request, response )
    {
        database.get( request.query.key, function( val )
        {
            response.status( 200 ).json( val );
        });
    }
};