var map;

function init() {
var countiesLayer;
var statesLayer;

var selection;
var selectedLayer;

			function countiesStyle(feature) {
  return {
    fillColor: "#FF00FF",
    fillOpacity: 1,
    color: '#B04173',
  };
}

function countiesOnEachFeature(feature, layer){
  layer.on({
    click: function(e) {
      if (selection) {
        resetStyles();
      }

      e.target.setStyle(countiesSelectedStyle());
      selection = e.target;
      selectedLayer = countiesLayer;

      // Insert some HTML with the feature name
      buildSummaryLabel(feature);

      L.DomEvent.stopPropagation(e); // stop click event from being propagated further
    }
  });
}

function countiesSelectedStyle(feature) {
  return {
    fillColor: "#00FFFB",
    color: '#0000FF',
    fillOpacity: 1
  };
}

function countiesOnEachFeature(feature, layer){
  layer.on({
    click: function(e) {
      if (selection) {
        resetStyles();
      }

      e.target.setStyle(countiesSelectedStyle());
      selection = e.target;
      selectedLayer = countiesLayer;

      // Insert some HTML with the feature name
      buildSummaryLabel(feature);

      L.DomEvent.stopPropagation(e); // stop click event from being propagated further
    }
  });
}

var countiesLayer = new L.geoJSON(countiesData,{
  style: countiesStyle,
  onEachFeature: countiesOnEachFeature
});

countiesLayer.addTo(map);

map.addEventListener('click', function(e) {
  if (selection) {
    resetStyles();
    selection = null;
    document.getElementById('summaryLabel').innerHTML = '<p>Click a garden or food pantry on the map to get more information.</p>';
  }
});

function resetStyles(){
  else if (selectedLayer === countiesLayer) selectedLayer.resetStyle(selection);
}
