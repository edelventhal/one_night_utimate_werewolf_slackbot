/*global module*/
/*global console*/
/*global require*/

var database = require( "../database.js" );
var slack = require( "../utility/slackApi.js" );
const HISTORY_KEY = "history";
const MESSAGE_KEY = "message";
const DEFAULT_MESSAGE = ":coffee:It's coffee time!:coffee2:\nThis week it's PRIMARY and SECONDARY!\n\nGo see Charley to get your gift card, then go get coffee and take a selfie! :parrot-coffee:";
const VALID_TIMEZONES = ["America/Los_Angeles"];
const USE_VALID_TIMEZONES = false;

//handles hanging onto global stuff
var CoffeeModel = module.exports =
{
    scheduleCoffee: function( channel, dryRun, cb )
    {
        database.get( HISTORY_KEY, function( historyString )
        {
            const pastData = historyString ? JSON.parse( historyString ) : { timesPaired: {}, pairs: {} };
            
            slack.getUsersList( function( error, userData )
            {
                if ( error || !userData.members )
                {
                    cb( "Failed to get users from Slack: " + JSON.stringify( userData ) );
                    return;
                }
                
                const userIds = [];
                let lowestCoffeeCount = -1;
                Object.keys( userData.members ).forEach( function( userKey )
                {
                    const user = userData.members[userKey];
                    if ( !user.deleted && !user.is_bot && !user.is_app_user
                        && user.name !== "slackbot" //why isn't slackbot a bot?
                        && ( !USE_VALID_TIMEZONES || VALID_TIMEZONES.indexOf( user.tz ) >= 0 ) )
                    {
                        userIds.push( user.id );
                        
                        //store the least number of times a user has had coffee
                        if ( lowestCoffeeCount < 0 || ( pastData.timesPaired[user.id] && pastData.timesPaired[user.id] < lowestCoffeeCount ) )
                        {
                            lowestCoffeeCount = pastData.timesPaired[user.id] || 0;
                        }
                    }
                });
                
                if ( userIds.length < 2 )
                {
                    cb( "There needs to be at least 2 users!" );
                    return;
                }
                
                //find the users that have had coffee the least number of times so we can choose one of them
                const lowestCountUsers = [];
                
                userIds.forEach( function( userId )
                {
                    if ( ( pastData.timesPaired[userId] || 0 ) <= lowestCoffeeCount )
                    {
                        lowestCountUsers.push( userId );
                    }
                });
                
                //now that we know which users have had coffee the least times, choose a user to have coffee
                const primaryUserIndex = Math.floor( Math.random() * lowestCountUsers.length );
                const primaryUserId = lowestCountUsers[primaryUserIndex];
                lowestCountUsers.splice( primaryUserIndex, 1 );
                
                //and then choose a partner for that user by finding the lowest pair count among them and other users
                const primaryPairs = pastData.pairs[primaryUserId] || {};
                let lowestPartnerCount = -1;
                userIds.forEach( function( userId )
                {
                    //store the least number of times a partner has had coffee with this user
                    if ( userId !== primaryUserId && ( lowestPartnerCount < 0 || ( ( primaryPairs[userId] || 0 ) < lowestCoffeeCount ) ) )
                    {
                        lowestPartnerCount = primaryPairs[userId] || 0;
                    }
                });
                
                const validPartners = [];
                userIds.forEach( function( userId )
                {
                    const pairCount = ( primaryPairs[userId] || 0 );
                    if ( userId !== primaryUserId && pairCount <= lowestPartnerCount )
                    {
                        validPartners.push( userId );
                    }
                });
                
                //finally, choose their partner
                const partnerUserId = validPartners[Math.floor( Math.random() * validPartners.length )];
                const partnerPairs = pastData.pairs[partnerUserId] || {};
                
                database.get( MESSAGE_KEY, function( message )
                {
                    message = message || DEFAULT_MESSAGE;
                    if ( !dryRun )
                    {
                        message = message.replace( /PRIMARY/g, `<@${primaryUserId}>` );
                        message = message.replace( /SECONDARY/g, `<@${partnerUserId}>` );
                    }
                    
                    //have the Slackbot post the pairs
                    slack.post( message, channel, function( error, payload )
                    {
                        if ( !error )
                        {
                            //update the data to be written to the DB
                            if ( !dryRun )
                            {
                                pastData.timesPaired[primaryUserId] = ( pastData.timesPaired[primaryUserId] || 0 ) + 1;
                                pastData.timesPaired[partnerUserId] = ( pastData.timesPaired[partnerUserId] || 0 ) + 1;
                                pastData.pairs[primaryUserId] = ( primaryPairs[partnerUserId] || 0 ) + 1;
                                pastData.pairs[partnerUserId] = ( partnerPairs[primaryUserId] || 0 ) + 1;
                            }

                            //write the result to the db
                            database.set( HISTORY_KEY, JSON.stringify( pastData ), function( dbSuccess )
                            {
                                if ( !dbSuccess )
                                {
                                    cb( "Failed to write to database." );
                                }
                                else
                                {
                                    cb();
                                }
                            });
                        }
                        else
                        {
                            cb( error );
                        }
                    });
                });
            });
        });
    },
    
    updateMessage: function( newMessage, cb )
    {
        database.set( MESSAGE_KEY, newMessage || DEFAULT_MESSAGE, function( success )
        {
            if ( !success )
            {
                cb( "Failed to write to database." );
            }
            else
            {
                cb();
            }
        });
    },
    
    clearPairs: function( cb )
    {
        database.set( HISTORY_KEY, JSON.stringify( { timesPaired: {}, pairs: {} } ), function( success )
        {
            if ( !success )
            {
                cb( "Failed to write to database." );
            }
            else
            {
                cb();
            }
        });
    },
    
    getMessage: function( cb )
    {
        database.get( MESSAGE_KEY, function( message )
        {
            cb( message || DEFAULT_MESSAGE );
        });
    }
};