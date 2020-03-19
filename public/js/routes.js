/*global document*/
/*global JSON*/
/*global testRoute*/

var routes =
{
    "test/myRoute": { color: "#33cc33", backgroundColor: "#99ff99" },
    "test/timeout": { color: "#cc3333", backgroundColor: "#ff9999", showWarning: true },
    "test/useParameter": { params: [ "id" ] },
    "test/sub/myRoute": { color: "#33cc33", backgroundColor: "#99ff99" },
    "database/get" : { params: [ "key" ] },
    "database/set" : { params: [ "key", "value" ], color: "#cc3333", backgroundColor: "#ff9999", showWarning: true },
    "database/clear" : { params: [], color: "#cc3333", backgroundColor: "#ff9999", showWarning: true },
    "database/dump": { params: [] },
    "database/restore": { params: [ "dump" ], color: "#cc3333", backgroundColor: "#ff9999", showWarning: true }
};

var addFields = function()
{
    var routeFields = document.getElementById( "routeFields" );
    
    var htmlString = "";
    
    var getRouteData = function( routeKey, routeData )
    {
        var colorStr = routeData.color ? " color: " + routeData.color + ";" : "";
        var inputColorStr = routeData.backgroundColor ? " style='background-color: " + routeData.backgroundColor + "'" : "";
        
        var str = "<span style='font-weight: bold;" + colorStr + "'>" + routeKey + "</span> ";
        var params = [];
        
        var fields = routeData.params || [];
        var fieldIndex;
        for ( fieldIndex = 0; fieldIndex < fields.length; fieldIndex++ )
        {
            var inputId = routeKey + "." + fields[ fieldIndex ];
            str += fields[ fieldIndex ] + ": <input id='" + inputId + "'" + inputColorStr + "> ";
            params.push( { key: fields[ fieldIndex ], htmlId: inputId } );
        }
        
        str += "<input type='button' value='Send' id='submit-" + routeKey + "'" + inputColorStr + "><br />";
        
        return { html: str, func: testRoute.bind( this, routeKey, params, routeData.showWarning ) }; 
    };
    
    var funcs = {};
    
    var routeKey;
    for ( routeKey in routes )
    {
        var routeData = getRouteData( routeKey, routes[ routeKey ] );
        htmlString +=  routeData.html + "\n";
        
        funcs[ routeKey ] = routeData.func;
    }
    
    routeFields.innerHTML = htmlString;
    
    for ( routeKey in routes )
    {
        document.getElementById( "submit-" + routeKey ).onclick = funcs[ routeKey ];
    }
};