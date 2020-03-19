/*global module*/
/*global console*/

const events = require('../events.js');

module.exports =
{
    fire: function( request, response )
    {
        if ( request.query.event )
        {
            events.fire( request.query.event, request.query.payload, function(error)
            {
                response.status(200).json( { success: !!error, error: error } );
            });
        }
        else
        {
            response.status(500).json( { success: false, error: "event is a required parameter." } );
        }
    },
};