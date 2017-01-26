
var _metadata = null;                   //will hold the dataset's metadata
var _measures = null;                   //API results for measures (object)
var _measureSelected = null;            //will hold the index of the selected measure
var _dimensions = null;                 //API results for dimensions (object)
var _freeDimension = null;              //will hold the index of the selected free dimension (for x axis)
var _dimensionsValues = [];             //API results for dimension values (Array: one row for each dimension)
var _dimensionsValueSelected = null;    //will hold an array with the selected value per dimension [dim idx]=value idx

var _observations = [];                 //will hold an array of observations with {label, value} pairs

var _ui = {                             //will hold ui related switches and selections
  'selectedChartType' : uiConfig.chartTypeInitiallySelected
};


var _dataLoaded = false;                //will be true only when there is any available data

//On load page
$(function(){

    configStaticUI();

    $.when(getMeasures(prop.dataCubeURI), getDimensions(prop.dataCubeURI), getMetadata(prop.dataCubeURI))
        .done (function() {
            configUI_Title_Meas_Dim();
            //Load Dimension Values after we've got the dimensions first
            getDimensionValues(prop.dataCubeURI, _dimensions)
                .done(function(){
                    configUI_DimsValues();
                    //populate & make chart selector visible
                    configChartSelector();
                    //load data and visualize
                    refreshData();
                })
                .fail(function(){
                    showErrorMessage(uiConfig.msg_loadingError);
                });
        })
        .fail(function(){
            showErrorMessage(uiConfig.msg_loadingError);
        });

});

//----------- helper UI functions -----------------
//Enables spinner (loader)
function spinnerOn() {
    if (!($("#loader").hasClass("spinning"))) {
        $("#loader").addClass("spinning");
    }
}

//Disables spinner (loader)
function spinnerOff() {
    $("#loader").removeClass("spinning");
}

//Shows error message
function showErrorMessage(msg) {
    $("#errorMessage").append("p")
        .text(msg)
}

//Removes error message
function removeErrorMessage() {
    $("#errorMessage").empty();
}

//Re-gets data from the API
function refreshData() {
    //disable the button (to prevent multiple calls)
    $("#refreshButton").attr("disabled", "disabled");
    //during loading disable all the input elements
    disableUserInputElements();

    removeErrorMessage(); // remove if any
    spinnerOn();

    getAggregatedCubeURI(prop.dataCubeURI)
        .then(function(aggCubeURI){
            getTableRow(aggCubeURI)
                .then(function(){
                    //set the flag ("there is data")
                    _dataLoaded = true;
                    //create an appropriate visualization for the data
                    createVisualization();
                })
                .fail(function() {
                    showErrorMessage(uiConfig.msg_refreshDataError);
                    //Make the refresh button enabled
                    $("#refreshButton").removeAttr("disabled");
                })
                .always(function() {
                    spinnerOff();
                    enableUserInputElements();
                });
        })
        .fail(function(){
            spinnerOff();
            enableUserInputElements();
            showErrorMessage(uiConfig.msg_refreshDataError);
            //Make the refresh button enabled
            $("#refreshButton").removeAttr("disabled");
        });

}

function disableUserInputElements() {
    $("#measureSelection").attr("disabled", "disabled");
    $("#freeDimensionSelection").attr("disabled", "disabled");
    $("#chartTypeSelection").attr("disabled", "disabled");

    for (var d=0; d < _dimensions[ARJK.dimensions].length; d++) {
        $("#dimValueSelection"+d).attr("disabled", "disabled");
    }
}

function enableUserInputElements() {
    $("#measureSelection").removeAttr("disabled");
    $("#freeDimensionSelection").removeAttr("disabled");
    $("#chartTypeSelection").removeAttr("disabled");

    for (var d=0; d < _dimensions[ARJK.dimensions].length; d++) {
        $("#dimValueSelection"+d).removeAttr("disabled");
    }
}

function configStaticUI() {
    //Enable the spinner
    spinnerOn();
    //Make the refresh button disabled
    $("#refreshButton").attr("disabled", "disabled");
    //Hide the refresh button
    $("#refreshButton").addClass("hidden");
    //add the function to be called on click
    $("#refreshButton").on("click", refreshData);

}


//updates the top bar with the measure and dimension selection
function configUI_Title_Meas_Dim(){

    //Set the navbar Title
    $("#navbarTitle").append(_metadata[ARJK.label]);
    //Set the browser's tab title
    $("#tabTitle").append(_metadata[ARJK.label]);

    //if there is no measured selected yet > default = 0
    if (_measureSelected === null) {
        _measureSelected = 0;
    }

    $("#measureSelection").empty();
    d3.select("#measureSelection")
        .attr('disabled', 'disabled')       //initially disabled (until first automatic refresh)
        .on("change", function() {
            _measureSelected = $('#measureSelection').prop('selectedIndex');
            console.log(_measureSelected);
            //Make the refresh button enabled
            $("#refreshButton").removeAttr("disabled");
        })
        .selectAll("option")
        .data(_measures[ARJK.measures])
        .enter()
        .append("option")
        .text(function (d) {return d[ARJK.label];})
        .attr("value", function (d) { return d[ARJK.id]; });

    //set the selected option
    $('#measureSelection').val(_measures[ARJK.measures][_measureSelected][ARJK.id]);

    //find the dimension that contains a preferred "time" as a first choice otherwise 0
    if (_freeDimension === null) {
        _freeDimension = 0; //default selection
        //Search for the preferred dimension string
        for (var j=0; j < _dimensions[ARJK.dimensions].length; j++) {
            var label = _dimensions[ARJK.dimensions][j][ARJK.label];
            label = label.toString().toLowerCase();
            for (var k=0; k < preferredFreeDimensionString.length; k++) {
                if (label.indexOf(preferredFreeDimensionString[k]) !== -1) {
                    _freeDimension = j;
                }
            }
        }
    }

    $("#freeDimensionSelection").empty();
    d3.select("#freeDimensionSelection")
        .attr('disabled', 'disabled')       //initially disabled (until first automatic refresh)
        .on("change", function() {
            _freeDimension = $('#freeDimensionSelection').prop('selectedIndex');
            //redraw dim value fields
            dimValueSelectorsVisibility();
            //Make the refresh button enabled
            $("#refreshButton").removeAttr("disabled");
        })
        .selectAll("option")
        .data(_dimensions[ARJK.dimensions])
        .enter()
        .append("option")
        .text(function (d) {return d[ARJK.label];})
        .attr("value", function (d) { return d[ARJK.id]; });

    //set the selected option
    $('#freeDimensionSelection').val(_dimensions[ARJK.dimensions][_freeDimension][ARJK.id]);
}

