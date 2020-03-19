var index =
{
    messageChanged: function( messageTextId, messageButtonId, currentMessage )
    {
        const messageText = document.getElementById( messageTextId );
        const messageButton = document.getElementById( messageButtonId );
        messageButton.disabled = messageText.value === currentMessage;
    },
    
    updateMessage: function( messageTextId )
    {
        const messageText = document.getElementById( messageTextId );
        server.updateMessage( messageText.value, this._showResult );
    },
    
    scheduleCoffee: function( channelSelectId, dryRunCheckboxId )
    {
        const channelSelect = document.getElementById( channelSelectId );
        const dryRunCheckbox = document.getElementById( dryRunCheckboxId );
        server.scheduleCoffee( channelSelect.options[channelSelect.selectedIndex].value, dryRunCheckbox.checked, this._showResult );
    },
    
    clearPairs: function()
    {
        const message = "This is a destructive action that will permanently erase all stored pairing data. Are you sure you want to do this?";
        if ( window.confirm( message ) )
        {
            server.clearPairs( this._showResult );
        }
    },
    
    _showResult: function( result )
    {
        var resultStr = result;
        if ( typeof(result) === 'object' )
        {
            resultStr = JSON.stringify( result );
        }
        document.getElementById('result').innerHTML = resultStr;
    }
};