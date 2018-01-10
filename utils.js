function toHHMMSS(value) {
    var sec_num = parseInt(value, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

function upperCaseF(a){
    setTimeout(function(){
        a.value = a.value.toUpperCase();
    }, 1);
}

function corsRequest(url, callback, hideSpinner) {
  if (requestInProgress)
    return false;

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
// "2018-01-05 17:11:00"
function formatDateString(date) {
  var year = date.substring(0,4);
  var month = monthNames[parseInt(date.substring(5,7)) - 1];
  var day = date.substring(8,10);
  var hour = parseInt(date.substring(11,13));
  var minute = date.substring(14,16);
  return month + ". " + day + " " + year + " " + (hour > 12 ? (hour - 12) : hour) + ":" + minute + (hour >= 12 ? " pm" : " am");
}
