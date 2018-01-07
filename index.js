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

function requestFullScreen(element) {
    // Supports most browsers and their versions.
    var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

    if (requestMethod) { // Native full screen.
        requestMethod.call(element);
    } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }
}

var Constants = {
  appName:"smartbomb",
  storedTokenName:"smartBombRegToken",
  cacheTime: 60000
};

var regToken;
var videoShows = [];
var currentShow = "all";
var currentVideo;
var videos = [];
var savedTimes = [];
var liveVideo;
var videoIdCache = [];
var videoShowCache = [];
var stopLoadingContinueVideos = true;
var videoSource;

var corsRequest = function(url, callback) {
  $.ajax ({
    type: 'GET',
    dataType: 'jsonp',
    crossDomain: true,
    jsonp: 'json_callback',
    jsonpCallback: 'callback',
    url: url + "&format=jsonp"
  }).done(function(data) {
      // alert("success:", data);
      callback(data);
  }).fail(function() {
    alert("error");
  }).always(function() {
    // alert("complete");
  });
};

function getVideoById(id, callback) {
  corsRequest("https://www.giantbomb.com/api/videos/?api_key=" + regToken + "&filter=id:" + id, function(data){
    if (data.error == "OK") {
      videoIdCache[data.results[0].id] = data.results[0];
      callback(data.results[0]);
    } else {
      // handle error
    }
  });
}

function getNextContinueVideo(counter, after) {
  console.log("getNextContinueVideo");
  stopLoadingContinueVideos = false;
  if (videoIdCache[savedTimes[counter].videoId]) {
    videos.push(videoIdCache[savedTimes[counter].videoId]);
    renderVideos();
    counter++;
    if (counter >= savedTimes.length)
      after();
    else {
      getNextContinueVideo(counter, after);
    }
  } else {
    getVideoById(savedTimes[counter].videoId, function(videoResults) {
      videos.push(videoResults);
      renderVideos();
      counter++;
      if (counter >= savedTimes.length)
        after();
      else {
        setTimeout(function(){
          if (!stopLoadingContinueVideos)
            getNextContinueVideo(counter, after);
        },1000);
      }
    });
  }

}

function getVideosToContinue(callback) {
  if (savedTimes.length > 0) {
    var counter = 0;
    videos = [];
    getNextContinueVideo(counter, function(){

    });
  }
}

function getAllVideos(callback) {
  console.log("getAllVideos");
  if (videoShowCache["all"] && Date.now() - videoShowCache["all"].time < Constants.cacheTime) {
    videos = videoShowCache["all"].videos;
    callback();
  } else {
    corsRequest("https://www.giantbomb.com/api/videos/?api_key=" + regToken, function(data){
      if (data.error == "OK") {
        videos = data.results;
        videoShowCache["all"] = {videos:videos, time:Date.now()};
        callback();
      } else {
        // handle error
      }
    });
  }
}

function getVideosForShow(show, callback) {
  console.log("getVideosForShow - " + show);
  if (videoShowCache[show] && Date.now() - videoShowCache[show].time < Constants.cacheTime) {
    videos = videoShowCache[show].videos;
    callback();
  } else {
    corsRequest("https://www.giantbomb.com/api/videos/?api_key=" + regToken + "&filter=video_show:" + show, function(data){
      if (data.error == "OK") {
        videos = data.results;
        videoShowCache[show] = {videos:videos, time:Date.now()};
        callback();
      } else {
        // handle error
      }
    });
  }
}

function getVideoShows(callback) {
  corsRequest("https://www.giantbomb.com/api/video_shows/?api_key=" + regToken + "&sort=latest:desc", function(data){
    if (data.error == "OK") {
      videoShows = data.results;
      callback();
    } else {
      // handle error
    }
  });
}

function getAllSavedTimes(callback) {
  corsRequest("https://www.giantbomb.com/api/video/get-all-saved-times/?api_key=" + regToken + "&sort=latest:desc", function(data){
    if (data.success)
      savedTimes = data.savedTimes;

    callback();
  });
}

function getLiveStream(callback) {
  corsRequest("https://www.giantbomb.com/api/video/current-live/?api_key=" + regToken, function(data){
    if (data.success && data.video) {
      liveVideo = data.video;
      liveVideo.id = "live";
      liveVideo.name = data.video.title;
    }
    callback();
  });
}

