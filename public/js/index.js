var index =
{
    addPlayer: function( gameTextId, userSelectId )
    {
        const gameId = document.getElementById( gameTextId ).value;
        const userSelect = document.getElementById( userSelectId );
        server.addPlayer( gameId, userSelect.options[userSelect.selectedIndex].value, function(){} );
    },
    
    removePlayer: function( gameTextId, userSelectId )
    {
        const gameId = document.getElementById( gameTextId ).value;
        const userSelect = document.getElementById( userSelectId );
        server.removePlayer( gameId, userSelect.options[userSelect.selectedIndex].value, function(){} );
    }
};