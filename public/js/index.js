var index =
{
    addPlayer: function( gameTextId, userSelectId, outputDivId  )
    {
        const gameId = document.getElementById( gameTextId ).value;
        const userSelect = document.getElementById( userSelectId );
        const outputDiv = document.getElementById( outputDivId );
        server.addPlayer( gameId, userSelect.options[userSelect.selectedIndex].value, function()
        {
            outputDivId.innerHTML = "Done.";
        });
    },
    
    removePlayer: function( gameTextId, userSelectId, outputDivId  )
    {
        const gameId = document.getElementById( gameTextId ).value;
        const userSelect = document.getElementById( userSelectId );
        const outputDiv = document.getElementById( outputDivId );
        server.removePlayer( gameId, userSelect.options[userSelect.selectedIndex].value, function()
        {
            outputDivId.innerHTML = "Done.";
        });
    },
    
    printGameData: function( gameTextId, outputDivId )
    {
        const gameId = document.getElementById( gameTextId ).value;
        const outputDiv = document.getElementById( outputDivId );
        server.getGameData( gameId, function( data )
        {
            outputDiv.innerHTML = JSON.stringify(data);
        });
    },
    
    startNight: function( gameTextId, outputDivId )
    {
        const gameId = document.getElementById( gameTextId ).value;
        const outputDiv = document.getElementById( outputDivId );
        server.startNight( gameId, function()
        {
            outputDiv.innerHTML = "Done.";
        });
    },
    
    restartNight: function( gameTextId, outputDivId )
    {
        const gameId = document.getElementById( gameTextId ).value;
        const outputDiv = document.getElementById( outputDivId );
        server.restartNight( gameId, function()
        {
            outputDiv.innerHTML = "Done.";
        });
    },
    
    nextTurn: function( gameTextId, outputDivId )
    {
        const gameId = document.getElementById( gameTextId ).value;
        const outputDiv = document.getElementById( outputDivId );
        server.nextTurn( gameId, function()
        {
            outputDiv.innerHTML = "Done.";
        });
    }
};