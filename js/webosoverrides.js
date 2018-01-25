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
      })
      .fail(function(response){
        console.log("request failed");
        console.log(response);
        if (response.status == 401 && response.responseJSON && response.responseJSON.status_code == 100) {
          console.log("invalid api key");
          
          $("#top-menu").hide();
          $("#shows").hide();
          GbCache.clearCache();
          if ($("#enter-code .error-msg").length == 0)
            $("#enter-code").prepend("<p class='error-msg'>The giantbomb server thinks your saved API key is invalid</p>");
          $("#app-code").val("");
          $("#reg-status").text("");
          $("#enter-code").show();
          $("#enter-code input").focus();
        }
      })
      .always(function(){
			  $(".spinner").hide();
			    requestInProgress = false;
		  });
		}
}


// var tizenKeyCodes = [
//   { code: "37", value: "left" },
//   { code: "38", value: "up" },
//   { code: "39", value: "right" },
//   { code: "40", value: "down" },
//   { code: "13", value: "select" },
//   { code: "10009", value: "back" },
//   { code: "415", value: "play" },
//   { code: "19", value: "pause" },
//   { code: "413", value: "stop" }
// ]