//updates the side bar with the dimension values selection
function configUI_DimsValues() {

    //Finally disable the spinner
    spinnerOff();
    
    $("#dimensionValuesSelections").empty();

    //check if this is the first time
    var firstTime = false;
    if (_dimensionsValueSelected === null) {
        _dimensionsValueSelected = [];
        firstTime = true;
    }

    for (var d=0; d < _dimensions[ARJK.dimensions].length; d++) {
        //if first time > default values to selected values in each dimension (0 index)
        if (firstTime) {
            _dimensionsValueSelected[d] = 0;
        }
        var element =  d3.select("#dimensionValuesSelections");

        element.append("br")
            .attr("id", "dimValueSelection"+d+"_br");

        element.append("label")
            .attr("for", "dimValueSelection"+d)
            .attr("id", "dimValueSelection"+d+"_label")
            .text(_dimensionsValues[d][ARJK.dimension][ARJK.label])
            .attr("value", [ARJK.dimension][ARJK.id]);

        element.append("select")
            .attr("class", "form-control")
            .attr('disabled', 'disabled')   //initially disabled (until first automatic refresh)
            .attr("id", "dimValueSelection"+d)
            .attr("data-index", ""+d)       //custom attribute for easy retrieval of dim. value selector index
            .on("change", function() {
                //get the index of this selector to use it for the dim selected values array
                var dimNo = parseInt(d3.select(this).attr("data-index"));
                _dimensionsValueSelected[dimNo] = d3.select(this).property("selectedIndex");
                //enable the refresh button
                $("#refreshButton").removeAttr("disabled");
            });

        d3.select("#dimValueSelection"+d)
            .selectAll("option")
            .data(_dimensionsValues[d][ARJK.values])
            .enter()
            .append("option")
            .text(function (data) {return data[ARJK.label];})
            .attr("value", function (data) { return data[ARJK.id]; });

    }
    dimValueSelectorsVisibility();
    //
    $("#refreshButton").removeClass("hidden");
}


function configChartSelector() {
    $("#chartTypeSelection").empty();
    d3.select("#chartTypeSelection")
        .on("change", function() {
            //get the index of the selection from the drop down
            _ui.selectedChartType = $('#chartTypeSelection').prop('selectedIndex');
            if (_dataLoaded) {              //only if data is loaded
                createVisualization();      //on change > create immediately new chart (no data reloading needed)
            }
        })
        .selectAll("option")
        .data(uiConfig.chartTypes)
        .enter()
        .append("option")
        .text(function (d) {return d;});

    $('#chartTypeGroup').removeClass('hidden');
}

//hides the selector for the dimension that is used as an axis (free dimension)
function dimValueSelectorsVisibility() {
    for (var d=0; d < _dimensions[ARJK.dimensions].length; d++) {
        $("#dimValueSelection"+d+"_label").removeClass("hidden");
        $("#dimValueSelection"+d+"_br").removeClass("hidden");
        $("#dimValueSelection"+d).removeClass("hidden");
        //remove from view the dimension that is used for x axis
        if (d === _freeDimension) {
            $("#dimValueSelection"+d+"_label").addClass("hidden");
            $("#dimValueSelection"+d+"_br").addClass("hidden");
            $("#dimValueSelection"+d).addClass("hidden");
        }
    }
}

//D3 visualization functions ---------------------------------------------------------------
function createVisualization() {
    //TODO check FreeDimension name, values etc to specify which visualization is appropriate
    switch (_ui.selectedChartType) {
        case 0:
            createBarChartOrdinalX();
            break;
        case 1:
            createPieChart(false);
            break;
        case 2:
            createPieChart(true);
            break;
        case 3:
            //The following code looks at the first dim value for time format compliance
            var validDimension = false;
            var sampleDimValue = _observations[0][CKEYS.dimLabel];
            for (var k=0; k<timeFormats.length; k++) {
                if (d3.timeParse(timeFormats[k])(sampleDimValue)) {
                    validDimension = true;
                    createAreaChartLinearX(timeFormats[k]);
                    break;
                }
            }
            if (!validDimension) {
                graphAlarm(uiConfig.msg_wrongChart);
            }
            break;
        default:
            createBarChartOrdinalX();
            break;
    }
}

//clears the graph and presents an alarm in the graph area
function graphAlarm(alarmText) {
    $("#graph").empty();
    d3.select("#graph")
        .append("p")
        .attr('class', 'graphAlarm')
        .text(alarmText);
}

