/*global module*/
/*global console*/

const coffee = require( "../models/coffee_model.js" );

module.exports =
{
    updateMessage: function( request, response )
    {
        if ( !request.query.message )
        {
            response.status(500).json( { success: false, error: "message is a required parameter." } );
        }
        else
        {
            coffee.updateMessage( request.query.message, function( error )
            {
                if ( error )
                {
                    response.status(500).json( { success: false, error: error } );
                }
                else
                {
                    response.status(200).json( { success: true } );
                }
            });
        }
    },
    
    scheduleCoffee: function( request, response )
    {
        if ( !request.query.channel )
        {
            response.status(500).json( { success: false, error: "channel is a required parameter." } );
        }
        else
        {
            const dryRun = request.query.dryRun === "true" || (!!request.query.dryRun && request.query.dryRun !== "false");
            coffee.scheduleCoffee( request.query.channel, dryRun, function( error )
            {
                if ( error )
                {
                    response.status(500).json( { success: false, error: error } );
                }
                else
                {
                    response.status(200).json( { success: true } );
                }
            });
        }
    },
    
    clearPairs: function( request, response )
    {
        coffee.clearPairs( function( error )
        {
            if ( error )
            {
                response.status(500).json( { success: false, error: error } );
            }
            else
            {
                response.status(200).json( { success: true } );
            }
        });
    }
};