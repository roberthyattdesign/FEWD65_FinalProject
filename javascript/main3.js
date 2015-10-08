var GoogleInit;
(function(){

	var TYPES = [];

	$('.js-submit').on('click', close);
	$('.dropdown-arrow-block').on('click', open);
	$(".category-icons .js-icon").on('click', toggleIcon);

	function close(){
		if ( $('.on').length === 0 ) {
			alert('Choose a Category!');
			return;
		}
		hasBoxLoaded = {};
		$(".slider").addClass("closed");
		route();
		clearMarkers();


		showLoad();

	}

	function open(){
		$(".slider").removeClass("closed");
	}

	var allTypes;
	function toggleIcon(){
		var $icon = $( this ),
			imgSrc = $icon.attr("src"),
			imgState = changeState(imgSrc),
			newImageState;

		$icon.removeClass('on');

		if (imgState === "off") {
			newImageState = "on";
			$icon.addClass('on');
		}
		else {
			newImageState = "off";
			$icon.removeClass('on');
		}

		$icon.attr("src", imgSrc.replace( imgState, newImageState ) );
		// find all the things that have "ON"
			
		// then, push to alTypes
		// 	TYPES.push( $(".category-icons").find("on-") )
		// // set types to []
			TYPES = []
			var iconOn = $(".on");
			console.log( iconOn );
		iconOn.each(function(idx, el){
			el = $( el );
			
			var types = el.attr( 'data-type' );
			types = types.split(' ');
			types.forEach(function(el){
				TYPES.push( el )
			})
			

			//console.log(el.attr('data-type'))
			TYPES[0].concat(el.attr('data-type'));
			console.log(TYPES);
		});
		// // find all the ones with on -- jquery search for .on
		// 	$(".category-icons").find("on-");
		// // loop through it ( jquery.each )
		// 	for (var i = $(".category-icons").find("on-"); i >= 0; i++) {
		// 		TYPES[i]
		// 	};

		// 	$(".category-icons" ).each(function()
		// //		grab the data-type ( .attr() )
		// 	$(".category-icons").find("on-").attr(".date-type")
		// //		split by ','
		// 	$(".category-icons" ).split(",")
		//		TYPES.concat( the thing you split above )
	}		

	function changeState( imgSrc ){
		var findState = imgSrc.split("/"),
			lastItem = findState.pop(),
			offOrOn = lastItem.split("-");
			state = offOrOn.shift();

		return state;
	}

	function _getDistance( ptA, ptB ) {
		var x1 = ptA.lat(),
			y1 = ptA.lng(),
			x2 = ptB.lat(),
			y2 = ptB.lng();

		return Math.sqrt(
			Math.pow( x2 - x1, 2 ) + 
			Math.pow( y2 - y1, 2 )
		);
	}

	var boxes, hasBoxLoaded = {};
	function route() {
		console.log( boxpolys );
	  // Clear any previous route boxes from the map
	  clearBoxes();

	  // Convert the distance to box around the route from miles to km
	  distance = 5 * 1.609344;

	  var request = {
	    origin: $(".js-start").val(),
	    destination: $(".js-end").val(),
	    travelMode: google.maps.DirectionsTravelMode.DRIVING
	  }

	  // Make the directions request
	  directionService.route(request, function(result, status) {
	    if (status == google.maps.DirectionsStatus.OK) {
	      directionsRenderer.setDirections(result);

	      // Box around the overview path of the first route
	      var path = result.routes[0].overview_path;
	      boxes = routeBoxer.box(path, distance);

	      var startLoc = result.routes[ 0 ].legs[ 0 ].start_location;

	      setTimeout(function() {
	      	map.setCenter( new google.maps.LatLng( startLoc.G, startLoc.K ) );
	      	map.setZoom( 12 );
	      	isStartPan = 1;
	      	hideLoad();
	      }, 0);

	      drawBoxes(boxes);

	    } else {
	      alert("Directions query failed: " + status);
	    }
	  });
	}

	// Draw the array of boxes as polylines on the map
	function drawBoxes(boxes) {
	  boxpolys = new Array(boxes.length);
	  for (var i = 0; i < boxes.length; i++) {
	    boxpolys[i] = new google.maps.Rectangle({
	      bounds: boxes[i],
	      fillOpacity: 0,
	      strokeOpacity: 1.0,
	      strokeColor: '#000000',
	      strokeWeight: 1,
	      map: map
	    });
	  }
	}

	var panTimeout, isStartPan = 0;
	function onPanned() {
		if ( isStartPan === 0 ) return;
		clearTimeout( panTimeout );
		panTimeout = setTimeout(function(){
			
			var mapCenter = map.getCenter();
			var smallest = -1; var distanceAr = [];
			var distanceIndex = boxes.reduce(function(smallIndex, box, boxIndex){
				var boxCenter = box.getCenter();

				var dist = _getDistance( mapCenter, boxCenter );

				distanceAr.push( dist );

				if ( smallest === -1 ) {
					smallest = dist;
					smallestIndex = 0;
				}

				if ( dist < smallest ) {
					smallest = dist;
					smallestIndex = boxIndex;
				}

				return smallestIndex;

			}, -1);

			// console.log( map.getCenter(), boxes, distanceIndex, distanceAr );

			if ( typeof hasBoxLoaded[ distanceIndex ] === "undefined" ) {
				console.log('loading box: ', distanceIndex );
				hasBoxLoaded[ distanceIndex ] = true;
				findPlaces( boxes, distanceIndex, 1 );
				showLoad();
			}
			else {
				console.log('box: ', distanceIndex + ' has loaded already')
			}
			

		}, 500);
	}


	function findPlaces(boxes,searchIndex, shouldStop) {
	   var request = {
	       bounds: boxes[searchIndex],
	       types: TYPES
	   };
	   // alert(request.bounds);
	   service.radarSearch(request, function (results, status) {
	   if (status != google.maps.places.PlacesServiceStatus.OK) {
	     alert("Request["+searchIndex+"] failed: "+status);
	     return;
	   }
	   // alert(results.length);
	   // document.getElementById('side_bar').innerHTML += "bounds["+searchIndex+"] returns "+results.length+" results<br>"
	   for (var i = 0, result; result = results[i]; i++) {
	     var marker = createMarker(result);
	   }
	   searchIndex++;
	   hideLoad();

	   // map.setCenter( boxes[ searchIndex ].getCenter() );
	   if ( shouldStop ) {
	   	return;
	   }
	   if (searchIndex < boxes.length) {
	   		findPlaces(boxes,searchIndex);
	   }
	     
	   });
	}

	// Clear boxes currently on the map
	function clearBoxes() {
	  if (boxpolys != null) {
	    for (var i = 0; i < boxpolys.length; i++) {
	      boxpolys[i].setMap(null);
	    }
	  }
	  boxpolys = null;
	}

	function createMarker(place){
	    var placeLoc=place.geometry.location;
	    if (place.icon) {
	      var image = new google.maps.MarkerImage(
	                place.icon, new google.maps.Size(71, 71),
	                new google.maps.Point(0, 0), new google.maps.Point(17, 34),
	                new google.maps.Size(25, 25));
	     } else var image = null;

	    var marker=new google.maps.Marker({
	        map:map,
	        icon: image,
	        position:place.geometry.location
	    });
	    var request =  {
	          reference: place.reference
	    };
	    google.maps.event.addListener(marker,'click',function(){
	    	// UPDATE here
	        service.getDetails(request, function(place, status) {
	          if (status == google.maps.places.PlacesServiceStatus.OK) {
	            var contentStr = '<h5 class="infoWindowTitle">'+place.name+'</h5><p class="infoWindowText">'+place.formatted_address;
	            if (!!place.formatted_phone_number) contentStr += '<br>'+place.formatted_phone_number;
	            if (!!place.website) contentStr += '<br><a target="_blank" class="infoWindowLink"  href="'+place.website+'">'+place.website+'</a>';
	            contentStr += '<br>';
	            infowindow.setContent(contentStr);
	            infowindow.open(map,marker);
	          } else { 
	            var contentStr = "<h5>No Result, status="+status+"</h5>";
	            infowindow.setContent(contentStr);
	            infowindow.open(map,marker);
	          }
	        });

	    });
	    gmarkers.push(marker);
	    //var side_bar_html = "<a href='javascript:google.maps.event.trigger(gmarkers["+parseInt(gmarkers.length-1)+"],\"click\");'>"+place.name+"</a><br>";
	    //document.getElementById('side_bar').innerHTML += side_bar_html;
	}

	function clearMarkers() {
		for( var i = 0; i < gmarkers.length; ++i ) {
			gmarkers[ i ].setMap( null );
		}
	}

	function hideLoad(){
		$(".loadScreen").fadeOut('slow');
	}

	function showLoad(){
		$(".loadScreen").fadeIn('slow');
	}

	function initialize() {

	  var script = document.createElement("script");
	    script.type = "text/javascript";
	    script.onload=function() {
	      map = null;
	      boxpolys = null;
	      directions = null;
	      routeBoxer = null;
	      distance = null; // km
	      service = null;
	      gmarkers = [];
	      infowindow = new google.maps.InfoWindow();
	      mapOptions = {
	        center: new google.maps.LatLng(40,-80.5),
	        mapTypeId: google.maps.MapTypeId.ROADMAP,
	        zoom: 8
	      };

	      map = new google.maps.Map(document.getElementById("map-bkgd"), mapOptions);
		  map.addListener("center_changed", onPanned);

	      service = new google.maps.places.PlacesService(map);

	      routeBoxer = new RouteBoxer();

	      directionService = new google.maps.DirectionsService();
	      directionsRenderer = new google.maps.DirectionsRenderer({ map: map }); 
	    };
	    document.getElementsByTagName("head")[0].appendChild(script);
	    script.src = 'http://google-maps-utility-library-v3.googlecode.com/svn/trunk/routeboxer/src/RouteBoxer.js';
	  // <script src="" type="text/javascript"></script>
	  // Default the map view to the continental U.S.
	       
	}

	GoogleInit = initialize;
})();