function createAreaChartLinearX(timeFormatString) {
    //clear the graph
    $("#graph").empty();

    //------------------------------------------------------------------------------
    //calculate left margin according to max number of digits of y axis labels
    var maxVal = d3.max(_observations, function(d) { return parseFloat(d[CKEYS.measObs]); });
    maxVal = parseInt(maxVal);
    var maxValLength = maxVal.toString().length;
    var leftMargin = areaConfig.perLetterSpaceForYAxisLabels * maxValLength + 10; //10 + 8px per character

    //------------------------------------------------------------------------------
    //find the min value
    var minVal = d3.min(_observations, function(d) { return parseFloat(d[CKEYS.measObs]); });
    if (minVal > 0) minVal = 0; //so that the graph is not biased

    //if all values are 0, we increase the maxValue and so the scale is valid and axis has a 0 label
    if (minVal === 0 && maxVal === 0) maxVal = 10;

    //------------------------------------------------------------------------------
    var margin = {
        'top'   : areaConfig.topMargin,
        'right' : areaConfig.rightMargin,
        'bottom': areaConfig.bottomMargin,
        'left'  : leftMargin
    };

    //get the #graph div's width
    var width = $('#graph').width() - margin.left - margin.right;

    //find the current browser window height (depends on zoom scale!)
    //and subtract the top of the graph element (dynamic) and also subtract the height of the footer (if any)
    //also subtract the two margins that are gonna be added later to the svg
    var innerWindowHeight = $(window).height();
    var graphTop = $("#graph").position().top;
    var height = innerWindowHeight - graphTop - uiConfig.footerSize - margin.top - margin.bottom;
    //in case it is small or negative (eg mobile phone > of screen) retain a minimum height
    if (height < areaConfig.areaChartMinHeight) {
        height = areaConfig.areaChartMinHeight;
    }

    //returns a function that parses dates
    var parseDate = d3.timeParse(timeFormatString);

    //test the parser
    //Re-enable next piece of code in order to check all dim values for being compliant with time format
    /*
    for (var i=0; i<_observations.length; i++) {
        if (!parseDate(_observations[i][CKEYS.dimLabel])) {
console.log("Error time parser");
            graphAlarm(uiConfig.msg_wrongChart);
            return;
        }
    }
    */

    //lineObservations will be used as data for the chart
    var lineObservations = _observations.map(function(d) {
        var obs = {};
        obs['time'] = parseDate(d[CKEYS.dimLabel]);      //parse the date
        obs['value'] = +d[CKEYS.measObs];
        return obs;
    });

    //sort array (otherwise time scale is not working correctly)
    lineObservations.sort(function(a,b){
            return new Date(b['time']) - new Date(a['time']);
    });

    var svg = d3.select("#graph")
        .classed("bgr_vlgray", true)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top +margin.bottom);

    //create the clipping path (mask) for the bars and labels
    svg.append("defs").append("clipPath")
        .attr("id", "clipLine")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    //Create scale functions
    var xScale = d3.scaleTime()
        .domain(d3.extent(lineObservations, function(d){
            return d['time'];
        }))
        .range([0 , width ]);

    var yScale = d3.scaleLinear()
        .domain([minVal, maxVal])
        .range([height, 0]);

    //calculate the max zoom according to the observations population
    var maxZoom = _observations.length / areaConfig.populationToZoom_ratio;

    var zoom = d3.zoom()
        .scaleExtent([1,maxZoom])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", lineZoomed);


    var area = d3.area()
        .x(function(d) { return xScale(d['time']); })
        .y0(height)
        .y1(function(d) { return yScale(d['value']); });

    var yAxis = d3.axisLeft()
        .scale(yScale);

    var xAxis = d3.axisBottom()
        .scale(xScale);

    //create a group
    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    g.append("path")
        .datum(lineObservations)
        .attr("class", "area")
        .attr("fill", areaConfig.fillColor)
        .attr("clip-path", "url(#clipLine)")
        .attr("d", area);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    g.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);

    svg.call(zoom);

    function lineZoomed() {
        var t = d3.event.transform;
        var xt = t.rescaleX(xScale);
        g.select(".area").attr("d", area.x(function(d) { return xt(d['time']); }));
        g.select(".axis--x").call(xAxis.scale(xt));
    }
}

