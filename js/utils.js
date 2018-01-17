function arrayEquals(a1, a2) {
  return JSON.stringify(a1) === JSON.stringify(a2);
}

function toHHMMSS(value) {
    var sec_num = parseInt(value, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    var showHours = hours > 0;

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return (showHours ? hours + ':' : '') + minutes + ':' + seconds;
}

function cleanTextForDisplay (input) {
  return $('<span>').text(input).html();
}

function upperCaseF(a){
    setTimeout(function(){
        a.value = a.value.toUpperCase();
    }, 1);
}

function corsRequest(url, callback, hideSpinner) {
  // wait half second if currently a request in progress
  if (requestInProgress) {
    setTimeout(function(){
      corsRequest(url, callback, hideSpinner);
    }, 500);
  }

  requestInProgress = true;
  if (!hideSpinner)
    $(".spinner").show();
    
  $.ajax ({
    type: 'GET',
    dataType: 'jsonp',
    crossDomain: true,
    jsonp: 'json_callback',
    jsonpCallback: 'callback',
    url: url + "&format=jsonp"
  }).done(function(data) {
      requestInProgress = false;
      callback(data);
  }).fail(function(response) {
    requestInProgress = false;
    console.log("Error getting request from - " + url);
    console.log(response);
  }).always(function() {
    $(".spinner").hide();
    requestInProgress = false;
  });
}


var monthNames = [
  "Jan", "Feb", "Mar",
  "Apr", "May", "Jun", "Jul",
  "Aug", "Sep", "Oct",
  "Nov", "Dec"
];

$.fn.force_redraw = function() {
  return this.hide( 0, function() {
      $( this ).show();
  } );
}

var readyToSelectAShow = true;

function owlShowInit(html, items) {
  $("#shows").replaceWith('<div id="shows" style="" class="nav-bar"></div>');
  $("#shows").html(html);
  
  $("#shows").force_redraw();

  for (var i = 0; i < $("#shows > div").length; i++) {
    var width = Math.round($("#shows > div")[i].getBoundingClientRect().width);
    width = width > 1500 ? 350 : width;
    $($("#shows > div")[i]).css("width", width + "px");
  }

  $("#shows > div").addClass("width-set");
  $("#shows > div").addClass('item');
  $("#shows").addClass("owl-carousel").owlCarousel({
    items: items || 10,
    center:true,
    loop: !items || items > 3,
    margin:0,
    autoWidth:true,
    mouseDrag:false,
    touchDrag:false,
    pullDrag:false
  });
  $("#shows").on("translated.owl.carousel",function(e){
    readyToSelectAShow = true;
  });
  readyToSelectAShow = true;
}

function owlShowNext() {
  $("#shows").trigger("next.owl.carousel");
}

function owlShowPrevious() {
  $("#shows").trigger("prev.owl.carousel");
}

var readyTimeout;

function owlShowGoTo(index) {
  $("#shows").trigger("to.owl.carousel",index);
  if (readyTimeout)
    clearTimeout(readyTimeout);
  readyTimeout = setTimeout(function() {
    readyToSelectAShow = true;
  }, 500);
}

function owlShowJumpTo(index) {
  $('#shows').trigger('to.owl.carousel', [index, 0, true]);
}

// "2018-01-05 17:11:00"
function formatDateString(date) {
  var year = date.substring(0,4);
  var month = monthNames[parseInt(date.substring(5,7)) - 1];
  var day = date.substring(8,10);
  var hour = parseInt(date.substring(11,13));
  var minute = date.substring(14,16);
  return month + ". " + day + " " + year + " " + (hour > 12 ? (hour - 12) : hour) + ":" + minute + (hour >= 12 ? " pm" : " am");
}

function owlInit() {
  for (var i = 0; i < Constants.itemsInCarousel; i++) {
    $("#videos").append("<div class='item' data-owl-index='" + i + "'></div>");
  }
  $("#videos").addClass("owl-carousel").owlCarousel({
    items:4,
    center:true,
    loop:true,
    margin:30,
    mouseDrag:false,
    touchDrag:false,
    pullDrag:false
  });
  $("#videos").on("translated.owl.carousel",function(e){
    readyToMove = true;
  });
}

function owlNext() {
  $("#videos").trigger("next.owl.carousel");
}

function owlPrevious() {
  $("#videos").trigger("prev.owl.carousel");
}

function owlGoTo(index) {
  $("#videos").trigger("to.owl.carousel",index);
}

function owlResetPositions() {
  $('#videos').trigger('to.owl.carousel', [0,0,true]);
}

function mediaElementVideoSetup(onSuccess, youtube) {
  $('#video-player').on('error', function(e) {
    console.log(e);
  });
  $('#video-player').mediaelementplayer({
    videoWidth: '100%',
    videoHeight: '100%',
    features: ['progress','current','duration'],
    alwaysShowControls : true,
    startVolume : 1,
    enableKeyboard : false,
    youtube : youtube || {},
		//pluginPath: "/path/to/shims/",
	// When using jQuery's `mediaelementplayer`, an `instance` argument
	// is available in the `success` callback
		success: function(mediaElement, originalNode, instance) {
      jsVideo = mediaElement;
      onSuccess();
		}
  });
}

function mediaElementSetup() {
  
  $('#audio-player').mediaelementplayer({
    audioWidth: '100%',
    audioHeight : 50,
    features: ['playpause','progress','current','duration'],
    startVolume : 1,
    enableKeyboard : false,
		//pluginPath: "/path/to/shims/",
	// When using jQuery's `mediaelementplayer`, an `instance` argument
	// is available in the `success` callback
		success: function(mediaElement, originalNode, instance) {
			jsAudio = mediaElement;
		}
	});
}