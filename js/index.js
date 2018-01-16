var Constants = {
  webOsMode: true,
  corsProxy: "",
  appName: "smartbomb",
  cacheTime: 120000,
  liveVideoCheckTime: 60000,
  videosLimit: "&limit=30",
  videosPerRequest: 30,
  itemsInCarousel: 11,
  minCarouselTime: 80,
  testLiveStream: true,
  freeApi:"",
  debugKey:"3298w98hfajsdo02!"
};

var currentMenuOption = "videos";

var extraVideoCategories = [
  { id: "all", name: "Latest Videos" },
  { id: "continue", name: "Continue Watching" }
];
var videoCategories = [];

var currentCategory = "all";

var regToken;
var videoShows = [];
var currentShow;
var currentVideo;
var currentlyPlayingVideo;

var videos = [];
var currentOffset = 0;

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
var jsVideo, jsAudio;

function renderShows(callback) {
  var htmlString = "";

  var wasActive = $("#shows .active").length > 0;

  if (currentMenuOption == "live") {
    $("#shows").html(renderShow("live", "Live Streams"));
    $("#shows").show();
    $(".show[data-show-id='live']").addClass("selected");
    if (wasActive) {
      $(".show[data-show-id='live']").addClass("active");
    }
    carouseliseShows();
  }

  if (currentMenuOption == "videos") {
    videoCategories.forEach(function (show) {
      htmlString += renderShow(show.id, show.name, true);
    });
    $("#shows").html(htmlString);
    $("#shows").show();
    $(".show[data-show-id='" + currentCategory + "']").addClass("selected");
    if (wasActive) {
      $(".show[data-show-id='" + currentCategory + "']").addClass("active");
    }
    $("#shows .show").click(function (event) {
      selectShow($(this).data("show-id"), $(this).hasClass("category"));
    });
    carouseliseShows();
  }

  if (currentMenuOption == "shows") {
    getVideoShows(function () {

      videoShows.forEach(function (show) {
        htmlString += renderShow(show.id, show.title);
      });
      $("#shows").html(htmlString);
      $("#shows").show();

      $("#shows .show").click(function (event) {
        selectShow($(this).data("show-id"), $(this).hasClass("category"));
      });
      if (!currentShow)
        currentShow = videoShows[0].id;

      $(".show[data-show-id='" + currentShow + "']").addClass("selected");
      if (wasActive) {
        $(".show[data-show-id='" + currentShow + "']").addClass("active");
      }

      carouseliseShows();
    });
  }

  setNavBarMouseOverActions();

  if (callback) {
    callback();
  }

}

function renderShow(id, name, isCategory) {
  var classes = isCategory ? "show category" : "show";
  return "<div class='" + classes + "' data-show-id='" + id + "'><a href='javascript:void(0)'>" + name + "</a></div>";
}

var showSelectTimeout;
function selectShow(show, isCategory) {
  if ($("#video-container").is(":visible"))
    return false;

  currentlyPlayingVideo = undefined;

  hideMediaView();

  stopLoadingContinueVideos = true;
  if (((isCategory && currentCategory != show) || (!isCategory && currentShow != show)) && !requestInProgress) {
    $("#shows .show").removeClass("selected");
    if (isCategory) {
      currentCategory = show;
      $(".show.category[data-show-id='" + show + "']").addClass("selected");
    }
    else {
      currentShow = show;
      $(".show:not(.category)[data-show-id='" + show + "']").addClass("selected");
    }
    resetVideoCarousel();
    carouselAnimate();
    if (showSelectTimeout)
      clearTimeout(showSelectTimeout);

    showSelectTimeout = setTimeout(function () { getVideos(); }, 800);
  }

}

function renderVideos() {
  // console.log("render videos");
  if (currentMenuOption == "podcasts")
    return;

  if (videos.length == 0) {
    $("#no-results").show();
    resetVideoCarousel();
    return;
  }

  for (var i = 0; i < 7; i++) {
    if (i > 4) {
      $("#videos .item[data-owl-index=" + i + "]").html(dummyVideo());
    } else {
      if (videos[i])
        $("#videos .item[data-owl-index=" + i + "]").html(videos[i].getHtml());
      else
        $("#videos .item[data-owl-index=" + i + "]").html(dummyVideo());
    }
  }

  $("#videos").show();
  if (!currentlyPlayingVideo) {
    currentlyPlayingVideo = videos[0];
    currentlyPlayingVideo.arrayIndex = 0;
  }


  selectVideo(currentlyPlayingVideo.id, 0);
  setVideoClicks();
}

var videoInformationTimeout;

