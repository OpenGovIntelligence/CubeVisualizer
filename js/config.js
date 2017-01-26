prop = {
    //TODO Change that to the actual API address
    'jsonqbAPIuri' : '***the actual JSON QB API implementation address***',

    //TODO Insert the actual data cube URI
    'dataCubeURI' : '***the actual Data Cube URI***'
};

//API Responses JSON KEYS
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

//Custom object keys
CKEYS = {
    'dimLabel' : 'dimLabel',
    'measObs' : 'measObs'
};


//The first dimension containing in its label one of these strings will be selected at start up
var preferredFreeDimensionString = ["time", "date"];

var allValues = {
    "@id"   : "All",
    "label" : "All"
};


uiConfig = {
    'msg_refreshDataError'          : "Please retry pressing the Refresh button",
    'msg_loadingError'              : "Some error occurred, please reload page.",
    'msg_wrongChart'                : "Please chose another type of chart",
    'footerSize'                    : 60,
    'colorOGI'                      : '#e44690',         //the opengovintelligence magenta
    'chartTypes'                    : ['Bar chart', 'Pie chart', 'Pie chart sorted', 'Area chart'],
    'chartTypeInitiallySelected'    : 0
};

timeFormats = [
    "%d-%m-%Y",
    "%Y-%m-%d",
    "%Y",               //Year with century as decimal
    "%H:%M"             //hours(00-23) minutes(00-59)
];

areaConfig = {
    'fillColor'                         : "steelblue",
    'populationToZoom_ratio'            : 10,   //approximately 10 points in max zoom
    'areaChartMinHeight'                : 300,
    'perLetterSpaceForYAxisLabels'      : 8,
    'topMargin'                         : 10,
    'rightMargin'                       : 30,
    'bottomMargin'                      : 30
};

barConfig = {
    'populationToZoom_ratio'            : 2,    //approximately 2 bars are shown when zoom is max
    'barChartMinHeight'                 : 300,
    'barColor'                          : uiConfig.colorOGI,        //or e.g. "steelblue",
    'perLetterSpaceForYAxisLabels'      : 8,
    'valueLabelFontSize'                : '11px',
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

pieConfig = {
    'marginLeft'            : 20,
    'marginRight'           : 20,
    'marginTop'             : 20,
    'marginBottom'          : 20,
    'pieChartMinimumHeight' : 300,
    'pieChartMinimumWidth'  : 300,   //excluding the legend
    'legendDefaultWidth'    : 100,
    'valueTextFontFamily'   : 'sans-serif',
    'valueTextFontSize'     : '12px',
    'valueTextFill'         : 'white',
    'legendTextFontFamily'  : 'sans-serif',
    'legendTextFontSize'    : '11px',
    'legendTextFill'        : 'dimgray',
    'legendColorRectHeight' : 13,
    'legendColorRectWidth'  : 18,
    'legendPerLabelHeight'  : 15
};
