GbPodcast = function(apiPodcast) {
  this.title = apiPodcast.title;
  this.description = apiPodcast.description;
  this.updated = apiPodcast.updated;
  this.id = apiPodcast.id;
  this.url = apiPodcast.url;
  this.length = apiPodcast.length;
  this.image = apiPodcast.image;
  this.cssId = "podcast-id-" + this.id;
}

GbPodcast.prototype.getHtml = function(left) {
  var time = "<span class='video-time'>" + toHHMMSS(this.length) + "</span>";
  var image = this.image;
  var postedDate = "<span class='posted'>" + this.updated + "</span>";
  var datamp3 = "data-mp3='" + this.url + "' ";
  var savedTime = GbCache.getPodcastTime(this.id);
  var savedTimer = "";
  if (savedTime && savedTime > 0) {
    var width = Math.max(1,Math.min(Math.round(savedTime / this.length * 100),100));
    savedTimer = "<div class='video-timer'><span class='video-timer-marker' style='width:" + width + "%;'></span></div>";
  }
  return "<div class='podcast " + this.cssId + "' data-podcast-id='" + this.id + "' style='background-image:url(" + image + ");" + (left ? left : "") + "' " + datamp3 + "><a href='javascript:void(0)'>" + this.title + "</a>" + savedTimer + time + postedDate + "</div>";
}


GbPodcast.prototype.getMediaInformationHtml = function() {
  changeBackgroundImage(this.image);
  return "<h1>" + this.title + "</h1><p>" + $(this.description).text() + "</p>";
}

GbPodcast.prototype.getSrc = function() {
  return {
    src:currentPodcastEpisode.url,
    type:"audio/mp3"
  };
}

var podcastShows = [
  {
    name:"Giant Bombcast",
    rss:"https://www.giantbomb.com/podcast-xml/giant-bombcast"
  },
  {
    name:"Giant Bombcast Aftermath",
    rss:"https://www.giantbomb.com/podcast-xml/bombcast-aftermath"
  },
  {
    name:"Giant Beastcast",
    rss:"https://www.giantbomb.com/podcast-xml/beastcast"
  },
  {
    name:"Giantbomb Gaming Minute",
    rss:"https://www.giantbomb.com/podcast-xml/giant-bomb-gaming-minute"
  },
  {
    name:"Giantbomb Presents",
    rss:"https://www.giantbomb.com/podcast-xml/giant-bomb-presents"
  },
  {
    name:"8-4 Play",
    rss:"http://eightfour.libsyn.com/rss"
  },
  {
    name:"Bombin the AM With Scoops and the Wolf",
    rss:"https://www.giantbomb.com/podcast-xml/bombin-the-a-m-with-scoops-and-the-wolf"
  },
  {
    name:"Alt+F1",
    rss:"https://www.giantbomb.com/podcast-xml/altf1"
  }
];

var podcastCache = [];
var currentPodcast = 0;
var currentPodcastEpisode;
var currentlyPlayingPodcast;

function getPodcastItems(id, after) {
  
  checkPodcastCache(id, function(){
    requestInProgress = true;
    $.getFeed({
      url : Constants.corsProxy + podcastShows[id].rss,
      success : function(feed) {
        podcastCache[id] = [];
        podcastCache[id].cacheTime = Date.now();
        feed.items.forEach(function(item){
          podcastCache[id].push(new GbPodcast(item));
        });
        after(podcastCache[id]);
        requestInProgress = false;
      }
    });
  }, after);
}

function checkPodcastCache(id, request, callback) {

  var cacheValue = podcastCache[id];

  if (cacheValue) {
    callback(cacheValue);
  }
  if (!cacheValue || Date.now() - cacheValue.cacheTime > Constants.cacheTime) {
    request();
  }
}

function renderPodcasts() {
  var htmlString = "";
  for(var i=0; i< podcastShows.length; i++) {
    htmlString += "<div class='podcast' data-podcast-id='" + i + "' data-owl-index='" + i + "'><a href='javascript:void(0)'>" + podcastShows[i].name + "</a></div>";
  }
  owlShowInit(htmlString, podcastShows.length);
  resetVideoCarousel();
  
  $("#shows .podcast").off("click").on("click",function(){
    selectPodcast($(this).data("podcast-id"));
    owlShowGoTo($(this).data("owl-index"));
  });

  $("#shows .podcast[data-podcast-id='" + currentPodcast + "']").addClass("selected");
  owlShowJumpTo($(".podcast.selected").data("owl-index"));
  selectPodcast(currentPodcast);
  setNavBarMouseOverActions();
}

var selectPodcastTimeout;