function selectVideo(id, owlIndexGoTo) {

  hideMediaView();

  $("#videos .video").removeClass("selected");
  for (var i = 0; i < videos.length; i++) {
    if (videos[i].id == id) {
      currentlyPlayingVideo = videos[i];
      currentlyPlayingVideo.arrayIndex = i;
      currentlyPlayingVideo.owlIndex = owlIndexGoTo;
    }
  }
  $("." + currentlyPlayingVideo.cssId).addClass("selected");
  owlGoTo(owlIndexGoTo);

  if (videoInformationTimeout)
    clearTimeout(videoInformationTimeout);

  videoInformationTimeout = setTimeout(function () {
    if (currentlyPlayingVideo) {
      $(".play-buttons").html(currentlyPlayingVideo.getPlayButtons());
      $("#media-view").html(currentlyPlayingVideo.getMediaInformationHtml());
      setButtonsMouseOverActions();
    }
  }, 500);

  getMoreVideos();

  updateHiddenVideos();
}

function updateHiddenVideos() {
  var half = Math.round((Constants.itemsInCarousel - 1) / 2);
  for (var i = -half; i < half; i++) {
    var owlIndexToUse = currentlyPlayingVideo.owlIndex + i;
    if (owlIndexToUse < 0)
      owlIndexToUse += Constants.itemsInCarousel;
    if (owlIndexToUse > Constants.itemsInCarousel - 1)
      owlIndexToUse -= Constants.itemsInCarousel;
    if (videos[currentlyPlayingVideo.arrayIndex + i]) {
      if ($("#videos ." + videos[currentlyPlayingVideo.arrayIndex + i].cssId).length == 0) {
        $("#videos .item[data-owl-index=" + owlIndexToUse + "]").html(videos[currentlyPlayingVideo.arrayIndex + i].getHtml());
      }
    } else {
      $("#videos .item[data-owl-index=" + owlIndexToUse + "]").html(dummyVideo());
    }
  }

  setVideoClicks();
}
var readyToMove = true;

function nextVideo() {
  if (!readyToMove)
    return;
  readyToMove = false;
  if (currentMenuOption == "podcasts") {
    if (podcastCache[currentPodcast][currentlyPlayingPodcast.arrayIndex + 1]) {
      selectPodcastEpisode(podcastCache[currentPodcast][currentlyPlayingPodcast.arrayIndex + 1].id, currentlyPlayingPodcast.owlIndex + 1 > Constants.itemsInCarousel - 1 ? 0 : currentlyPlayingPodcast.owlIndex + 1);
      $("#videos .podcast").removeClass("active");
      $("." + currentlyPlayingPodcast.cssId).addClass("active");
    }
  } else {
    if (videos[currentlyPlayingVideo.arrayIndex + 1]) {
      selectVideo(videos[currentlyPlayingVideo.arrayIndex + 1].id, currentlyPlayingVideo.owlIndex + 1 > Constants.itemsInCarousel - 1 ? 0 : currentlyPlayingVideo.owlIndex + 1);
      $("#videos .video").removeClass("active");
      $("." + currentlyPlayingVideo.cssId).addClass("active");
    }
  }
  setTimeout(function () {
    readyToMove = true;
  }, Constants.minCarouselTime);

}

function previousVideo() {
  if (!readyToMove)
    return;
  readyToMove = false;
  if (currentMenuOption == "podcasts") {
    if (podcastCache[currentPodcast][currentlyPlayingPodcast.arrayIndex - 1]) {
      selectPodcastEpisode(podcastCache[currentPodcast][currentlyPlayingPodcast.arrayIndex - 1].id, currentlyPlayingPodcast.owlIndex - 1 < 0 ? Constants.itemsInCarousel - 1 : currentlyPlayingPodcast.owlIndex - 1);
      $("#videos .podcast").removeClass("active");
      $("." + currentlyPlayingPodcast.cssId).addClass("active");
    }
  } else {
    if (videos[currentlyPlayingVideo.arrayIndex - 1]) {
      selectVideo(videos[currentlyPlayingVideo.arrayIndex - 1].id, currentlyPlayingVideo.owlIndex - 1 < 0 ? Constants.itemsInCarousel - 1 : currentlyPlayingVideo.owlIndex - 1);
      $("#videos .video").removeClass("active");
      $("." + currentlyPlayingVideo.cssId).addClass("active");
    }
  }
  setTimeout(function () {
    readyToMove = true;
  }, Constants.minCarouselTime);
}

function getMoreVideos() {
  switch (currentMenuOption) {
    case "search":
    if (!requestInProgress && videos.length > 0 && nearEndOfVideos() && videos.length < videos.total) {
      currentPage++;
      getVideosForSearch(function(){
        updateHiddenVideos();
      });
    }
    break;
    case "podcasts":
    break;
    case "live":
    break;
    default:
    if (!requestInProgress && currentCategory != "continue" && videos.length > 0 && nearEndOfVideos()) {
      getVideosForShow(function () {
        // renderVideos();
        updateHiddenVideos();
      }, currentOffset + Constants.videosPerRequest);
    }
    break;
  }
}


