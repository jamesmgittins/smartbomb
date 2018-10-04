var keyCodes = [
  { code: "37", value: "left" },
  { code: "38", value: "up" },
  { code: "39", value: "right" },
  { code: "40", value: "down" },
  { code: "32", value: "select" },
  { code: "27", value: "back" },
  { code: "461", value: "back" },
  { code: "415", value: "play" },
  { code: "19", value: "pause" },
  { code: "412", value: "rewind" },
  { code: "417", value: "fast_forward" }
];

var uiLevels = {
  topMenu : 0,
  navMenu : 1,
  videos : 2,
  buttons : 3,
  transport : 4
}

var currentUILevel = 0;
var cursorVisible = false;

function setKeyHandler() {
  document.onkeydown = function (e) {
    for (var i = 0; i < keyCodes.length; i++) {
      if (e.keyCode == keyCodes[i].code) {
        // console.log(keyCodes[i].value);
        switch (keyCodes[i].value) {
          case "up":
            up();
            break;

          case "down":
            down();
            break;

          case "left":
            left();
            break;

          case "right":
            right();
            break;

          case "select":
            selectButton();
            break;

          case "back":
            if ($("#search-form").is(":visible")) {
              $("#search-input").val("");
              $("#search-form").hide();
            }
            else if ($("#video-container").is(":visible")) {
              closeVideo();
            } else if ($("#audio-container").is(":visible")) {
              stopPodcast();
            } else {
              webOS.platformBack();
            }
            break;

          case "play":
            playPause();
            break;

          case "pause":
            playPause();
            break;

          case "rewind":
            seekVideo(-10);
            break;

          case "fast_forward":
            seekVideo(10);
            break;
        }
      }
    }
  };
  document.addEventListener("cursorStateChange", function (event) {
    cursorVisible = event.detail.visibility;

    if ($("#video-container").is(":visible")) {

    } else {
      if (cursorVisible) {
        removeCurrentActiveUiClass();
      } else {
        changeUILevel();
      }
    }
  }, false);
  document.addEventListener("mousemove", function (event) {
    if ($("#video-container").is(":visible")) {
      showControls();
    }
  }, false);

  if (!cursorVisible) {
    $("#top-menu .selected").addClass("active");
  }
}

function playPause() {
  if ($("#video-container").is(":visible")) {
    jsVideo.paused ? jsVideo.play() : jsVideo.pause();
    jsVideo.paused ? $(".transport span.fa-play").removeClass("fa-pause") : $(".transport span.fa-play").addClass("fa-pause");
  }
  if ($("#audio-container").is(":visible")) {
    jsAudio.paused ? jsAudio.play() : jsAudio.pause();
    jsAudio.paused ? $(".transport span.fa-play").removeClass("fa-pause") : $(".transport span.fa-play").addClass("fa-pause");
  }
  showControls();
}

function seekVideo(seekStep) {
  if ($("#video-container").is(":visible")) {
    jsVideo.setCurrentTime(jsVideo.getCurrentTime() + seekStep);
  }
  if ($("#audio-container").is(":visible")) {
    jsAudio.setCurrentTime(jsAudio.getCurrentTime() + seekStep);
  }
  showControls();
}

var videoControlsTimesout;

function showControls() {
  if (videoControlsTimesout)
    clearTimeout(videoControlsTimesout);
  
  $("#video-container .mejs__controls").removeClass("fadeout");
  videoControlsTimesout = setTimeout(function(){
    if (jsVideo && !jsVideo.paused)
      $("#video-container .mejs__controls").addClass("fadeout");
  }, 5000);
}

function removeCurrentActiveUiClass() {
  $("#top-menu .active").removeClass("active");
  $("#shows .show.active").removeClass("active");
  $("#shows .podcast.active").removeClass("active");
  $("#videos .video.active").removeClass("active");
  $("#videos .podcast.active").removeClass("active");
  $(".btn.active").removeClass("active");
  $(".transport span.active").removeClass("active");
}