function selectPodcast(id) {

  currentPodcast = id;
  $("#shows .podcast").removeClass("selected");
  $("#shows .podcast[data-podcast-id=" + id + "]").addClass("selected");

  if (selectPodcastTimeout)
      clearTimeout(selectPodcastTimeout);

  resetVideoCarousel();
  hideMediaView();
    
  selectPodcastTimeout = setTimeout(function(){

    $(".spinner").show();

    getPodcastItems(id, function(result){
    
      for (var i=0; i < 7; i++) {
        if (i > 4) {
          $("#videos .item[data-owl-index=" + i + "]").html(dummyVideo());
        } else {
          if (result[i])
            $("#videos .item[data-owl-index=" + i + "]").html(result[i].getHtml());
          else
            $("#videos .item[data-owl-index=" + i + "]").html(dummyVideo());
        }
      }
  
      $("#videos").show();
      
      currentPodcastEpisode = undefined;
      selectPodcastEpisode(result[0].id, false);
      $(".spinner").hide();
    });

  }, Constants.uiNavigationDelay);
}

function updateHiddenPodcasts() {
  var half = Math.round((Constants.itemsInCarousel - 1) / 2);
  for (var i = -half; i < half; i++) {
    var owlIndexToUse = currentPodcastEpisode.owlIndex + i;
    if (owlIndexToUse < 0)
      owlIndexToUse += Constants.itemsInCarousel;
    if (owlIndexToUse > Constants.itemsInCarousel -1)
      owlIndexToUse -= Constants.itemsInCarousel;
    if (podcastCache[currentPodcast][currentPodcastEpisode.arrayIndex + i]) {
      if ($("#videos ." + podcastCache[currentPodcast][currentPodcastEpisode.arrayIndex + i].cssId).length == 0) {
        $("#videos .item[data-owl-index=" + owlIndexToUse + "]").html(podcastCache[currentPodcast][currentPodcastEpisode.arrayIndex + i].getHtml());
      }
    } else {
      $("#videos .item[data-owl-index=" + owlIndexToUse + "]").html(dummyVideo());
    }
  }
  setPodcastClicks();
}

function setPodcastClicks() {
  $("#videos .podcast").off("click").on("click", function(){
    selectPodcastEpisode($(this).data("podcast-id"), $(this).parent().data("owl-index"));
  });
  setVideoMouseOverActions();
}

function selectPodcastEpisode(id, owlIndexToGoTo) {
  hideMediaView();
  $("#videos .podcast").removeClass("selected");
  for (var i = 0; i < podcastCache[currentPodcast].length; i++) {
    if (podcastCache[currentPodcast][i].id == id) {
      currentPodcastEpisode = podcastCache[currentPodcast][i];
      currentPodcastEpisode.arrayIndex = i;
      currentPodcastEpisode.owlIndex = owlIndexToGoTo;
    }
  }
  $(".podcast[data-podcast-id='" + currentPodcastEpisode.id + "']").addClass("selected");
  owlGoTo(owlIndexToGoTo);

  if (videoInformationTimeout)
    clearTimeout(videoInformationTimeout);

  videoInformationTimeout = setTimeout(function(){
    if (currentMenuOption == "podcasts") {
      $(".play-buttons").html('<a class="btn play" onclick="playButton()" href="javascript:void(0)"><span class="fa fa-play"></span> MP3</a>');
      $("#media-view").html(currentPodcastEpisode.getMediaInformationHtml());
      setButtonsMouseOverActions();
    }
  }, Constants.uiNavigationDelay);
  updateHiddenPodcasts();
}

function savePodcastTime() {
  if (currentlyPlayingPodcast && jsAudio.currentTime && jsAudio.currentTime > 10) {
    GbCache.savePodcastTime(currentlyPlayingPodcast.id, Math.round(jsAudio.currentTime));
    if ($("." + currentlyPlayingPodcast.cssId).length > 0) {
      var selected = $("." + currentlyPlayingPodcast.cssId).hasClass("selected");
      var active = $("." + currentlyPlayingPodcast.cssId).hasClass("active");
      $("." + currentlyPlayingPodcast.cssId).replaceWith(currentlyPlayingPodcast.getHtml("left:" + $("." + currentlyPlayingPodcast.cssId).css("left")));
      if (selected)
        $("." + currentlyPlayingPodcast.cssId).addClass("selected");
      if (active)
        $("." + currentlyPlayingPodcast.cssId).addClass("active");
      setPodcastClicks();
    }
  }
}

function playpodcast() {
  if ($("#video-container").is(":visible"))
    return false;

  currentlyPlayingPodcast = currentPodcastEpisode;
  jsAudio.setSrc(currentPodcastEpisode.getSrc());

  $("#audio-container").show();
  createTransportControls("#audio-container", currentPodcastEpisode.title);
  jsAudio.play();
  jsAudio.setCurrentTime(GbCache.getPodcastTime(currentPodcastEpisode.id));

  timerInterval = setInterval(savePodcastTime, 20000);

}

function stopPodcast() {

  if (timerInterval)
    clearInterval(timerInterval);
  
  jsAudio.pause();
  $("#audio-container").hide();

  if (currentUILevel == uiLevels.transport) {
    currentUILevel = uiLevels.buttons;
    changeUILevel();
  }
  
}
