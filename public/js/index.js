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
    
    startGame: function( gameTextId, outputDivId )
    {
        const gameId = document.getElementById( gameTextId ).value;
        const outputDiv = document.getElementById( outputDivId );
        server.startGame( gameId, function()
        {
            outputDiv.innerHTML = "Done.";
        });
    },
    
    restartGame: function( gameTextId, outputDivId )
    {
        const gameId = document.getElementById( gameTextId ).value;
        const outputDiv = document.getElementById( outputDivId );
        server.restartGame( gameId, function()
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