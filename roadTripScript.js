jQuery(function() {
var stops = [
                    {"Geometry":{"Latitude":33.870360,"Longitude":-117.924297}},//A Fullerton
                    {"Geometry":{"Latitude":34.133926,"Longitude":-116.315600}},//B Jausha Tree
                    {"Geometry":{"Latitude":34.248487,"Longitude":-119.266552}},//C Channel Islands National Park
                    {"Geometry":{"Latitude":37.752113,"Longitude":-122.447575}},//D San Fransisco
                    {"Geometry":{"Latitude":37.748134,"Longitude":-119.588534}},//E Yosemite Valley
                    {"Geometry":{"Latitude":37.260397,"Longitude":-112.948614}},//F Zion Human History Museum
                    {"Geometry":{"Latitude":37.745361,"Longitude":-112.319583}},//G Great Basin Visitor Center
                    {"Geometry":{"Latitude":38.256190,"Longitude":-111.232858}},//H Capitol Reef National Park Visitor Center
                    {"Geometry":{"Latitude":38.615982,"Longitude":-109.619619}},//I Arches National Park Visitor Center
                    {"Geometry":{"Latitude":40.441052,"Longitude":-105.755585}},//J Rocky Mountain National Park
                    {"Geometry":{"Latitude":44.415559,"Longitude":-110.576529}},//K Yellowstone National Park, Grand Loop Rd, Yellowstone National Park, WY 82190
                    {"Geometry":{"Latitude":46.895180,"Longitude":-103.381442}},//L Near Theodore Roosevelt National Park
                    {"Geometry":{"Latitude":43.876480,"Longitude":-103.454837}},//M Mount Rushmore National Memorial 13000 SD-244, Keystone, SD 57751
                    {"Geometry":{"Latitude":45.046782,"Longitude":-93.217007}},//N Windsor Ln, New Brighton, MN 55112
                    {"Geometry":{"Latitude":42.357789,"Longitude":-72.490881}},//O Old Farm Rd, Amherst, MA 01002
                ] ;

var map = new window.google.maps.Map(document.getElementById("map"));

// new up complex objects before passing them around
var directionsDisplay = new window.google.maps.DirectionsRenderer();
var directionsService = new window.google.maps.DirectionsService();

Tour_startUp(stops);

window.tour.loadMap(map, directionsDisplay);
window.tour.fitBounds(map);

if (stops.length > 1)
    window.tour.calcRoute(directionsService, directionsDisplay);
});

