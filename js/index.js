var Constants = {
  webOsMode: true,
  corsProxy: "https://cors.jamesgittins.com/",
  appName: "smartbomb",
  cacheTime: 300000,
  liveVideoCheckTime: 60000,
  videosLimit: "&limit=30",
  videosPerRequest: 30,
  itemsInCarousel: 11,
  testLiveStream: false,
  debugKey:"D3BUG!",
  uiNavigationDelay : 1000
};

var premiumUser = true;
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

  var wasActive = $("#shows .show.active").length > 0;

  if (currentMenuOption == "live") {
    owlShowInit(renderShow("live", "Live Streams", false, 0), 1);
    
    $("#shows").show();
    $(".show[data-show-id='live']").addClass("selected");
    if (wasActive) {
      $(".show[data-show-id='live']").addClass("active");
    }
  }

  if (currentMenuOption == "videos") {
    var owlIndex = 0;
    videoCategories.forEach(function (show) {
      htmlString += renderShow(show.id, show.name, true, owlIndex++);
    });
    
    owlShowInit(htmlString);
    $("#shows").show();
    $(".show[data-show-id='" + currentCategory + "']").addClass("selected");
    if (wasActive) {
      $(".show[data-show-id='" + currentCategory + "']").addClass("active");
    }
    
    owlShowJumpTo($(".show.selected").data("owl-index"));
    
    
    $("#shows .show").click(function (event) {
      selectShow($(this).data("show-id"), $(this).hasClass("category"));
      owlShowGoTo($(this).data("owl-index"));
    });
  }

  if (currentMenuOption == "shows") {
    getVideoShows(function () {
      var owlIndex = 0;
      videoShows.forEach(function (show) {
        htmlString += renderShow(show.id, show.title, false, owlIndex++);
      });
      owlShowInit(htmlString);
      $("#shows").show();

      $("#shows .show").click(function (event) {
        selectShow($(this).data("show-id"), $(this).hasClass("category"));
        owlShowGoTo($(this).data("owl-index"));
      });
      if (!currentShow)
        currentShow = videoShows[0].id;

      $(".show[data-show-id='" + currentShow + "']").addClass("selected");
      if (wasActive) {
        $(".show[data-show-id='" + currentShow + "']").addClass("active");
      }
      owlShowJumpTo($(".show.selected").data("owl-index"));
    });
  }

  setNavBarMouseOverActions();

  if (callback) {
    callback();
  }

}

function renderShow(id, name, isCategory, owlIndex) {
  var classes = isCategory ? "show category" : "show";
  return "<div class='" + classes + "' data-show-id='" + id + "' data-owl-index='" + owlIndex + "'><a href='javascript:void(0)'>" + name + "</a></div>";
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
    if (showSelectTimeout)
      clearTimeout(showSelectTimeout);

    showSelectTimeout = setTimeout(function () { 
      getVideos();
    }, Constants.uiNavigationDelay);
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
  }, Constants.uiNavigationDelay);

  getMoreVideos();

  updateHiddenVideos();
}

function updateHiddenVideos() {
  if (!currentlyPlayingVideo)
    return;
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
  
  if (currentMenuOption == "podcasts") {
    if (podcastCache[currentPodcast][currentPodcastEpisode.arrayIndex + 1]) {
      readyToMove = false;
      selectPodcastEpisode(podcastCache[currentPodcast][currentPodcastEpisode.arrayIndex + 1].id, currentPodcastEpisode.owlIndex + 1 > Constants.itemsInCarousel - 1 ? 0 : currentPodcastEpisode.owlIndex + 1);
      $("#videos .podcast").removeClass("active");
      $("." + currentPodcastEpisode.cssId).addClass("active");
    }
  } else {
    if (videos[currentlyPlayingVideo.arrayIndex + 1]) {
      readyToMove = false;
      selectVideo(videos[currentlyPlayingVideo.arrayIndex + 1].id, currentlyPlayingVideo.owlIndex + 1 > Constants.itemsInCarousel - 1 ? 0 : currentlyPlayingVideo.owlIndex + 1);
      $("#videos .video").removeClass("active");
      $("." + currentlyPlayingVideo.cssId).addClass("active");
    } 
  }
}

