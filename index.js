var Constants = {
  appName:"smartbomb",
  storedTokenName:"smartBombRegToken",
  cacheTime: 60000,
  liveVideoCheckTime: 60000,
  videoFields:"&field_list=hd_url,high_url,low_url,url,id,image,length_seconds,name,publish_date,saved_time",
  videosLimit : "&limit=30",
  videosPerRequest : 30
};

var videoCategories =[
  {id:20,name:"Best Of"},
  {id:7,name:"Trailers"},
  {id:6,name:"Events"},
  {id:11,name:"Extra Life"},
  {id:8,name:"Features"}
];

var currentCategory = false;

var regToken;
var videoShows = [];
var currentShow = "all";
var currentVideo;

var videos = [];
var totalVideos = 100;
var currentOffset = 0;
var readyToLoadMore = true;

var savedTimes = [];
var liveVideo;
var lastLiveCheck = 0;
var videoIdCache = [];
var videoShowCache = [];
var videoCategoryCache = [];
var stopLoadingContinueVideos = true;
var videoSource;
var timerInterval;
var requestInProgress = false;
var jsVideo;



function getVideoById(id, callback) {
  corsRequest("https://www.giantbomb.com/api/videos/?api_key=" + regToken + "&filter=id:" + id + Constants.videoFields + Constants.videosLimit, function(data){
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
    var videoToAdd = videoIdCache[savedTimes[counter].videoId];
    videoToAdd.saved_time = savedTimes[counter].savedTime;
    videos.push(videoToAdd);
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

function savedVideoSort() {
  savedTimes.sort(function(a,b){
    var aTime = a.savedOn.split("-");
    var bTime = b.savedOn.split("-");
    for (var i=0; i < aTime.length; i++) {
      if (parseInt(aTime[i]) < parseInt(bTime[i]))
        return 1;
      if (parseInt(aTime[i]) > parseInt(bTime[i]))
        return -1;
    }
    return 0;
  });
}

function getVideosToContinue(callback) {
  getAllSavedTimes(function(){
    var counter = 0;
    videos = [];
    savedVideoSort();
    getNextContinueVideo(counter);
  });
}

function checkShowCache(request, callback, offset) {

  var cacheValue = currentShow ? videoShowCache[currentShow] : videoCategoryCache[currentCategory];

  if (cacheValue && offset == 0) {
    videos = currentShow ? videoShowCache[currentShow].videos : videoCategoryCache[currentCategory].videos;
    callback();
  }
  if (!cacheValue || Date.now() - cacheValue.time > Constants.cacheTime || offset > 0) {
    request();
    if (cacheValue)
      $(".spinner").hide();
  }
}

function getVideosForShow(callback, offset) {
  checkShowCache(function(){
    var showFilter = currentShow == "all" ? "" : "&filter=video_show:" + currentShow;
    if (currentCategory)
      showFilter = "&filter=video_categories:" + currentCategory;
    corsRequest("https://www.giantbomb.com/api/videos/?offset=" + offset + "&api_key=" + regToken + showFilter + Constants.videoFields + Constants.videosLimit, function(data){
      if (data.error == "OK") {
        if (offset > 0) {
          videos = videos.concat(data.results);
          totalVideos = data.number_of_total_results;
          currentOffset = offset;
        } else {
          videos = data.results;
          totalVideos = data.number_of_total_results;
          currentOffset = 0;
          if (currentCategory) {
            videoCategoryCache[currentCategory] = {videos:videos, time:Date.now()};
          } else {
            videoShowCache[currentShow] = {videos:videos, time:Date.now()};
          }
        }
        callback();
      } else {
        if (currentCategory) {
          videoCategoryCache[currentCategory] = undefined;
        } else {
          videoShowCache[currentShow] = undefined;
        }
      }
    });
  }, callback, offset);
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

function getVideoCategories(callback) {
  corsRequest("https://www.giantbomb.com/api/video_categories/1/?api_key=" + regToken, function(data){
    if (data.error == "OK") {
      videoCategories = data.results;
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
    } else {
      liveVideo = undefined;
    }
    callback();
  });
  setTimeout(function(){
    getLiveStream(renderVideos);
  },Constants.liveVideoCheckTime);
}

function renderShows() {
  getLiveStream(function(){
    getVideoShows(function() {

      var htmlString = renderShow("all", "Latest Videos");
      htmlString += renderShow("continue", "Continue Watching");

      videoCategories.forEach(function(show){
        htmlString += renderShow(show.id, show.name, true);
      });

      videoShows.forEach(function(show){
        htmlString += renderShow(show.id, show.title);
      });
      $("#shows").html(htmlString);
      $("#shows").show();
      $(".show[data-show-id='all']").addClass("selected");
      $("#shows .show").click(function(event){
        selectShow($(this).data("show-id"), $(this).hasClass("category"));
      });
      getVideos();
    });
  });
}

function renderShow(id, name, isCategory) {
  var classes = isCategory ? "show category" : "show";
  return "<div class='" + classes +"' data-show-id='" + id + "'><a href='javascript:void(0)'>" + name + "</a></div>";
}

function selectShow(show, isCategory) {
  if ($("#video-container").is(":visible"))
    return false;

  stopLoadingContinueVideos = true;
  if (((isCategory && currentCategory != show) || (!isCategory && currentShow != show)) && !requestInProgress) {
    $("#shows .show").removeClass("selected");
    if (isCategory) {
      currentCategory = show;
      currentShow = false;
      $(".show.category[data-show-id='" + show + "']").addClass("selected");
    }
    else {
      currentCategory = false;
      currentShow = show;
      $(".show:not(.category)[data-show-id='" + show + "']").addClass("selected");
    }
    $("#videos").hide();
    getVideos();
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
    if (id == "live")
      playVideo(liveVideo);
    else
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
    var width = Math.max(1,Math.min(Math.round(video.saved_time / video.length_seconds * 100),100));
    savedTimer = "<div class='video-timer'><span class='video-timer-marker' style='width:" + width + "%;'></span></div>";
  }
  var time = live ? "" : "<span class='video-time'>" + toHHMMSS(video.length_seconds) + "</span>";
  var image = live ? "https://" + video.image : video.image.medium_url;
  var postedDate = live ? "<span class='posted live'>LIVE NOW!</span>" : "<span class='posted'>" + formatDateString(video.publish_date) + "</span>";
  return "<div class='video' id='video-" + video.id + "' style='background-image:url(" + image + ");'><span class='highlight'></span><a href='javascript:void(0)'>" + video.name + "</a>" + savedTimer + time + postedDate + "</div>";
}

function getVideos() {
  if (currentShow == "continue") {
    getVideosToContinue(function(){
      renderVideos();
    });
  } else {
    getVideosForShow(function(){
      renderVideos();
    }, 0);
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
  if ($("#video-container").is(":visible"))
    return false;

  currentVideo = video;

  if (video.id == "live") {
    jsVideo.src({src:video.stream + "?api_key=" + regToken, type:"application/x-mpegURL"});
  } else {
    srcArray = [];
    if (video.hd_url)
      srcArray.push({
        src : video.hd_url + "?api_key=" + regToken,
        type: "video/mp4",
        label : "HD"
      });
    if (video.high_url)
      srcArray.push({
        src : video.high_url + "?api_key=" + regToken,
        type: "video/mp4",
        label : "HIGH"
      });
    if (video.low_url)
      srcArray.push({
        src : video.low_url + "?api_key=" + regToken,
        type: "video/mp4",
        label : "LOW"
      });
    srcArray[0].selected = true;
    jsVideo.src(srcArray);
  }

  jsVideo.ready(function() {

    $("#video-container").show();
    $("#video-title").text(currentVideo.name);

    if (video.saved_time && video.id != "live") {
      jsVideo.currentTime(video.saved_time);
      timerInterval = setInterval(updateVideoTime, 20000);
    }

    jsVideo.play();
    jsVideo.playbackRate(2);
    jsVideo.playbackRate(1);

  });

  jsVideo.requestFullscreen();

}

function updateVideoTime() {

  jsVideo.ready(function(){
    if (currentVideo.id != "live") {
      corsRequest("https://www.giantbomb.com/api/video/save-time/?api_key=" + regToken + "&video_id=" + currentVideo.id + "&time_to_save=" + jsVideo.currentTime(), function(data){
        // console.log(data);
      });
    }
  });
}

function closeVideo() {
  clearInterval(timerInterval);

  jsVideo.ready(function(){
    jsVideo.pause();
    if (currentVideo.id != "live") {
      corsRequest("https://www.giantbomb.com/api/video/save-time/?api_key=" + regToken + "&video_id=" + currentVideo.id + "&time_to_save=" + jsVideo.currentTime(), function(data){
        // console.log(data);
      });
      videos.forEach(function(video){
        if (video.id == currentVideo.id)
          video.saved_time = jsVideo.currentTime();
      });
      renderVideos();
    }
    $("#video-container").hide();
  });
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
  jsVideo = videojs("video-player", {
    controls:true,
    autoplay:false,
    preload:'auto',
    playbackRates:[1,1.25,1.5,2],
    children:['controlBar'],
    controlBar: {
      children: [
        "playToggle",
        "volumePanel",
        "progressControl",
        "qualitySelector",
        "playbackRateMenuButton",
        "fullscreenToggle"
      ]
    }
  });
  $(window).scroll(function(){
    if (readyToLoadMore && currentShow != "continue" && videos.length > 0 && $("#videos").height() + $("#videos").offset().top < $(this).height() + $(this).scrollTop() + 500) {
      readyToLoadMore = false;
      getVideosForShow(function(){
        renderVideos();
        readyToLoadMore = true;
      }, currentOffset + Constants.videosPerRequest);
    }
  });
});