function createBarChartOrdinalX() {

    //clear the graph
    $("#graph").empty();

    //------------------------------------------------------------------------------
    //calculate left margin according to max number of digits of y axis labels
    var maxVal = d3.max(_observations, function(d) { return parseFloat(d[CKEYS.measObs]); });
    maxVal = parseInt(maxVal);
    var maxValLength = maxVal.toString().length;
    var leftMargin =barConfig.perLetterSpaceForYAxisLabels * maxValLength + 10; //10 + 8px per character

    //------------------------------------------------------------------------------
    //find the min value
    var minVal = d3.min(_observations, function(d) { return parseFloat(d[CKEYS.measObs]); });
    if (minVal > 0) minVal = 0; //so that the graph is not biased

    //if all values are 0, we increase the maxValue and so the scale is valid and axis has a 0 label
    if (minVal === 0 && maxVal === 0) maxVal = 10;

    //------------------------------------------------------------------------------
    var margin = {};
    //find the max x axis label's length
    var maxXaxisLabelLength = d3.max(_observations, function(d) {return (d[CKEYS.dimLabel].length)});

    //if length > treshold, create a test svg with rotated text (like those in x-axis) and measure its height
    //from that change the bottom margin so that it can fit
    var rotateXaxisLabels = false;          //a flag that if true will make the x axis labels rotated

    //Check that the length of x labels are larger than threshold
    //If yes create a dummy axis with rotated labels and measure its height > set this as bottom margin
    if (maxXaxisLabelLength > barConfig.xLabelLengthTresholdForRotation) {
        rotateXaxisLabels = true;

        var testText = "";
        //create a dummy string with equal length as the 'maxXaxisLabelLength'
        for (var c = 0; c < maxXaxisLabelLength ; c++) {
            testText += "W";
        }

        var tempXScale = d3.scaleBand()
        //pass as the domain: an array with the labels
            .domain(_observations.map(function(d) { return d[CKEYS.dimLabel]; }))
            .range([0 , 500 ]);        //arbitrary width

        //create a temp axis
        var tempXAxis = d3.axisBottom()
            .scale(tempXScale);

        d3.select("#scratchSpace")
            .append("svg")
            .attr("class", "axis  testText") //axis: so that the format is the same, hidden: so that is invisible
            .call(tempXAxis)
            .selectAll(".tick")
            .selectAll("text")
            .attr("fill", barConfig.axisLabelColor)
            .style("text-anchor", "end")
            .attr("dx", barConfig.xRotatedLabel_dx)
            .attr("dy", barConfig.xRotatedLabel_dy)
            .attr("transform", function(d) {
                return "rotate(" + barConfig.xLabelRotationDegrees + ")";
            });
        //calculate the height of the temporary axis
        var xAxisHeight = d3.select(".testText").node().getBBox().height;
        //clear the element
        $("#scratchSpace").empty();

        //clamp the height to the max allowed (see config)
        if (xAxisHeight > barConfig.bottomMarginMax) {xAxisHeight = barConfig.bottomMarginMax;}
        margin = {
            'top': barConfig.topMargin,
            'right': barConfig.rightMargin,
            'bottom': xAxisHeight,
            'left': leftMargin
        };

    } else {
        rotateXaxisLabels = false;
        //set the margins (bottom is default, because labels are not going to be rotated
        margin = {
            'top': barConfig.topMargin,
            'right': barConfig.rightMargin,
            'bottom': barConfig.bottomMarginDefault,
            'left': leftMargin
        };
    }

    //------------------------------------------------------------------------------
    //get the #graph div's width
    var width = $('#graph').width() - margin.left - margin.right;

    //find the current browser window height (depends on zoom scale!)
    //and subtract the top of the graph element (dynamic) and also subtract the height of the footer (if any)
    //also subtract the two margins that are gonna be added later to the svg
    var innerWindowHeight = $(window).height();
    var graphTop = $("#graph").position().top;
    var height = innerWindowHeight - graphTop - uiConfig.footerSize - margin.top - margin.bottom;
    //in case it is small or negative (eg mobile phone > of screen) retain a minimum height
    if (height < barConfig.barChartMinHeight) {
        height = barConfig.barChartMinHeight;
    }

    var svg = d3.select("#graph")
        .classed("bgr_vlgray", true)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top +margin.bottom);


    //Create scale functions
    var xScale = d3.scaleBand()
        //pass as the domain: an array with the labels
        .domain(_observations.map(function(d) { return d[CKEYS.dimLabel]; }))
        .range([0 , width ])
        .paddingInner(0.05);        //the distance between bars (internally) - as a percentage ?


    var yScale = d3.scaleLinear()
        .domain([minVal, maxVal])
        .range([height - 1, 0]);    //height-1 so that value 0 is just a thin line

    //calculate the max zoom according to the observations population
    var maxZoom = _observations.length / barConfig.populationToZoom_ratio;
    var zoom = d3.zoom()
        .scaleExtent([1,maxZoom])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    var yAxis = d3.axisLeft()
        .scale(yScale);

    var xAxis = d3.axisBottom()
        .scale(xScale);

    //create the clipping path (mask) for the bars and labels
    svg.append("defs").append("clipPath")
        .attr("id", "clipBars")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    //create the clipping path (mask) for the x axis
    //x axis is just bellow the bars clipping mask, so needs a specific clipping mask (longer in y dim)
    svg.append("defs").append("clipPath")
        .attr("id", "clipXAxis")
        .append("rect")
        .attr("width", width)
        .attr("height", height + margin.top + margin.bottom);


    var gb = svg.append("g")                    //g will hold the bars
        .attr("id", "barGroup")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("clip-path", "url(#clipBars)");   // apply the clip path

    var gl = svg.append("g")                    //g will hold the value labels
        .attr("id", "labelGroup")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("clip-path", "url(#clipBars)");   // apply the clip path

    var ga = svg.append("g")                    //g2 will hold the x and y axis
        .attr("id", "axesGroup")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Depending on the bars width, this boolean will be used to hide value and x-axis labels
    var hide = (xScale.bandwidth() < barConfig.minimumXBandwidthForLabels);

    //Create bars
    gb.selectAll("rect")
        .data(_observations)
        .enter()
        .append("rect")
        .attr("x", function(d, i) {
            return xScale(d[CKEYS.dimLabel]);
        })
        .attr("y", function(d) {
            return yScale(d[CKEYS.measObs]);
        })
        .attr("width", xScale.bandwidth())
        .attr("height", function(d) {
            return height - yScale(d[CKEYS.measObs]);
        })
        .attr("fill", function(d) {
            return barConfig.barColor;
        });

    //the class valueLabel is important in order to distinguish these text(s) with the ones created
    //automatically inside the axis
    gl.selectAll("text.valueLabel")
        .data(_observations)
        .enter()
        .append("text")
        .text(function(d) {
            return d[CKEYS.measObs];
        })
        .attr("class", "valueLabel")
        .attr("x", function(d) {
            return xScale(d[CKEYS.dimLabel]) + xScale.bandwidth() / 2 ; //centering the text
        })
        .attr("y", function(d) {
            var y = yScale(d[CKEYS.measObs]) + barConfig.valueLabelYTransformation;
            var thisElement = d3.select(this);  //get a reference to the current label

            if  ( y > height - 3 ) {
                //if the label is going to cross the x axis, move it over the bar and change the color
                y = yScale(d[CKEYS.measObs]) - 3; //
                thisElement.attr("fill", barConfig.valueLabelFontColor_whenExternal);
            } else {
                thisElement.attr("fill", barConfig.valueLabelFontColor);    //default color
            }
            return y;
        })
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .attr("font-size", barConfig.valueLabelFontSize);

    gl.classed("hidden", hide);         //hide value labels if bar width is small

    //Create Y axis
    ga.append("g")
        .attr("class", "axis axis--y") //the second class is for being able to separately call each axis
        .call(yAxis)
        .selectAll(".tick text")
        .attr("fill", barConfig.axisLabelColor);


    //Create X axis
    ga.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")   //so that it goes to the bottom
        .attr("clip-path", "url(#clipXAxis)")               //apply the clip path for the X Axis
        .call(xAxis)
        .selectAll(".tick")                                 //select all x axis ticks (containing also the label text)
        .classed("hidden", hide)                            //if bar width small > hide them
        .selectAll("text")
        .attr("fill", barConfig.axisLabelColor);

    //Rotate the text labels of x axis in case they are big
    if (rotateXaxisLabels) {
        ga.selectAll(".axis--x .tick")
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", barConfig.xRotatedLabel_dx)
            .attr("dy", barConfig.xRotatedLabel_dy)
            .attr("transform", function(d) {
                return "rotate(" + barConfig.xLabelRotationDegrees + ")";
            });
    }

    svg.call(zoom);


    //Automatic zooming is valid only for continuous scales and not for ordinal
    //So custom code was implemented
    function zoomed() {
        var t = d3.event.transform;
        var hide = (xScale.bandwidth() < barConfig.minimumXBandwidthForLabels);

        xScale.range([t.x, width*t.k + t.x]);   //total range will always be t.k times the width
        gb.selectAll("rect")
            .attr("x", function(d, i) {
                return xScale(d[CKEYS.dimLabel]);
            })
            .attr("width", xScale.bandwidth());

        gl.selectAll("text.valueLabel")
            .attr("x", function(d) {
                return xScale(d[CKEYS.dimLabel]) + xScale.bandwidth() / 2 ; //centering the text
            });

        gl.classed("hidden", hide);         //hide value labels if bar width is small
        ga.select(".axis--x")
            .call(xAxis)
            .selectAll(".tick")             //select all x axis ticks (containing also label text)
            .classed("hidden", hide);       //hide them if bar width is small
    }

}