function changeUILevel() {
  if ($("#enter-code").is(":visible") || $("#search-form").is(":visible"))
    return;
    removeCurrentActiveUiClass();
  switch (currentUILevel) {
    case uiLevels.topMenu:
      $("#top-menu .selected").addClass("active");
      break;

    case uiLevels.navMenu:
      $("#shows .selected").addClass("active");
      break;

    case uiLevels.videos:
      if ((currentMenuOption == "search" && !currentSearch) || !$("#videos").is(":visible")) {
        currentUILevel = uiLevels.navMenu;
        $("#shows .selected").addClass("active");
      } else
        $("#videos .selected").addClass("active");
      break;

    case uiLevels.buttons:
      if (currentMenuOption == "search" && !currentSearch) {
        currentUILevel = uiLevels.navMenu;
        $("#shows .selected").addClass("active");
      } else {
        if ($(".btn.play").length == 0) {

        } else if ($(".btn.play").length > 2) {
          $($(".btn.play").get(1)).addClass("active");
        } else {
          $(".btn.play").first().addClass("active");
        }
      }
      break;
    case uiLevels.transport:
      if ($("#audio-container").is(":visible")) {
        $("#audio-container .transport span.fa-play").addClass("active");
      }
      break;
  }
}

function up() {
  if ($("#search-form").is(":visible"))
    return;
  if ($("#video-container").is(":visible")) {
    showControls();
  } else {
    if (currentUILevel > 0)
      currentUILevel--;

    changeUILevel();
  }

}

function down() {
  if ($("#search-form").is(":visible"))
    return;
  if ($("#video-container").is(":visible")) {
    showControls();
  } else {
    if (currentUILevel < 3 || (currentUILevel < 4 && $("#audio-container").is(":visible")))
      currentUILevel++;

    changeUILevel();
  }

}

function left() {
  if ($("#enter-code").is(":visible")) {
    $("#enter-code input").focus();
    return;
  }
  if ($("#search-form").is(":visible"))
    return;
  if ($("#video-container").is(":visible")) {
    previousTransportControl();
  } else {
    switch (currentUILevel) {
      case uiLevels.topMenu:
        var prev = $("#top-menu .active").prev();
        if (prev.length > 0 && $(prev).is(":visible") && !requestInProgress) {
          $("#top-menu .active").removeClass("active");
          prev.addClass("active");
          prev.click();
        }
        break;

      case uiLevels.navMenu:
        if (!requestInProgress) {
          previousShow();
        }
        break;

      case uiLevels.videos:
        previousVideo();
        break;

      case uiLevels.buttons:
        var prev = $(".play-buttons a.active").prev();
        if (prev.length > 0) {
          $(".play-buttons a.active").removeClass("active");
          prev.addClass("active");
        }
        break;
      case uiLevels.transport:
        previousTransportControl();
        break;
    }
  }
}

function right() {
  if ($("#enter-code").is(":visible")) {
    $("#enter-code .btn").focus().addClass("active");
    return;
  }
  if ($("#search-form").is(":visible"))
    return;
  if ($("#video-container").is(":visible")) {
    nextTransportControl();
  } else {
    switch (currentUILevel) {
      case uiLevels.topMenu:
        var next = $("#top-menu .active").next();
        if (next.length > 0 && !requestInProgress) {
          $("#top-menu .active").removeClass("active");
          next.addClass("active");
          next.click();
        }
        break;

      case uiLevels.navMenu:
        if (!requestInProgress) {
          nextShow();
        }
        break;

      case uiLevels.videos:
        nextVideo();
        break;

      case uiLevels.buttons:
        var next = $(".play-buttons a.active").next();
        if (next.length > 0) {
          $(".play-buttons a.active").removeClass("active");
          next.addClass("active");
        }
        break;
      case uiLevels.transport:
        nextTransportControl();
        break;
    }
  }
}