function previousVideo() {
  if (!readyToMove)
    return;
  
  if (currentMenuOption == "podcasts") {
    if (podcastCache[currentPodcast][currentPodcastEpisode.arrayIndex - 1]) {
      readyToMove = false;
      selectPodcastEpisode(podcastCache[currentPodcast][currentPodcastEpisode.arrayIndex - 1].id, currentPodcastEpisode.owlIndex - 1 < 0 ? Constants.itemsInCarousel - 1 : currentPodcastEpisode.owlIndex - 1);
      $("#videos .podcast").removeClass("active");
      $("." + currentPodcastEpisode.cssId).addClass("active");
    }
  } else {
    if (videos[currentlyPlayingVideo.arrayIndex - 1]) {
      readyToMove = false;
      selectVideo(videos[currentlyPlayingVideo.arrayIndex - 1].id, currentlyPlayingVideo.owlIndex - 1 < 0 ? Constants.itemsInCarousel - 1 : currentlyPlayingVideo.owlIndex - 1);
      $("#videos .video").removeClass("active");
      $("." + currentlyPlayingVideo.cssId).addClass("active");
    }
  }
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

  $("#video-container").html('<video id="video-player" autoplay preload="metadata" poster="standby.jpg"></video>');

  stopPodcast();

  var youtubeOptions = {};
  if (quality == "youtube" && currentlyPlayingVideo.savedTime)
    youtubeOptions.start = Math.round(currentlyPlayingVideo.savedTime);

  mediaElementVideoSetup(function(){
    $("#video-container").show();
    jsVideo.setSrc(currentlyPlayingVideo.getSrc(quality))
    jsVideo.play();

    if (!currentlyPlayingVideo.live) {
      if (currentlyPlayingVideo.savedTime) {
        jsVideo.setCurrentTime(currentlyPlayingVideo.savedTime);
      }
      timerInterval = setInterval(updateVideoTime, 20000);
    }

    showControls();
    createTransportControls("#video-container", currentlyPlayingVideo.name);

    setTimeout(function(){
      if ($("iframe").length > 0)
        $("iframe")[0].contentDocument.addEventListener('mousemove', function (event) {
          showControls();
        }.bind(this));
    },5000);

  }, youtubeOptions);

}

function closeVideo() {
  if (timerInterval)
    clearInterval(timerInterval);

  jsVideo.pause();
  if (currentlyPlayingVideo && !currentlyPlayingVideo.live) {
    updateVideoTime();
    videos.forEach(function (video) {
      if (video.id == currentlyPlayingVideo.id)
        video.savedTime = Math.round(jsVideo.currentTime);
    });
    $("." + currentlyPlayingVideo.cssId).replaceWith(currentlyPlayingVideo.getHtml("left:" + $("." + currentlyPlayingVideo.cssId).css("left")));
    $("." + currentlyPlayingVideo.cssId).addClass("selected");
    setVideoClicks();
  }
  $("#video-container").hide();

  if (currentUILevel == uiLevels.transport) {
    currentUILevel = uiLevels.buttons;
    changeUILevel();
  }
}

function registerApp() {
  $(".spinner").show();
  var linkCode = $("#app-code").val();
  if (linkCode == Constants.debugKey) {
    $.getJSON(Constants.corsProxy + 'http://jamesgittins.com/js/gb-api.json', function (result) {
    if (result.key) {
      regToken = result.key;
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
  getLiveStream(function(){
    getVideoCategories(function () {
      getVideoShows(function () {
        renderShows(getVideos);
      });
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
  mediaElementSetup();
  owlInit();
});

function openBrowser(url) {
  var request = webOS.service.request("luna://com.webos.applicationManager", {
    method: "launch",
    parameters: {
        "id": "com.webos.app.browser",
        "params": {
            "target": url,
        }
    },
    onFailure: function (inError) {
        console.log("Failed to launch the browser");
        console.log("[" + inError.errorCode + "]: " + inError.errorText);
        return;
    }
  });
}