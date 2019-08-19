    var mbAttr = 'Map created by: Moe R, Stephanie B, and Dwight F';

    var mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGZpZWxkMjMiLCJhIjoiY2p4NThuaGYxMDB3bDQ4cXd0eWJiOGJoeSJ9.T94xCeDwJ268CmzfMPXdmw';

    var grayscale   = L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr}),
    dark  = L.tileLayer(mbUrl, {id: 'mapbox.dark',   attribution: mbAttr}),
    outdoors = L.tileLayer(mbUrl, {id: 'mapbox.outdoors',   attribution: mbAttr});

    var width = window.innerWidth * 0.3,
    height = 450; // defines map width

    //create the map*/
    var map = L.map('map', {
        center: [32.38, -84.00],//Coordinated to center the map for Midwestern States
        zoom: 5.5,
        layers:outdoors
    });

    var baseLayers = {
		"Topographic": outdoors,
    "Grayscale": grayscale,
		"Darkscale": dark,

        };
	L.control.layers(baseLayers).addTo(map);

	// Assign to a variable so you can use it later and add it to your map
	/* SHB, 2019*/

//initial function
(function(){

//variables
var attrArray = ["F1950s","F1960s", "F1970s", "F1980s", "F1990s", "F2000s","F2010s"]; //attributes

var expressed = attrArray[0]; //initial attribute

//chart frame

//choropleth map setup
function setMap(){


    //svg container for map
    var chor = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //map projection
    var projection = d3.geoMercator()
    		.scale(300)
    		.translate([width / 3, height / 2]);

		var path = d3.geoPath()
		    .projection(projection);
    //parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "./data/FEMA.csv") //load attributes from csv
        .defer(d3.json, "./data/STATES.topojson") //load choropleth spatial data
        .await(callback);

    //example 1.5
    function callback(error, csvData, world){

        //place graticule on the map
        setGraticule(map, path);

        //topoJSON
        var countries = topojson.feature(world, world.STATES).features;

        // Adding topoJSON data to map
        var world = map.append("path")
            .datum(countries)
            .attr("class", "world")
            .attr("d", path);

        //join csv data to GeoJSON
        countries = joinData(countries, csvData);

        //color scale
        var colorScale = makeColorScale(csvData);

        //add enumeration units
        setEnumerationUnits(countries, map, path, colorScale);

        //add coordinated visualization to map
        setChart(csvData, colorScale);

        //create the dropdown menu
        createDropdown(csvData);

        };
}; //end of setMap()

function setGraticule(map, path){
    //example 2.5
    //create graticule generator
    var graticule = d3.geoGraticule()
        .step([15, 15]); //place graticule lines every 15 degrees of longitude and latitude

    //example 2.8 create graticule background
    var gratBackground = map.append("path")
        .datum(graticule.outline()) //bind graticule background
        .attr("class", "gratBackground") //assign class for styling
        .attr("d", path) //project graticule

    //example 2.6 line 5...create graticule lines
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
        .data(graticule.lines()) //bind graticule lines to each element to be created
        .enter() //create an element for each datum
        .append("path") //append each element to the svg as a path element
        .attr("class", "gratLines") //assign class for styling
        .attr("d", path); //project graticule lines
};

    //loop through csv, assign values to geojson
function joinData(countries, csvData){
        for (var i=0; i < csvData.length; i++){
            var csvRegion = csvData[i];
            var csvKey = csvRegion.State_Name;

            //loop through geojson to identify matching item from csv
            for (var a=0; a<countries.length; a++){
                var geojsonProps = countries[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.STUSPS; //the geojson primary key
                //where there is primary key match, transfer csv data to geojson
                if (geojsonKey == csvKey){
                    //assign attributes and values
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvRegion[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                    //console.log(geojsonProps);
                };
            };
        };
    return countries;
};

    //add countries to map
function setEnumerationUnits(countries, map, path, colorScale){

  var world = map.selectAll(".world")
     .data(countries)
     .enter()
     .append("path")
     .attr("class", function(d){
         return "world " + d.properties.STUSPS;
     })
     .attr("d", path)
     .style("fill", function(d){
      //choropleth color properties
      return choropleth(d.properties, colorScale);
     })
    // access only d properties
     .on("mouseover", function(d) {
         highlight(d.properties);
     })
     .on("mouseout", function(d) {
         dehighlight(d.properties);
     })
     .on("mousemove", moveLabel);

    var desc = world.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');

};
//graticule


//color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"
    ];

    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of expressed values
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);

    //reset to cluster minimums
    domainArray = clusters.map(function(d) {
        return d3.min(d);
    });
    //remove first value to create class breakpoints
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);

    return colorScale;
};

//test for value and return color
function choropleth (props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign it a color, otherwise grey
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale (val);
    } else {
        return "#ffffff";
    };
};

//create coordinated dynamic bar chart
function setChart(csvData, colorScale){
    //svg element to hold bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    var chartBackground = d3.select("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //set bars for each data record
    var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            //reverse bar order
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.STUSPS;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)

        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);

     // bar style
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

    //chart title
    var chartTitle = chart.append("text")
        .attr("x", 50)
        .attr("y", 30)
        .attr("class", "chartTitle")

    //vertical axis
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //frame for chart
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        //this determines the frame ratio
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //bar positions, heights, colors
    updateChart(bars, csvData.length, colorScale);
}; //end setChart()

//dropdown menu to select data  record
function createDropdown(csvData) {
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Year");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d){ return d; });
    //console.log(attrOptions);
};

//dropdown change handler
function changeAttribute(attribute, csvData){
    //change expressed attribute
    expressed = attribute;

    //recreate color scale
    var ColorScale = makeColorScale(csvData);

    //recolor data
    var world = d3.selectAll(".world")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, ColorScale)
        });


    //axis changes based on max value for selected attribute
    var max = d3.max(csvData,function(d){
        return + parseFloat(d[expressed]);
        });

    //dynamically re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bars")
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition()
        .delay(function(d, i) {
            return i * 20;
        })
        .duration(500);

    updateChart(bars, csvData.length, ColorScale);
}; //end changeAttribute()

//position, size, color of bars
function updateChart(bars, n, colorScale){
    bars.attr("x", function(d, i){
            //return i * (chartInnerWidth / n) + leftPadding;
            return i * (chartWidth / n)+ leftPadding;s
        })
        //size/resize
        .attr("height", function(d, i){
            return 3000 - yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //recolor
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
    var chartTitle = d3.select(".chartTitle")
        .text("Maternal Mortality Ratio, " + expressed + "");

    // adjust yAxis
    var yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(6)
        .tickFormat(function (d) {
            if ((d / 1000) >= 1) {
                d = d / 1000 + "K";
            }
            return d;
        });

    //update chart axis
    var update_yAxis = d3.selectAll("g.axis")
    .call(yAxis);
};

 //highlight bars and corresponding location on map
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.STUSPS)
        .style("stroke", "#07f2f1")
        .style("stroke-width", "2");
    //dynamic label on mouseover
        setLabel(props);

};

//reset style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.STUSPS)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
     d3.select(".infolabel")
        .remove();
};

//dynamic label
function setLabel(props){
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + props["NAME_LONG"] + "</b>" + "</h1><i>";


    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.STUSPS + "_NAME_LONG")
        //.attr("id", props.country + "Country")
        .html(labelAttribute)


};

//move info label with mouse
function moveLabel(){

    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //mousemove event sets label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1;

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};
})(); //last line of main.js
