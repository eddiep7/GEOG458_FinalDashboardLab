mapboxgl.accessToken = 'pk.eyJ1IjoiZWR3YXJkcDciLCJhIjoiY2xzZjZhZnYwMGdrbDJpcXB6MzZsN2lzbSJ9.o11htKQkTmOqa1HNdhtenQ';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v10',
  center: [-122.3321, 47.6062],
  zoom: 12
});

var allData;
var currentPopup;
var showZeroFatalities = false; // Flag to toggle displaying collisions with zero fatalities

map.on('load', function () {
  map.addSource('collisions', {
    type: 'geojson',
    data: 'Assets/Collisions.geojson'
  });

  map.addLayer({
    id: 'collisions-layer',
    type: 'circle',
    source: 'collisions',
    paint: {
      'circle-color': '#FF0000',
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['get', 'FATALITIES'],
        0, 5, // minimum radius for no fatalities
        1, 10,
        2, 15,
        3, 20,
        4, 25,
        5, 30
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': 0.7
    },
    filter: showZeroFatalities ? ['>', ['get', 'FATALITIES'], 0] : ['>=', ['get', 'FATALITIES'], 0]
  });

  map.on('click', 'collisions-layer', function (e) {
    var features = map.queryRenderedFeatures(e.point, { layers: ['collisions-layer'] });
    if (!features.length) {
      return;
    }
    var feature = features[0];
    var properties = feature.properties;
    var collisionType = properties['COLLISIONTYPE'];
    var fatalities = parseInt(properties['FATALITIES']) || 0;

    if (currentPopup) {
      currentPopup.remove();
    }

    currentPopup = new mapboxgl.Popup()
      .setLngLat(feature.geometry.coordinates)
      .setHTML('<h3>Collision Details</h3>' +
        '<p><strong>Collision Type:</strong> ' + collisionType + '</p>' +
        '<p><strong>Fatalities:</strong> ' + fatalities + '</p>')
      .addTo(map);
  });

  map.on('mouseenter', 'collisions-layer', function () {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'collisions-layer', function () {
    map.getCanvas().style.cursor = '';
  });

  // Fetch all data for calculating total fatalities by collision type
  allData = map.querySourceFeatures('collisions');

  // Initial statistics
  updateStatistics();
});

map.on('moveend', function () {
  // Update total collisions and total fatalities based on filtered data
  updateStatistics();
});

document.getElementById('toggle-zero-fatalities').addEventListener('change', function () {
  showZeroFatalities = this.checked;
  map.setFilter('collisions-layer', showZeroFatalities ? ['>', ['get', 'FATALITIES'], 0] : ['>=', ['get', 'FATALITIES'], 0]);
  updateStatistics();
});

function updateStatistics() {
  var visibleData = map.queryRenderedFeatures({ layers: ['collisions-layer'] });
  var totalCollisions = visibleData.length;
  var totalFatalities = visibleData.reduce((acc, curr) => {
    return acc + (parseInt(curr.properties['FATALITIES']) || 0);
  }, 0);

  document.getElementById('total-collisions').textContent = totalCollisions;
  document.getElementById('total-fatalities').textContent = totalFatalities;

  updateChart(totalCollisions, totalFatalities);
}

var myChart;

function updateChart(totalCollisions, totalFatalities) {
  var ctx = document.getElementById('collision-bar-chart').getContext('2d');
  if (!myChart) {
    myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Total Collisions', 'Total Fatalities'],
        datasets: [{
          label: 'Count',
          data: [totalCollisions, totalFatalities],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  } else {
    myChart.data.datasets[0].data = [totalCollisions, totalFatalities];
    myChart.update();
  }
}