//Parameter: sorting (true/false)
function createPieChart(sorting) {

    var pieObservations = _observations.slice();        //create a shallow copy of the object before sorting

    var colorIndex = [];
    //add the original index as value to each object of the array
    //this will be used for color consistency when changing from pie chart to sorted pie chart
    pieObservations.forEach(function(value, index){
        value['index'] = index;
    });

    if (sorting) {
        pieObservations.sort(function(a,b) {
           return b[CKEYS.measObs] - a[CKEYS.measObs];
        });
    }

    //Populate color index array (for position n the value is the original index)
    //This will be used for color consistency when changing from pie chart to sorted pie chart
    var i = 0;
    pieObservations.forEach(function(value){
        colorIndex[i] = value['index'];
        i++;
    });

    //clear the graph
    $("#graph").empty();

    var margin = {
        'left'      : pieConfig.marginLeft,
        'right'     : pieConfig.marginRight,
        'top'       : pieConfig.marginTop,
        'bottom'    : pieConfig.marginBottom
    };

    //TODO calculate it from the length of the labels
    var legendWidth = pieConfig.legendDefaultWidth;
    //get the #graph div's width
    var width = $('#graph').width() - margin.left - margin.right - legendWidth;

    //find the current browser window height (depends on browser's zoom scale!)
    //and subtract the top of the graph element (dynamic) and also subtract the height of the footer (if any)
    //also subtract the two margins that are gonna be added later to the svg
    var innerWindowHeight = $(window).height();
    var graphTop = $("#graph").position().top;
    var height = innerWindowHeight - graphTop - uiConfig.footerSize - margin.top - margin.bottom;
    //in case it is small or negative (eg mobile phone > of screen) retain a minimum height
    if (height < pieConfig.pieChartMinimumHeight) {
        height = pieConfig.pieChartMinimumHeight;
    }

    //retain a minimum width
    if (width < pieConfig.pieChartMinimumWidth) {
        height = pieConfig.pieChartMinimumWidth;
    }

    //find the smallest between width and height
    var smallAxis = (width < height) ? width : height;

    var outerRadius = smallAxis / 2;
    var innerRadius = smallAxis / 4;

    //arc generator (creates the svg path definition parameters)
    var arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    //pie data transformer (finds angles)
    var pie = d3.pie()          //pie sorts the data bu default
        .sort(null)             //don't sort (sorts by default which is not needed since sorting is done manually
                                //in order to be able to sort also the legend labels!)
        .value(function(d) { return d[CKEYS.measObs]; })(pieObservations);

    var svg = d3.select("#graph")
        .classed("bgr_vlgray", true)
        .append("svg")
        .attr("width", width + margin.left + margin.right + legendWidth)
        .attr("height", height + margin.top +margin.bottom);


    //Create the legend --------------------------------
    var legend = svg.append("g")
        .attr("id", "legend")
        .selectAll("g")
        .data(pieObservations)
        .enter().append("g")
        .attr("transform", function(d, i) {
            return "translate(0," + i * pieConfig.legendPerLabelHeight + ")";
        });

    legend.append("rect")
        .attr("width", pieConfig.legendColorRectWidth)
        .attr("height", pieConfig.legendColorRectHeight)
        .style("fill", function(d, i) {
            return d3.schemeCategory20[colorIndex[i]%20];       //%20 is needed, otherwise i>20 -> black
        });

    legend.append("text")
        .attr("x", pieConfig.legendColorRectWidth + 6)
        .attr("y", pieConfig.legendColorRectHeight / 2)
        .attr("dy", ".35em")
        .attr("font-family" , pieConfig.legendTextFontFamily)
        .attr("font-size", pieConfig.legendTextFontSize)
        .attr("fill", pieConfig.legendTextFill)
        .text(function(d,i ) { return d[CKEYS.dimLabel]; });
    //------------------------------------------

    //create the clipping path (mask) for the pie
    svg.append("defs").append("clipPath")
        .attr("id", "clipPie")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    //Set up a rectangular group that has a clipping mask
    var rGroup = svg.append("g")
        .attr("id", "boxAroundPie")
        .attr("width", width )
        .attr("height", height)
        .attr("transform", "translate(" + (margin.left + legendWidth) + "," + margin.top + ")")
        .attr("clip-path", "url(#clipPie)");

    var pieGroup = rGroup.append("g") //this group will contain pie + text
        .attr("width", width )
        .attr("height", height);


    var arcs = pieGroup.selectAll("g.arc")
        .data(pie)
        .enter()
        .append("g")
        .attr("class", "arc")
        .attr("transform", "translate(" + (width/2)
                                        + "," + (height/2) + ")");

    //Draw arc paths
    arcs.append("path")
        .attr("fill", function(d, i) {
            return d3.schemeCategory20[colorIndex[i]%20];
        })
        .attr("d", arc);

    //Labels in a separate group
    arcs.append("text")
        .attr("transform", function(d) {
            return "translate(" + arc.centroid(d) + ")";
        })
        .attr("text-anchor", "middle")
        .attr("font-family" , pieConfig.valueTextFontFamily)
        .attr("font-size", pieConfig.valueTextFontSize)
        .attr("fill", pieConfig.valueTextFill)
        .text(function(d) {
            return d.value;
        })
        //Change visibility of label depending on if it totally lies inside the relevant arc
        .each(function (d) {
            var bb = this.getBBox();        //get bounding box of label
            var center = arc.centroid(d);   //get arc's center

            //Calculate 4 corners of text box
            var topLeft = {
                x : center[0] + bb.x,
                y : center[1] + bb.y
            };

            var topRight = {
                x : topLeft.x + bb.width,
                y : topLeft.y
            };

            var bottomLeft = {
                x : topLeft.x,
                y : topLeft.y + bb.height
            };

            var bottomRight = {
                x : topLeft.x + bb.width,
                y : topLeft.y + bb.height
            };

            d.visible = pointIsInArc(topLeft, d, arc) &&
                pointIsInArc(topRight, d, arc) &&
                pointIsInArc(bottomLeft, d, arc) &&
                pointIsInArc(bottomRight, d, arc);

        })
        .style('display', function (d) { return d.visible ? null : "none"; });
}

