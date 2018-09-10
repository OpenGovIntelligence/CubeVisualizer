prop = {
    //TODO Change that to the actual API address
    'jsonqbAPIuri' : 'http://losd.staging.derilinx.com:8082/',

    //TODO Insert the actual data cube URI
    // 'dataCubeURI' : 'http://ld.linked-open-statistics.org/data/HC55_ds';

    'dataCubeURI' : getParameterByName('dataCubeURI')
};

//Api Responses Json Keys
ARJK = {
    'measures'          : 'measures',
    'id'                : '@id',
    'label'             : 'label',
    'dimensions'        : 'dimensions',
    'values'            : 'values',
    'dimension'         : 'dimension',
    'observations'      : 'observations',
    'structure'         : 'structure',
    'dimension_values'  : 'dimension_values',
    'headers'           : 'headers',
    'rows'              : 'rows',
    'data'              : 'data',
    'description'       : 'description',
    'comment'           : 'comment',
    'issued'            : 'issued',
    'modified'          : 'modified',
    'license'           : 'license'
};

//Custom object KEYS
CKEYS = {
    'dimLabel' : 'dimLabel',
    'measObs' : 'measObs'
};

//The first dimension containing in its label one of these strings will be selected at start up
var preferredFreeDimensionString = ["time", "date"];

//this is inserted as the first element of a dimension values array
//signifies the need for an aggregated cube
var allValues = {
    "@id"   : "All",
    "label" : "All"
};

//user interface configuration object
uiConfig = {
    'msg_refreshDataError'          : "Please retry pressing the Refresh button",
    'msg_loadingError'              : "Some error occurred, please reload page.",
    'msg_wrongChart'                : "Please chose another type of chart",
    'footerSize'                    : 40,
    'colorOGI'                      : '#1F4A86',         //the cso colour scheme
    'chartTypes'                    : ['Bar chart', 'Pie chart', 'Pie chart sorted', 'Area chart'],
    'chartTypeInitiallySelected'    : 0
};

//TODO - replace the following array with context aware code (e.g. format suggested by API per free dimension)
//various possible time formats
timeFormats = [
    "%d-%m-%Y",
    "%Y-%m-%d",
    "%Y",               //Year with century as decimal
    "%H:%M"             //hours(00-23) minutes(00-59)
];

//area chart configuration object
areaConfig = {
    'fillColor'                         : "steelblue",
    'dataCircleColor'                   : "DarkSlateBlue",
    'axisLabelColor'                    : 'dimgray',
    'populationToZoom_ratio'            : 10,   //approximately 10 points in max zoom
    'areaChartMinHeight'                : 300,
    'perLetterSpaceForYAxisLabels'      : 8,
    'topMargin'                         : 40,   //40 so that tooltips have enough space
    'rightMargin'                       : 30,
    'bottomMargin'                      : 30,
    'dataCircleRadius'                  : 3,
    'tooltipFontSize'                   : 11,
    'tooltipAnchor'                     : 'middle',
    'tooltipFontFamily'                 : 'sans-serif',
    'tooltipValueColor'                 : 'black',
    'tooltipLabelColor'                 : 'gray',
    'tooltipLabelExtraText'             : ' :',
    'tooltipLabelYOffset'               : -22,
    'tooltipLineHeight'                 : '1.2em',
    'tooltipBackgroundColor'            : 'white',
    'tooltipBackgroundStrokeColor'      : 'lightGray',
    'tooltipBackgroundMargin'           : 3,
    'tooltipBackgroundMarginYOffset'    : -20
};

//bar chart configuration object
barConfig = {
    'populationToZoom_ratio'            : 2,    //approximately 2 bars are shown when zoom is max
    'barChartMinHeight'                 : 300,
    'barColor'                          : uiConfig.colorOGI,        //or e.g. "steelblue",
    'perLetterSpaceForYAxisLabels'      : 8,
    'valueLabelFontSize'                : '14px',
    'valueLabelFontColor'               : "white",
    'valueLabelFontColor_whenExternal'  : "gray",
    'valueLabelYTransformation'         : 14,
    'minimumXBandwidthForLabels'        : 10,
    'axisLabelColor'                    : 'dimgray',
    'xLabelLengthTresholdForRotation'   : 15,
    'xLabelRotationDegrees'             : -15,
    'xRotatedLabel_dx'                  : "0em",
    'xRotatedLabel_dy'                  : ".5em",
    'topMargin'                         : 10,
    'rightMargin'                       : 30,
    'bottomMarginDefault'               : 30,
    'bottomMarginMax'                   : 100
};

//pie chart configuration object
pieConfig = {
    'marginLeft'                        : 10,
    'marginRight'                       : 10,
    'marginTop'                         : 10,
    'marginBottom'                      : 10,
    'pieChartMinimumHeight'             : 300,
    //'pieChartMinimumWidth'            : 300,   //in Pie Chart width is dynamically set
    'valueTextFontFamily'               : 'sans-serif',
    'valueTextFontSize'                 : '12px',
    'valueTextFill'                     : 'white',
    'valueTextHighlightColor'           : 'yellow',
    'legendTextFontFamily'              : 'sans-serif',
    'legendTextFontSize'                : '11px',
    'legendTextFill'                    : 'dimgray',
    'legendColorRectHeight'             : 13,
    'legendColorRectWidth'              : 18,
    'legendPerLabelHeight'              : 15,
    'pieAreaHighlightColor'             : 'dimgrey'
};

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}