function renderShows() {
  getLiveStream(function(){
    getAllSavedTimes(function(){
      getVideoShows(function() {

        var htmlString = renderShow("all", "Most Recent");
        htmlString += renderShow("continue", "Continue Watching");

        videoShows.forEach(function(show){
          htmlString += renderShow(show.id, show.title);
        });
        $("#shows").html(htmlString);
        $("#shows").show();
        $("#show-all").addClass("selected");
        $("#shows .show").click(function(event){
          selectShow($(this).attr("id").substring(5));
        });
        getVideos();
      });
    });
  });
}

function renderShow(id, name) {
  return "<div class='show' id='show-" + id + "'><a href='#'>" + name + "</a></div>";
}

function selectShow(show) {
  console.log("selectShow - " + show);
  stopLoadingContinueVideos = true;
  if (currentShow != show) {
    currentShow = show;
    $("#videos").hide();
    getVideos();
    $("#shows .show").removeClass("selected");
    $("#show-" + show).addClass("selected");
  }

}

function renderVideos() {
  var htmlString = "";
  if (liveVideo)
    htmlString += renderVideo(liveVideo, true);

  videos.forEach(function(video){
    htmlString += renderVideo(video);
  });
  $("#videos").html(htmlString);
  $("#videos").show();
  $("#videos .video").click(function(){
    var id = $(this).attr("id").substring(6);
    videos.forEach(function(video){
      if (video.id == id) {
        playVideo(video);
      }
    });
  });
}

function renderVideo(video, live) {
  var savedTimer = "";
  if (video.saved_time) {
    var width = Math.min(Math.round(video.saved_time / video.length_seconds * 100),100);
    savedTimer = "<div class='video-timer'><span class='video-timer-marker' style='width:" + width + "%;'></span></div>";
  }
  var time = "<span class='video-time'>" + toHHMMSS(video.length_seconds) + "</span>";
  return "<div class='video' id='video-" + video.id + "' style='background-image:url(" + video.image.medium_url + ");'><a href='#'>" + video.name + "</a>" + savedTimer + time + (live ? "<span class='live'>LIVE NOW!</span>" : "") + "</div>";
}

function getVideos() {
  if (currentShow == "continue") {
    getVideosToContinue(function(){
      renderVideos();
    });
  } else if (currentShow == "all") {
    getAllVideos(function(){
      renderVideos();
    });
  } else {
    getVideosForShow(currentShow, function(){
      renderVideos();
    });
  }
}

function playVideo(video) {
  currentVideo = video;
  // var vid = document.getElementById("video-player");
  //
  // if (!videoSource) {
  //   videoSource = document.createElement('source');
  //   vid.appendChild(videoSource);
  // }
  //
  // var videoUrl = video.hd_url || video.high_url || video.low_url;
  //
  // videoSource.setAttribute('src', videoUrl + "?api_key=" + regToken);
  // vid.load();
  // if (video.saved_time)
  //   vid.currentTime = video.saved_time;
  // vid.play();

  var vid = videojs("video-player", null);
  var videoUrl = video.hd_url || video.high_url || video.low_url;
  if (video.id == "live") {
    videoUrl = video.stream;
  }
  vid.src(videoUrl + "?api_key=" + regToken);
  vid.ready(function() {
    if (video.saved_time && video.id != "live")
      vid.currentTime(video.saved_time);

    $("#video-container").show();
    $("#video-title").text(currentVideo.name);
    vid.requestFullScreen();
  })

}

function closeVideo() {
  // var vid = document.getElementById("video-player");
  // vid.pause();
  var vid = videojs("video-player", null);
  vid.pause();

  $("#video-container").hide();

  corsRequest("https://www.giantbomb.com/api/video/save-time/?api_key=" + regToken + "&video_id=" + currentVideo.id + "&time_to_save=" + vid.currentTime(), function(data){
    console.log(data);
  });
}

function registerApp() {
  var linkCode = $("#app-code").val();
  $.getJSON('https://cors.io/?https://www.giantbomb.com/app/' + Constants.appName + '/get-result?format=json&regCode=' + linkCode,function(result){
    console.log(result);
    if (result.status == "success") {
      regToken = result.regToken;
      localStorage.setItem(Constants.storedTokenName, regToken);
      $("#reg-status").text("Success!");
      $("#enter-code").fadeOut();
      renderShows();
    } else {
      $("#reg-status").text("Uh oh! Something went wrong, maybe the code has expired? Please try again.");
    }
  });
}

$(function() {
  regToken = localStorage.getItem(Constants.storedTokenName);
  if (regToken) {
    $("#enter-code").hide();
    renderShows();
  }
});