function selectButton() {
  if (!cursorVisible && !$("#search-form").is(":visible"))
    if ($("#video-container").is(":visible")) {
      if ($(".transport span.active").length == 0) {
        $(".transport span.fa-play").addClass("active");
      } else {
        $(".transport span.active").click();
      }
    } else {
      $(".active").click();
    }
}

function dummyVideo() {
  return "<div class='video disabled'></div>"
}

var topMenuTimeout;

function setTopMenuClicks() {
  $("#top-menu .menu-option").click(function () {
    if (!requestInProgress) {
      $("#search-form").hide();
      var clicked = $(this).data("menu-option");

      if (clicked == currentMenuOption)
        return;

      currentMenuOption = clicked;
      resetVideoCarousel();
      hideMediaView();

      if (videoInformationTimeout)
        clearTimeout(videoInformationTimeout);

      if (topMenuTimeout)
        clearTimeout(topMenuTimeout);

      $("#shows *").fadeOut();

      topMenuTimeout = setTimeout(function () {
        if (clicked == "podcasts")
          renderPodcasts();
        else if (clicked == "search")
          renderSearchHistory();
        else {
          currentlyPlayingVideo = undefined;
          renderShows(getVideos);
        }
      }, Constants.uiNavigationDelay);

      $("#top-menu .menu-option").removeClass("selected");
      $("#top-menu .menu-option[data-menu-option='" + clicked + "']").addClass("selected");

    }
  });
}

function setTopMenuMouseOverActions() {
  $("#top-menu .menu-option").off("mouseenter mouseleave").hover(function () {
    removeCurrentActiveUiClass()
    $(this).addClass("active");
    currentUILevel = 0;
  }, function () {
    removeCurrentActiveUiClass();
  });
}

function setNavBarMouseOverActions() {
  $("#shows div.show, #shows div.podcast").off("mouseenter mouseleave").hover(function () {
    removeCurrentActiveUiClass()
    $(this).addClass("active");
    currentUILevel = 1;
  }, function () {
    removeCurrentActiveUiClass();
  });
}

function setVideoMouseOverActions() {
  $("#videos .podcast, #videos .video").off("mouseenter mouseleave").hover(function () {
    removeCurrentActiveUiClass();
    $(this).addClass("active");
    currentUILevel = 2;
  }, function () {
    removeCurrentActiveUiClass();
  });
}

function setButtonsMouseOverActions() {
  $(".play-buttons .btn").off("mouseenter mouseleave").hover(function () {
    removeCurrentActiveUiClass();
    $(this).addClass("active");
    currentUILevel = 3;
  }, function () {
    removeCurrentActiveUiClass();
  });
}

function setVideoClicks() {
  $("#videos .video:not(.disabled)").off("click").on("click", function () {
    // console.log("video clicked");
    var id = $(this).data("video-id");
    selectVideo(id, $(this).parent().data("owl-index"));
  });
  setVideoMouseOverActions();
}

function hideMediaView() {
  $("#no-results").hide();
  $(".play-buttons").html("");
  $("#media-view").html("");
  fadeoutBackgroundImage();
}

function fadeoutBackgroundImage() {
  imageReadyToSwap = false;
  $(".bg-image").removeClass("fadein")
  $(".bg-image").addClass("fadeout");
}

function changeBackgroundImage(src) {
  var tmpImg = new Image();
  tmpImg.src = src;
  tmpImg.onload = function () {
    $(".bg-image").removeClass("fadeout");
    $(".bg-image").attr("src", src);
    $(".bg-image").show();
    void $(".bg-image")[0].offsetWidth;
    $(".bg-image").addClass("fadein");
  }
}

function resetVideoCarousel() {
  $("#videos").hide();
  owlResetPositions();
}

function nextShow() {
  if (!readyToSelectAShow || requestInProgress)
    return;
  readyToSelectAShow = false;

  var max = 0;
  $("#shows [data-owl-index]").each(function () {
    if ($(this).data("owl-index") > max)
      max = $(this).data("owl-index");
  })
  var owlIndex = $("#shows .selected[data-owl-index]").data("owl-index") + 1;

  if (owlIndex > max)
    owlIndex = 0;

  $("#shows [data-owl-index]").removeClass("active");
  $("#shows [data-owl-index='" + owlIndex + "']").addClass("active").first().click();
}