//Find if a point lies inside an arc
function pointIsInArc(pt, ptData, d3Arc) {
    // Center of the arc is assumed to be 0,0
    // (pt.x, pt.y) are assumed to be relative to the center
    var r1 = d3Arc.innerRadius()(ptData), // Using the innerRadius
        r2 = d3Arc.outerRadius()(ptData),
        theta1 = d3Arc.startAngle()(ptData),
        theta2 = d3Arc.endAngle()(ptData);

    var dist = pt.x * pt.x + pt.y * pt.y,
        angle = Math.atan2(pt.x, -pt.y); // different coordinate system.

    angle = (angle < 0) ? (angle + Math.PI * 2) : angle;

    return (r1 * r1 <= dist) && (dist <= r2 * r2) &&
        (theta1 <= angle) && (angle <= theta2);
}


//----------- data loading functions -----------------
//Sets the _measures object or null if error or invalid
function getMetadata(cubeURI) {
    return ($.ajax({
            url: prop.jsonqbAPIuri + 'dataset-metadata',
            data: {
                dataset: encodeURI(cubeURI)
            },
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'en'
            }
        })
            .then(function (metadata) {
                //Check data Integrity
                if (!(typeof metadata === 'object') ||
                    metadata === null ||
                    !metadata.hasOwnProperty(ARJK.id) ||
                    !metadata.hasOwnProperty(ARJK.label)
                    //only id and label are for sure available
                ) {
                    _metadata = null;
                    //reject the promise
                    return new $.Deferred().reject().promise();
                } else {
                    _metadata = metadata;
                }
            })
            .fail(function () {
                _metadata = null;
            })
    );
}

