mapboxgl.accessToken = 'pk.eyJ1IjoieXVxaWFvMDMwNiIsImEiOiJjajE4aDcydDAwNmZwMnhvdnoyamtxMXo5In0.UrSjs2vM5yqvXaA2dMkbrg';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v9',
    center: [-87.61694, 41.86625],
    pitch: 45, // pitch in degrees
    zoom: 3
});

var api = "http://api.openweathermap.org/data/2.5/box/city?bbox=";
var apikey = "&APPID=001b0f58045147663b1ea518d34d88b4";
var bbox = '-180.0,-85.0,180.0,85.0,8';


// for animation the points

var framesPerSecond = 50;
var initialOpacity = 0.5;
var opacity = initialOpacity;
var initialRadius = 3;

var radius = initialRadius;
var maxRadius = 8;


var mapTemplate = {
    "id": "points",
    "maxzoom": 5,
    "type": "circle",
    "source": {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": []
        }
    },
    "paint": {
        "circle-radius": {
            "property": "temperature",
            "stops": [
                [10, 1],
                [35, 2]
            ]
        },
        "circle-blur": {
            "property": "temperature",
            "stops": [
                [10, 0.5],
                [35, 1]
            ]
        },
        "circle-color":{
          "property": "temperature",
          "stops": [
              [10, '#03277d'],
              [35, '#97efff']
          ]
        }
        //  "#9fefff"
    }

};
var animatedMapTemplate = {
    "id": "animatedPoints",
    "minzoom": 3,
    "type": "circle",
    "source": {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": []
        }
    },
    "paint": {
        "circle-radius": initialRadius,
        'circle-radius-transition': {
            duration: 0
        },
        'circle-opacity-transition': {
            duration: 0
        },
        "circle-color": {
            "property": "temperature",
            "stops": [
                [10, 'rgba(141, 150, 173, 0.8)'],
                [35, '#e1e7ff']
            ]
        }
    }
};

var background = {
   "id": "background",
    "maxzoom": 8,
    "type": "background",
    "paint": {
      "background-color": "black"
    }


};

getData();
setInterval(getData, 2000);

function getData() {
    $.getJSON(api + bbox + apikey, data => {
        console.log('got new data', data)
        formatData(data);
    });
}

function formatData(data) {
    var dataTemplate = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": []
        },
        "properties": {
            "title": "",
            "description": "",
            "temperature": 0,
        }
    };

    var pointsArray = [];
    var i;

    for (i = 0; i < data.list.length; i++) {
        var city = data.list[i];
        var cityData = JSON.parse(JSON.stringify(dataTemplate)); // deep copy dataTemplate

        // fill in the lat and lon
        cityData.geometry.coordinates.push(city.coord.Lon);
        cityData.geometry.coordinates.push(city.coord.Lat);


        cityData.properties.title = city.name;
        cityData.properties.rain = city.rain ? true : false;
        cityData.properties.temperature = city.main.temp;
        cityData.properties.description = '<p>City: ' + city.name +
            '</p><p>Weather: ' + city.weather[0].description +
            '</p><p>Temperature: ' + city.main.temp + '</p>';
        pointsArray.push(cityData);
    }

    // draw points on map
    if (i === data.list.length) {

        map.on('load', function() {
            map.addLayer(background);
            mapTemplate.source.data.features = pointsArray;
            map.addLayer(mapTemplate);

            var rainingPointsArray = pointsArray.filter(cityData => {
                return cityData.properties.rain;
            });

            animatedMapTemplate.source.data.features = rainingPointsArray;
            map.addLayer(animatedMapTemplate);

            animateMarker(0);
        });

    }

    function animateMarker(timestamp) {

        setTimeout(function() {

            requestAnimationFrame(animateMarker);
            radius += (maxRadius - radius) / framesPerSecond;
            opacity -= (0.9 / framesPerSecond);

            if (opacity <= 0.0) {
                radius = initialRadius;
                opacity = initialOpacity;
            }

            map.setPaintProperty('animatedPoints', 'circle-radius', radius);
            map.setPaintProperty('animatedPoints', 'circle-opacity', opacity);

        }, 1000 / framesPerSecond);

    }



map.on('click', 'points', function(e) {
    map.flyTo({
        center: e.features[0].geometry.coordinates
    });
    new mapboxgl.Popup()
        .setLngLat(e.features[0].geometry.coordinates)
        .setHTML(e.features[0].properties.description)
        .addTo(map);
});

// Change the cursor to a pointer when the mouse is over the "points" layer.
map.on('mouseenter', 'points', function() {
    map.getCanvas().style.cursor = 'pointer';
});

// Change it back to a pointer when it leaves.
map.on('mouseleave', 'points', function() {
    map.getCanvas().style.cursor = '';
});


}
