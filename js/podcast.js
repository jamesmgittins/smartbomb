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
  return "<div class='podcast " + this.cssId + "' data-podcast-id='" + this.id + "' style='background-image:url(" + image + ");" + (left ? left : "") + "' " + datamp3 + "><a href='javascript:void(0)'>" + this.title + "</a>" + time + postedDate + "</div>";
}


GbPodcast.prototype.getMediaInformationHtml = function() {
  changeBackgroundImage(this.image);
  return "<h1>" + this.title + "</h1><p>" + this.description + "</p>";
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
      
      currentlyPlayingPodcast = undefined;
      selectPodcastEpisode(result[0].id, false);
      $(".spinner").hide();
    });

  }, 800);
}

function updateHiddenPodcasts() {
  var half = Math.round((Constants.itemsInCarousel - 1) / 2);
  for (var i = -half; i < half; i++) {
    var owlIndexToUse = currentlyPlayingPodcast.owlIndex + i;
    if (owlIndexToUse < 0)
      owlIndexToUse += Constants.itemsInCarousel;
    if (owlIndexToUse > Constants.itemsInCarousel -1)
      owlIndexToUse -= Constants.itemsInCarousel;
    if (podcastCache[currentPodcast][currentlyPlayingPodcast.arrayIndex + i]) {
      if ($("#videos ." + podcastCache[currentPodcast][currentlyPlayingPodcast.arrayIndex + i].cssId).length == 0) {
        $("#videos .item[data-owl-index=" + owlIndexToUse + "]").html(podcastCache[currentPodcast][currentlyPlayingPodcast.arrayIndex + i].getHtml());
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
      currentlyPlayingPodcast = podcastCache[currentPodcast][i];
      currentlyPlayingPodcast.arrayIndex = i;
      currentlyPlayingPodcast.owlIndex = owlIndexToGoTo;
    }
  }
  $(".podcast[data-podcast-id='" + currentlyPlayingPodcast.id + "']").addClass("selected");
  owlGoTo(owlIndexToGoTo);

  if (videoInformationTimeout)
    clearTimeout(videoInformationTimeout);

  videoInformationTimeout = setTimeout(function(){
    if (currentMenuOption == "podcasts") {
      $(".play-buttons").html('<a class="btn play" onclick="playButton()" href="javascript:void(0)">&#9654; mp3</a>');
      $("#media-view").html(currentlyPlayingPodcast.getMediaInformationHtml());
      setButtonsMouseOverActions();
    }
  },500);
  updateHiddenPodcasts();
}

function playpodcast() {
  if ($("#video-container").is(":visible"))
    return false;

  jsAudio.setSrc({
    src:currentlyPlayingPodcast.url,
    type:"audio/mp3"
  });

  $("#audio-container").show();
  $("#audio-title").text(currentlyPlayingPodcast.title);
  jsAudio.play();

}

function stopPodcast() {
  
  jsAudio.pause();
  $("#audio-container").hide();
  
}
