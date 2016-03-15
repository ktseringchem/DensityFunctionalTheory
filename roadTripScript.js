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
      location:"1901 Spinnaker Dr, Ventura, CA 93001",
      stopover:true
    },{
      location:"Yosemite National Park, 9035 Village Dr, YOSEMITE NATIONAL PARK, CA 95389",
      stopover:true
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

directionsService.route(request, function(response, status) {
  if (status == google.maps.DirectionsStatus.OK) {
    directionsDisplay.setDirections(response);
  }
});
