function query(data) {
    return $.ajax({
        url: data.url,
        type: data.type,
        headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en',
        }
    })
}


function getDatasets() {
    return (query({
            url: prop.graphQLendpoint + 'get/datasets',
            type: 'GET'
        })
        .then(function(response) {
            return response
        })
        .fail(function(err) {
            console.log(err);
        })
    );
}

function getMeasures(uri) {
    return (query({
            url: prop.graphQLendpoint + 'get/dataset_measures?uri=' + uri,
            type: 'GET'
        })
        .then(function(response) {
            measuresData = response.result.datasets[0];
            //Check data integrity
            if (!(typeof measuresData === 'object') |
                measuresData === null || !measuresData.hasOwnProperty(ARJK.measures) ||
                !measuresData[ARJK.measures].length > 0 ||
                !measuresData[ARJK.measures][0].hasOwnProperty(ARJK.id) ||
                !measuresData[ARJK.measures][0].hasOwnProperty(ARJK.label)) {
                _measures = null;
                //Reject the promise
                return new $.Deferred().reject().promise();
            } else {
                _measures = measuresData;
                return Promise.resolve();
            }
        })
        .fail(function() {
            _measures = null;
        })
    );
}

function getDimensions(uri) {
    return (query({
            url: prop.graphQLendpoint + 'get/dataset_dimensions?uri=' + uri,
            type: 'GET'
        })
        .then(function(response) {

            dimensionsData = response.result.datasets[0];
            //Check data Integrity
            if (!(typeof dimensionsData === 'object') ||
                dimensionsData === null ||
                !dimensionsData.hasOwnProperty(ARJK.dimensions) ||
                !dimensionsData[ARJK.dimensions].length > 0 ||
                !dimensionsData[ARJK.dimensions][0].hasOwnProperty(ARJK.id) ||
                !dimensionsData[ARJK.dimensions][0].hasOwnProperty(ARJK.label)) {
                _dimensions = null;
                //Reject the promise
                return new $.Deferred().reject().promise();
            } else {
                // We should exclude measure_type
                var dimensionsAux = [];
                dimensionsData.dimensions.forEach(dim => {
                    if (dim[ARJK.label] !== "MEASURE_TYPE") {
                        dimensionsAux.push(dim);
                    }
                })
                _dimensions = {
                    dimensions: dimensionsAux
                };
                return Promise.resolve();
            }
        })
        .fail(function() {
            _dimensions = null;
        })
    );
}

function getMetadata(uri) {
    return (query({
            url: prop.graphQLendpoint + 'get/dataset_metadata?uri=' + uri,
            type: 'GET'
        })
        .then(function(response) {
            metadata = response.result.datasets[0];
            //Check data Integrity
            if (!(typeof metadata === 'object') ||
                metadata === null ||
                !metadata.hasOwnProperty(ARJK.id) ||
                !metadata.hasOwnProperty(ARJK.metadata_label)
                //Only id and label are for sure available
            ) {
                _metadata = null;
                //Reject the promise
                return new $.Deferred().reject().promise();
            } else {
                _metadata = metadata;
                return Promise.resolve();
            }
        })
        .fail(function() {
            _metadata = null;
        })
    );
}

function getObservations(uri) {
    return query({
            url: prop.graphQLendpoint + 'get/dataset_observations?uri=' + uri + '&limit=1',
            type: 'GET'
        })
        .then(limit => {
            return query({
                url: prop.graphQLendpoint + 'get/dataset_observations?uri=' + uri + '&limit=' + limit.total_matches,
                type: 'GET'
            });
        })
}


function getDimensionValues(cubeURI, dimensions) {
    _dimensionsValues = []; //Empty the array

    return getObservations(cubeURI)
        .then(observations => {
            _rawObs = observations.result;
            _dimensions.dimensions.forEach(dimension => {
                _dimensionsValues.push({
                    dimension: {
                        [ARJK.id]: dimension[ARJK.id],
                        [ARJK.label]: dimension[ARJK.label]
                    },
                    values: []
                })
            })
            _dimensionsValues.forEach(dm => {
                dm.values = getValuesAux(observations.result, dm.dimension[ARJK.label]);
            })
        })
}

function getValuesAux(observations, dimension) {
    var dict = {};
    observations.forEach(obser => {
        if (obser.hasOwnProperty(dimension.toLowerCase())) {
            dict[obser[dimension.toLowerCase()]] = 1;
        }
    })
    var toRet = [];
    var index = 0;
    Object.keys(dict).forEach(value => {
        toRet.push({
            [ARJK.label]: value,
            [ARJK.id]: index
        })
        index++;
    });
    return toRet;
}


function generateData() {

    _observations = [];
    _rawObs.forEach(obs => {
        //if (obs["measure_type"] === _measures.measures[_measureSelected][ARJK.label]) {
        var obsMeasure = obs[_measures.measures[_measureSelected][ARJK.label].toLowerCase()];
        if (obsMeasure !== null && obsMeasure !== "") {
            var respectsFilters = true;
            _dimensionsValues.forEach((dimFil, index) => {
                // We exclude the free dimension
                if (index !== _freeDimension) {
                    var obsDimensionValue = obs[dimFil[ARJK.dimension][ARJK.label].toLowerCase()].toLowerCase();
                    var dimensionSelectedValue = dimFil[ARJK.values][_dimensionsValueSelected[index]][ARJK.label].toLowerCase();

                    if (obsDimensionValue !== dimensionSelectedValue) {
                        respectsFilters = false;
                    }
                }
            })
            if (respectsFilters == true) {
                var obsToPush = {};
                obsToPush[CKEYS.dimLabel] = obs[_dimensions.dimensions[_freeDimension][ARJK.label].toLowerCase()];
                obsToPush[CKEYS.measObs] = obs[_measures.measures[_measureSelected][ARJK.label].toLowerCase()];
                _observations.push(obsToPush);
            }

        }

    });

    return Promise.resolve();
}