//Gets measures and sets the _measures object or null if error or invalid
function getMeasures(cubeURI) {
    return ($.ajax({
        url: prop.jsonqbAPIuri + 'measures',
        data: {
            dataset: encodeURI(cubeURI)
        },
        headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en'
        }
        })
        .then(function (measuresData) {
            //Check data Integrity
            if (!(typeof measuresData === 'object') ||
                measuresData === null || !measuresData.hasOwnProperty(ARJK.measures) ||
                !measuresData[ARJK.measures].length > 0 ||
                !measuresData[ARJK.measures][0].hasOwnProperty(ARJK.id) ||
                !measuresData[ARJK.measures][0].hasOwnProperty(ARJK.label)) {
                _measures = null;
                //reject the promise
                return new $.Deferred().reject().promise();
            } else {
                _measures = measuresData;
            }
        })
        .fail(function () {
            _measures = null;
        })
    );
}

//Gets simensions and sets the _dimensions object or null if error or invalid
function getDimensions(cubeURI) {
    return ($.ajax({
        url: prop.jsonqbAPIuri+'dimensions',
        data : {
            dataset : encodeURI(cubeURI)
        },
        headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en'
        }
        })
        .then(function(dimensionsData) {
            //Check data Integrity
            if (!(typeof dimensionsData === 'object') ||
                dimensionsData === null ||
                !dimensionsData.hasOwnProperty(ARJK.dimensions) ||
                !dimensionsData[ARJK.dimensions].length > 0 ||
                !dimensionsData[ARJK.dimensions][0].hasOwnProperty(ARJK.id) ||
                !dimensionsData[ARJK.dimensions][0].hasOwnProperty(ARJK.label)) {
                _dimensions = null;
                //reject the promise
                return new $.Deferred().reject().promise();
            } else {
                _dimensions = dimensionsData;
            }
        })
        .fail(function() {
            _dimensions = null;
        })
    );
}

//Gets the dimension values and sets the _dimensionValues object or null if error or invalid
function getDimensionValues(cubeURI, dimensions) {

    var promises = [];      //will hold the promises of all ajax calls
    _dimensionsValues=[];   //empty the array

    //cycle through all dimensions
    for (var i=0; i<dimensions[ARJK.dimensions].length; i++) {
        var id = dimensions[ARJK.dimensions][i][ARJK.id];

        var fx = function (it){ //local scope for iteration index

            return $.ajax({
                url: prop.jsonqbAPIuri+'dimension-values',
                data : {
                    dataset : encodeURI(cubeURI),
                    dimension: encodeURI(id)
                },
                headers: {
                    'Accept': 'application/json',
                    'Accept-Language': 'en'
                }
                })
                .then (function(singleDimValues) {
                    //Check data Integrity
                    if (!(typeof singleDimValues === 'object') ||
                        (singleDimValues === null) ||
                        !singleDimValues.hasOwnProperty(ARJK.dimension) ||
                        !singleDimValues.hasOwnProperty(ARJK.values) ||
                        (!singleDimValues[ARJK.values].length > 0) ||
                        !singleDimValues[ARJK.values][0].hasOwnProperty(ARJK.id) ||
                        !singleDimValues[ARJK.values][0].hasOwnProperty(ARJK.label) ||
                        !singleDimValues[ARJK.dimension].hasOwnProperty(ARJK.id) ||
                        !singleDimValues[ARJK.dimension].hasOwnProperty(ARJK.label)) {
                        _dimensionsValues = [];

                        //reject the promise
                        return new $.Deferred().reject().promise();
                    } else {
                        //store the dimValues objects with the same sequence as in _dimensions
                        //first it adds the All object to the first position of the array of values
                        singleDimValues[ARJK.values].unshift(allValues);
                        _dimensionsValues[it] = singleDimValues;
                    }
                })
                .fail (function() {
                    //
                });

        };  //function

        promises.push(fx(i));
    }   //Loop

    //all ajax calls will be done asynchronously. We return the promise
    //so that success/error handling can be done externally
    return $.when.apply($, promises);

}


//gets one row (one free dimension) from the cube
function getTableRow(aggCubeURI) {

    //prepare the query
    var queryData = {};
    queryData['dataset'] = encodeURI(aggCubeURI);
    //URI of the selected measure
    queryData['measure'] = encodeURI(_measures[ARJK.measures][_measureSelected][ARJK.id]);

    var row = []; //will hold the rows (can be more than one)
    //col[] is optional
    for (var d = 0; d < _dimensions[ARJK.dimensions].length; d++) {

        //the dimension selected as free should be set as the "row"
        if (d === _freeDimension) {
            row.push(encodeURI(_dimensions[ARJK.dimensions][d][ARJK.id]));
            continue;       //next iteration
        }

        //skip the dimensions that are fixed to "All" (this value has an index of 0)
        //These dimensions should be ignored since we are already dealing with an aggregated cube
        if (_dimensionsValues[d][ARJK.values][_dimensionsValueSelected[d]][ARJK.id] === "All") {
            continue;
        }

        //Set the specific values of the dimensions (eg dim1URI : valueURI)
        //get the URI of the dimension
        var key = encodeURI(_dimensions[ARJK.dimensions][d][ARJK.id]);
        //get the URI of the selected value for this dimension
        var val = encodeURI(_dimensionsValues[d][ARJK.values][_dimensionsValueSelected[d]][ARJK.id]);
        queryData[key] = val;
    }

    //this will add the table of rows like that: row[]=row1URI&row[]=row2URI&...
    queryData['row'] = row;

    return ($.ajax({
            url : prop.jsonqbAPIuri+"table",
            data :queryData,
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'en'
            }
        })
            .then(function(responseJson) {

                if (!(typeof responseJson === 'object') || responseJson === null ||
                    !responseJson.hasOwnProperty(ARJK.structure) ||
                    !responseJson.hasOwnProperty(ARJK.headers) ||
                    !responseJson.hasOwnProperty(ARJK.data) ||
                    !responseJson[ARJK.headers].hasOwnProperty(ARJK.rows)) {

                    _observations = [];
                    //reject the promise
                    return new $.Deferred().reject().promise();
                } else {
                    //now check: if there are observations they are valid
                    if  (responseJson[ARJK.data].length > 0) {
                            prepare_1D_ObservationsForUI(responseJson);
                    } else { //no observations
                        _observations = []; //just an empty array - no data for this slice
                    }
                }
            })
            .fail(function() {

            })
    );


}

