/**
 * 
 */
if (Constants.webOsMode) {
	// no cors needed when working as an app
  Constants.corsProxy = "";
  
  keyCodes = [
    { code: "37", value: "left" },
    { code: "38", value: "up" },
    { code: "39", value: "right" },
    { code: "40", value: "down" },
    { code: "13", value: "select" },
    { code: "461", value: "back" },
    { code: "415", value: "play" },
    { code: "19", value: "pause" }
  ];
	
	corsRequest = function(url, callback, hideSpinner) {
		  if (requestInProgress)
		    return false;

		  requestInProgress = true;
		  if (!hideSpinner)
		    $(".spinner").show();
		  
		  $.getJSON(url + "&format=json", function(data){
			  requestInProgress = false;
		      callback(data);
		  }).always(function(){
			  $(".spinner").hide();
			    requestInProgress = false;
		  });
		}
}