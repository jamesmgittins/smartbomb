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

var Constants = {
  appName:"smartbomb",
  storedTokenName:"smartBombRegToken",
  cacheTime: 60000,
  videoFields:"&field_list=hd_url,high_url,low_url,url,id,image,length_seconds,name,publish_date,saved_time"
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
  $(".spinner").show();
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
    $(".spinner").hide();
  });
};

function getVideoById(id, callback) {
  corsRequest("https://www.giantbomb.com/api/videos/?api_key=" + regToken + "&filter=id:" + id + Constants.videoFields, function(data){
    if (data.error == "OK") {
      videoIdCache[data.results[0].id] = data.results[0];
      callback(data.results[0]);
    } else {
      // handle error
    }
  });
}

function getNextContinueVideo(counter, after) {
  // console.log("getNextContinueVideo");
  stopLoadingContinueVideos = false;
  if (videoIdCache[savedTimes[counter].videoId]) {
    videos.push(videoIdCache[savedTimes[counter].videoId]);
    videoIdCache[savedTimes[counter].videoId].save_time = savedTimes[counter].savedTime;
    renderVideos();
    counter++;
    if (counter < savedTimes.length)
      getNextContinueVideo(counter, after);
  } else {
    getVideoById(savedTimes[counter].videoId, function(videoResults) {
      videos.push(videoResults);
      renderVideos();
      counter++;
      if (counter < savedTimes.length) {
        setTimeout(function(){
          if (!stopLoadingContinueVideos)
            getNextContinueVideo(counter, after);
        }, 500);
      }
    });
  }

}

function getVideosToContinue(callback) {
  getAllSavedTimes(function(){
    var counter = 0;
    videos = [];
    getNextContinueVideo(counter);
  });
}

function checkShowCache(show, request, callback) {
  if (videoShowCache[show]) {
    videos = videoShowCache[show].videos;
    callback();
  }
  if (!videoShowCache[show] || Date.now() - videoShowCache[show].time > Constants.cacheTime) {
    request();
  }
}

function getAllVideos(callback) {
  checkShowCache("all", function(){
    corsRequest("https://www.giantbomb.com/api/videos/?api_key=" + regToken + Constants.videoFields, function(data){
      if (data.error == "OK") {
        videos = data.results;
        videoShowCache["all"] = {videos:videos, time:Date.now()};
        callback();
      } else {
        // handle error
      }
    });
  }, callback);
}

function getVideosForShow(show, callback) {
  checkShowCache(show, function(){
    corsRequest("https://www.giantbomb.com/api/videos/?api_key=" + regToken + "&filter=video_show:" + show + Constants.videoFields, function(data){
      if (data.error == "OK") {
        videos = data.results;
        videoShowCache[show] = {videos:videos, time:Date.now()};
        callback();
      } else {
        // handle error
      }
    });
  }, callback);
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
    getVideoShows(function() {

      var htmlString = renderShow("all", "Latest Videos");
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
}

function renderShow(id, name) {
  return "<div class='show' id='show-" + id + "'><a href='javascript:void(0)'>" + name + "</a></div>";
}

function selectShow(show) {
  // console.log("selectShow - " + show);
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
  var time = live ? "" : "<span class='video-time'>" + toHHMMSS(video.length_seconds) + "</span>";
  return "<div class='video' id='video-" + video.id + "' style='background-image:url(" + video.image.medium_url + ");'><span class='highlight'></span><a href='javascript:void(0)'>" + video.name + "</a>" + savedTimer + time + (live ? "<span class='live'>LIVE NOW!</span>" : "") + "</div>";
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

function testHLS() {
  var video = {
    id : "live",
    stream:"https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    name : "Test Stream"
  };
  playVideo(video);
}

function playVideo(video) {
  currentVideo = video;
  var vid = videojs("video-player", null);

  if (video.id == "live") {
    vid.src({src:video.stream + "?api_key=" + regToken, type:"application/x-mpegURL"});
  } else {
    var videoUrl = video.hd_url || video.high_url || video.low_url;
    vid.src({src:videoUrl + "?api_key=" + regToken, type:"video/mp4"});
  }

  vid.ready(function() {

    $("#video-container").show();
    $("#video-title").text(currentVideo.name);

    vid.requestFullscreen();

    if (video.saved_time && video.id != "live")
      vid.currentTime(video.saved_time);
  });

}

function closeVideo() {
  // var vid = document.getElementById("video-player");
  // vid.pause();
  var vid = videojs("video-player", null);
  vid.pause();

  $("#video-container").hide();

  if (currentVideo.id != "live") {
    corsRequest("https://www.giantbomb.com/api/video/save-time/?api_key=" + regToken + "&video_id=" + currentVideo.id + "&time_to_save=" + vid.currentTime(), function(data){
      console.log(data);
    });
  }
}

function registerApp() {
  $(".spinner").show();
  var linkCode = $("#app-code").val();
  $.getJSON('https://cors.jamesgittins.com/https://www.giantbomb.com/app/' + Constants.appName + '/get-result?format=json&regCode=' + linkCode,function(result){
    $(".spinner").hide();
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
  } else {
    $("#enter-code").show();
  }
});