//gets the response from getTable and creates a table of objects [{free dim label_0, measure value_0}, {} ...]
function prepare_1D_ObservationsForUI(jsonData) {
    _observations = [];

    var freeDimURI = _dimensions[ARJK.dimensions][_freeDimension][ARJK.id];
    //We get the last part (after # or last /) of the free dimension's URI. That is the key of the array that holds the
    //header labels (not actually the labels, but the last parts of the dimension values URIs)
    var rowHeadersArrayKey = freeDimURI     //Get the part after the # or last /
                            .substring(Math.max(freeDimURI.lastIndexOf('#'), freeDimURI.lastIndexOf('/')) + 1);

    var rowHeadersArray = jsonData[ARJK.headers][ARJK.rows][rowHeadersArrayKey];
    //check that the received object is an array, otherwise make it an empty array
    if (!Array.isArray(rowHeadersArray)) {
        rowHeadersArray = [];
    }

    for (var i=0; i<jsonData[ARJK.data].length; i++) {
        var value = jsonData[ARJK.data][i];
        //if has decimals keep only 2
        if (value % 1 !== 0) {
            value = parseFloat(value.toFixed(2)); //toFixed > string
        }
        var label="";

        //Because there is no certainty that the values and headers arrays have the same length we also check
        //that "i" is inside label's array bounds
        if (i < rowHeadersArray.length) {
            var header = rowHeadersArray[i];    //we've just gotten the header which is not the actual label of the dim value
                                                // It is the last part of the dims value URI
                                                // The same is also used as a key in the returned object's
                                                // dimension_values.From there we will get the label

            //we don't know the key is there for sure, so we might have an error
            label = jsonData[ARJK.structure][ARJK.dimension_values][rowHeadersArrayKey][header][ARJK.label];
            //e.g jsonData.structure.dimension_values.timePeriod.jaar_2005.label
            if (!label) {   //in case not found
                //try the header, or finally a generic
                if (header) {label = header;} else {label="unknown_"+i};
            }

        } else {
            //If we use the same label, that creates a problem in an ordinal scale. Bars with same label overlap!
            label = "unknown_"+i; //if the array of labels is finished we continue with generic labels
        }

        var obs = {};
        obs[CKEYS.dimLabel] = label;
        obs[CKEYS.measObs] = value;
        _observations.push(obs);

    }
    //sort observations or not?
    //_observations.sort(sortAscByLabel);

}


//returns the cubeURI that has n dimensions aggregated (those that have the value All)
//in the API call we send the free dimensions (all except those that have a value of "All")
function getAggregatedCubeURI(originalCubeURI) {

    var queryData = {};
    queryData['dataset'] = encodeURI(originalCubeURI);
    var freeDimensions = [];             //will hold the URIs of all the dimensions that are not "All" (aggregated)
    for (var i=0; i<_dimensions[ARJK.dimensions].length; i++){
        //Get the URI of the selected value for dimension i
        var selectedValueURI = _dimensionsValues[i][ARJK.values][_dimensionsValueSelected[i]][ARJK.id];

        //The free dimension (x-axis) that it is used for the visualization even if it has a
        //(pre) selected / default value of "All" it SHOULD BE INCLUDED
        if ( (i === _freeDimension) || (selectedValueURI !=="All")) {
            //add the dimension's URI to the table
            freeDimensions.push(encodeURI(_dimensions[ARJK.dimensions][i][ARJK.id]));
        }
    }
    queryData['dimension'] = freeDimensions;

    //When we include in a request parameter an array, then the query string is formed like this:
    // &key[]=A&key[]=B. This is expected by the API. So even if only we have one free dimension
    // this will be the one and only element of the array
    return ($.ajax({
            url : prop.jsonqbAPIuri+"cubeOfAggregationSet",
            data :queryData,
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'en'
            }
        })
            .then(function(responseJson) {
                if (!(typeof responseJson === 'object') ||
                    responseJson === null ||
                    !responseJson.hasOwnProperty(ARJK.label) ||
                    !responseJson.hasOwnProperty(ARJK.id)) {
                    _observations = [];
                    //reject the promise
                    return new $.Deferred().reject().promise();
                } else {
                    //All OK > return the aggregated Cube URI
                    return (responseJson[ARJK.id]);
                }

            })
            .fail(function() {

            })
    );
}


// UTILITY functions---------------------------------------------------------------------------

//Comparator function for array.sort method. Is used when members of the array are objects with a 'label' key
//Sorts ascending by label
function sortAscByLabel(a, b){
    var aLabel = a[CKEYS.dimLabel].toLowerCase();
    var bLabel = b[CKEYS.dimLabel].toLowerCase();
    return ((aLabel < bLabel) ? -1 : ((aLabel > bLabel) ? 1 : 0));
}
