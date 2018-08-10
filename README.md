# Cube Visualizer

The Cube Visualizer is a web application that creates and presents to the user graphical representations of an RDF data cube’s one-dimensional slices. It is built as a client of the JSON QB REST API implementation. User’s choices (measure, free dimension and dimension values) are translated to appropriate API calls. The returned data are presented to the user in the form of a chart, the type of which (bar chart, pie chart, sorted pie chart, area chart) can be also selected.

## Instructions

1. For running Cube Visualizer with GraphQL APIwe need to run a communicator that communicates with the GraphQL endpoint. 
Can be found here: https://gitlab.insight-centre.org/egov/ogi-cubiql-communicator

2. Set up configuration file in CubeVisualizer/js/config.js pointing to the communicator instance and the cube URI
(dataCubeURI will be passed as a parameter)
```
prop.graphQLendpoint
prop.dataCubeURI
```