/*coffee require*/
/*coffee module*/
/*coffee console*/
/*coffee process*/

//endpoints for all scheduled events
//this should just be combined with schedule_controller probably

const coffee = require( "./models/coffee_model.js" );

var Events = module.exports =
{
    fire: function( event, payload, cb )
    {
        if ( this.events[event] )
        {
            this.events[event]( payload, cb );
        }
        else
        {
            cb( "There is no event for the key: '" + event + "'." );
        }
    },
    
    events:
    {
        pairUsers: function( payload, cb )
        {
            coffee.scheduleCoffee( payload, false, cb );
        }
    }
}