function previousShow() {
  if (!readyToSelectAShow || requestInProgress)
    return;

  readyToSelectAShow = false;

  var max = 0;
  $("#shows [data-owl-index]").each(function () {
    if ($(this).data("owl-index") > max)
      max = $(this).data("owl-index");
  })
  var owlIndex = $("#shows .selected[data-owl-index]").data("owl-index") - 1;

  if (owlIndex < 0)
    owlIndex = max;

  $("#shows [data-owl-index]").removeClass("active");
  $("#shows [data-owl-index='" + owlIndex + "']").addClass("active").first().click();
}

function transportControlClick(control) {
  showControls();
  if (control == "play-pause") {
    if ($("#video-container").is(":visible")) {
      if (jsVideo.paused) {
        jsVideo.play();
        $(".transport span.fa-play").addClass("fa-pause");
      } else {
        jsVideo.pause();
        $(".transport span.fa-play").removeClass("fa-pause");
      }
    } else if ($("#audio-container").is(":visible")) {
      if (jsAudio.paused) {
        jsAudio.play();
        $(".transport span.fa-play").addClass("fa-pause");
      }
      else {
        jsAudio.pause();
        $(".transport span.fa-play").removeClass("fa-pause");
      } 
    }
    
  } else if (control == "stop") {
    if ($("#video-container").is(":visible")) {
      closeVideo();
    } else if ($("#audio-container").is(":visible"))  {
      stopPodcast();
    }
  } else {
    if ($("#video-container").is(":visible")) {
      jsVideo.setCurrentTime(jsVideo.getCurrentTime() + control);
    } else if ($("#audio-container").is(":visible"))  {
      jsAudio.setCurrentTime(jsAudio.getCurrentTime() + control);
    }
  }
}

function previousTransportControl() {
  showControls();
  if ($(".transport span.active").length == 0) {
    $(".transport span.fa-play").addClass("active");
  } else {
    var prev = $(".transport span.active").prev();

    if (prev.length > 0) {
      $(".transport span.active").removeClass("active");
      prev.addClass("active");
    }
  }
}

function nextTransportControl() {
  showControls();
  if ($(".transport span.active").length == 0) {
    $(".transport span.fa-play").addClass("active");
  }

  var next = $(".transport span.active").next();

  if (next.length > 0 && !next.hasClass("title")) {
    $(".transport span.active").removeClass("active");
    next.addClass("active");
  }
}

function createTransportControls(target, title) {

  if ($(target+ " .mejs__controls .transport").length > 0) {
    $(target+ " .mejs__controls .transport").remove();
  }

  if (!cursorVisible) {
    removeCurrentActiveUiClass();
    currentUILevel = uiLevels.transport;
  }
    

  var htmlString = "<div class='transport'>" +
                    "<span class='fa fa-fast-backward' data-transport='-120'></span>" +
                    "<span class='fa fa-step-backward' data-transport='-10'></span>" +
                    "<span class='fa fa-stop' data-transport='stop'></span>" +
                    "<span class='fa fa-pause fa-play " + (cursorVisible ? "" : "active") + "' data-transport='play-pause'></span>" +
                    "<span class='fa fa-step-forward' data-transport='10'></span>" +
                    "<span class='fa fa-fast-forward' data-transport='120'></span>" +
                    "<span class='title'><span>" + title + "</span></span>" +
                  "</div>";

  $(target+ " .mejs__controls").prepend(htmlString);

  $(target + " .transport > span.fa").hover(function(){
    $(".transport > span.fa").removeClass("active");
    $(this).addClass("active");
    currentUILevel = uiLevels.transport;
  },function(){
    $(this).removeClass("active");
  });

  $(target + " .transport > span.fa").click(function(){
    transportControlClick($(this).data('transport'));
  });
}