function playButton(quality) {
  switch (currentMenuOption) {
    case "live":
      playVideo();
      break;
    case "videos":
      playVideo(quality);
      break;
    case "shows":
      playVideo(quality);
      break;
    case "podcasts":
      playpodcast();
      break;
    case "search":
      playVideo(quality);
      break;
  }
}

function playVideo(quality) {
  if ($("#video-container").is(":visible"))
    return false;

  $("#video-player").show();

  stopPodcast();

  if (currentlyPlayingVideo.live) {
    jsVideo.setSrc({ src: currentlyPlayingVideo.stream + "?api_key=" + regToken, type: "application/x-mpegURL" });
  } else {
    var src;
    if (currentlyPlayingVideo.youtube)
      src = {
        src: "https://www.youtube.com/embed/" + currentlyPlayingVideo.youtube,
        type: "video/youtube"
      };
    if (currentlyPlayingVideo.hdUrl && quality == "hd" || !src)
      src = {
        src: currentlyPlayingVideo.hdUrl + "?api_key=" + regToken,
        type: "video/mp4"
      };
    if (currentlyPlayingVideo.highUrl && quality == "high" || !src)
      src = {
        src: currentlyPlayingVideo.highUrl + "?api_key=" + regToken,
        type: "video/mp4"
      };
    if (currentlyPlayingVideo.lowUrl && quality == "low" || !src)
      src = {
        src: currentlyPlayingVideo.lowUrl + "?api_key=" + regToken,
        type: "video/mp4"
      };
    jsVideo.setSrc(src);
  }

  // jsVideo.ready(function () {

    $("#video-container").show();
    // jsVideo.poster("standby.jpg");
    jsVideo.play();

    if (!currentlyPlayingVideo.live) {
      if (currentlyPlayingVideo.savedTime) {
        jsVideo.currentTime = currentlyPlayingVideo.savedTime;
      } else {
        jsVideo.currentTime = 0;
      }
      timerInterval = setInterval(updateVideoTime, 20000);
    }


  // });

  // jsVideo.requestFullscreen();
  // jsVideo.enterFullScreen();

}

function closeVideo() {
  clearInterval(timerInterval);

  // jsVideo.ready(function () {
    jsVideo.pause();
    if (currentlyPlayingVideo && !currentlyPlayingVideo.live) {
      corsRequest("https://www.giantbomb.com/api/video/save-time/?api_key=" + regToken + "&video_id=" + currentlyPlayingVideo.id + "&time_to_save=" + jsVideo.currentTime, function (data) {
        // console.log(data);
      });
      videos.forEach(function (video) {
        if (video.id == currentlyPlayingVideo.id)
          video.savedTime = jsVideo.currentTime;
      });
      $("." + currentlyPlayingVideo.cssId).replaceWith(currentlyPlayingVideo.getHtml("left:" + $("." + currentlyPlayingVideo.cssId).css("left")));
      $("." + currentlyPlayingVideo.cssId).addClass("selected");
      setVideoClicks();
    }
    $("#video-container").hide();
  // });

}

function registerApp() {
  $(".spinner").show();
  var linkCode = $("#app-code").val();
  if (linkCode == Constants.debugKey) {
    regToken = Constants.freeApi;
    GbCache.saveRegToken(regToken);
    $("#reg-status").text("Success!");
    $("#enter-code").fadeOut();
    startApplication();
  } else
  $.getJSON(Constants.corsProxy + 'https://www.giantbomb.com/app/' + Constants.appName + '/get-result?format=json&regCode=' + linkCode, function (result) {
    if (result.status == "success") {
      regToken = result.regToken;
      GbCache.saveRegToken(regToken);
      $("#reg-status").text("Success!");
      $("#enter-code").fadeOut();
      startApplication();
    } else {
      $("#reg-status").text("Uh oh! Something went wrong, maybe the code has expired? Please try again.");
    }
  }).always(function () {
    $(".spinner").hide();
  });
}

function startApplication() {
  getVideoCategories(function () {
    getLiveStream(function () {
      renderShows(getVideos);
    });
  });
  $("#top-menu").show();
}

function nearEndOfVideos() {
  return currentlyPlayingVideo.arrayIndex > videos.length - 10;
}

$(function () {
  regToken = GbCache.getRegToken();
  if (regToken) {
    $("#enter-code").hide();
    startApplication();
  } else {
    $("#enter-code").show();
    $("#enter-code input").focus();
  }
  setKeyHandler();
  setTopMenuClicks();
  setTopMenuMouseOverActions();
  jsVideoInitialSetup();
  owlInit();
});