function Tour_startUp(stops) {
if (!window.tour) window.tour = {
    updateStops: function (newStops) {
        stops = newStops;
    },
    // map: google map object
    // directionsDisplay: google directionsDisplay object (comes in empty)
    loadMap: function (map, directionsDisplay) {
        var myOptions = {
            zoom: 13,
            center: new window.google.maps.LatLng(51.507937, -0.076188), // default to London
            mapTypeId: window.google.maps.MapTypeId.ROADMAP
        };
        map.setOptions(myOptions);
        directionsDisplay.setMap(map);
    },
    fitBounds: function (map) {
        var bounds = new window.google.maps.LatLngBounds();

         //extend bounds for each record
        jQuery.each(stops, function (key, val) {
            var myLatlng = new window.google.maps.LatLng(val.Geometry.Latitude, val.Geometry.Longitude);
            bounds.extend(myLatlng);
        });
        map.fitBounds(bounds);
    },
    calcRoute: function (directionsService, directionsDisplay) {
        var batches = [];
        var itemsPerBatch = 10; // google API max = 10 - 1 start, 1 stop, and 8 waypoints
        var itemsCounter = 0;
        var wayptsExist = stops.length > 0;

        while (wayptsExist) {
            var subBatch = [];
            var subitemsCounter = 0;

            for (var j = itemsCounter; j < stops.length; j++) {
                subitemsCounter++;
                subBatch.push({
                    location: new window.google.maps.LatLng(stops[j].Geometry.Latitude, stops[j].Geometry.Longitude),
                    stopover: true
                });
                if (subitemsCounter == itemsPerBatch)
                    break;
            }

            itemsCounter += subitemsCounter;
            batches.push(subBatch);
            wayptsExist = itemsCounter < stops.length;
            // If it runs again there are still points. Minus 1 before continuing to
            // start up with end of previous tour leg
            itemsCounter--;
        }

        // now we should have a 2 dimensional array with a list of a list of waypoints
        var combinedResults;
        var unsortedResults = [{}]; // to hold the counter and the results themselves as they come back, to later sort
        var directionsResultsReturned = 0;

        for (var k = 0; k < batches.length; k++) {
            var lastIndex = batches[k].length - 1;
            var start = batches[k][0].location;
            var end = batches[k][lastIndex].location;

            // trim first and last entry from array
            var waypts = [];
            waypts = batches[k];
            waypts.splice(0, 1);
            waypts.splice(waypts.length - 1, 1);

            var request = {
                origin: start,
                destination: end,
                waypoints: waypts,
                travelMode: window.google.maps.TravelMode.WALKING
            };
            (function (kk) {
                directionsService.route(request, function (result, status) {
                    if (status == window.google.maps.DirectionsStatus.OK) {

                        var unsortedResult = { order: kk, result: result };
                        unsortedResults.push(unsortedResult);

                        directionsResultsReturned++;

                        if (directionsResultsReturned == batches.length) // we've received all the results. put to map
                        {
                            // sort the returned values into their correct order
                            unsortedResults.sort(function (a, b) { return parseFloat(a.order) - parseFloat(b.order); });
                            var count = 0;
                            for (var key in unsortedResults) {
                                if (unsortedResults[key].result != null) {
                                    if (unsortedResults.hasOwnProperty(key)) {
                                        if (count == 0) // first results. new up the combinedResults object
                                            combinedResults = unsortedResults[key].result;
                                        else {
                                            // only building up legs, overview_path, and bounds in my consolidated object. This is not a complete
                                            // directionResults object, but enough to draw a path on the map, which is all I need
                                            combinedResults.routes[0].legs = combinedResults.routes[0].legs.concat(unsortedResults[key].result.routes[0].legs);
                                            combinedResults.routes[0].overview_path = combinedResults.routes[0].overview_path.concat(unsortedResults[key].result.routes[0].overview_path);

                                            combinedResults.routes[0].bounds = combinedResults.routes[0].bounds.extend(unsortedResults[key].result.routes[0].bounds.getNorthEast());
                                            combinedResults.routes[0].bounds = combinedResults.routes[0].bounds.extend(unsortedResults[key].result.routes[0].bounds.getSouthWest());
                                        }
                                        count++;
                                    }
                                }
                            }
                            directionsDisplay.setDirections(combinedResults);
                        }
                    }
                });
            })(k);
        }
    }
};
}




/*
  var directionsService = new google.maps.DirectionsService();
  var directionsDisplay = new google.maps.DirectionsRenderer();

  var map = new google.maps.Map(document.getElementById('googleMap'), {
    zoom:1,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  directionsDisplay.setMap(map);

  var request = {
    origin: "Fullerton, CA",
    destination: "Amherst, MA",
    waypoints: [
      {
        location:"Joshua Tree Visitor Center, 6554 Park Boulevard, Joshua Tree, CA 92256",
        stopover:false
      },{
        location:"Yosemite National Park, 9035 Village Dr, YOSEMITE NATIONAL PARK, CA 95389",
        stopover:false
      },{
        location:"San Fransisco, CA",
        stopover:true
      },{
        location:"Great Basin Visitor Center, Baker, NV 89311",
        stopover:true
      },{
        location:"UT-63, Bryce, UT 84764",
        stopover:true
      },{
        location:"16 Scenic Dr, Torrey, UT 84775",
        stopover:true
      },{
        location:"UT-211, Moab, UT 84532",
        stopover:true
      },{
        location:"Arches Entrance Rd, Moab, UT 84532",
        stopover:true
      }],
      optimizeWaypoints:true,
      travelMode: google.maps.DirectionsTravelMode.DRIVING
  };

  directionsService.route(request, function(response, status){
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
    }
  });
*/
