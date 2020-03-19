/*global document*/
/*global confirm*/

var routeTester =
{
    resultsFrame: function()
    {
        return document.getElementById( "resultsFrame" );
    },
    
    urlField: function()
    {
        return document.getElementById( "urlField" );
    },
    
    goToRoute: function( route, params )
    {
        var url = route;
        
        var addedParam = false;
        
        var paramKey;
        for ( paramKey in params )
        {
            if ( !addedParam )
            {
                url += "?";
                addedParam = true;
            }
            else
            {
                url += "&";
            }
            
            url += paramKey + "=" + params[ paramKey ];
        }
        
        this.urlField().innerHTML = url;
        this.resultsFrame().src = url;
    },
    
    testRoute: function( route, fieldData, shouldShowWarning )
    {
        if ( !shouldShowWarning || confirm( "This is a destructive action. Are you sure you want to do this?" ) )
        {
            var params = {};
        
            var fieldIndex;
            for ( fieldIndex = 0; fieldIndex < fieldData.length; fieldIndex++ )
            {
                var field = fieldData[ fieldIndex ];
                var element = document.getElementById( field.htmlId );
                params[ field.key ] = element.value;
            }
        
            this.goToRoute( route, params );
        }
    }
};

var testRoute = routeTester.testRoute.bind(routeTester);