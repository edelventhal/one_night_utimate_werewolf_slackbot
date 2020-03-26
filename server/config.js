var Config = module.exports =
{
    GamePhase:
    {
        WaitingForPlayers: 0,
        Night: 1,
        Day: 2,
        Finished: 3,
    },
    
    NightPhaseList:
    [
        "doppelganger", //0
        "werewolf", //1
        "minion", //2
        "mason", //3
        "seer", //4
        "robber", //5
        "troublemaker", //6
        "drunk", //7
        "insomniac", //8
        "doppelganger-insomniac" //9, edge case
    ],
    
    NightPhase:
    {
        //will be created as a lookup enum using the array above
    },
    
    RoleList:
    [
        //all roles in the night NightPhaseList will be dynamically added
        //only need to manually add roles that do nothing at night
        "villager",
        "tanner",
        "hunter"
    ],
    
    Role:
    {
        //will be created dynamically to match the NightPhases
    },
    
    RoleCounts:
    {
        "doppelganger": 1,
        "werewolf": 2,
        "minion": 1,
        "mason": 2,
        "seer": 1,
        "robber": 1,
        "troublemaker": 1,
        "drunk": 1,
        "insomniac": 1,
        "villager": 3,
        "tanner": 1,
        "hunter": 1
    },
    
    //for the purpose of this Slackbot, which roles are active and require user input?
    ActiveNightRoles:
    {
        "doppelganger": true,
        "seer": true,
        "robber": true,
        "troublemaker": true,
        "drunk": true,
        "insomniac": true
    },
    
    //driven by the game design
    minimumPlayerCount: 3,
    maximumPlayerCount: 10,
    
    ChatApp:
    {
        Slack: "slack",
        Discord: "discord"
    }
};

//create the NightPhase enum and fill the RoleList
Config.NightPhaseList.forEach( ( role, order ) =>
{
    Config.NightPhase[role] = order;
    
    //don't add a role for this, it's an edge case and not a real role
    if ( role !== "doppelganger-insomniac" )
    {
        Config.RoleList.splice( order, 0, role );
    }
});

//create the Role enum
Config.RoleList.forEach( ( role, order ) =>
{
    Config.Role[role] = order;
});