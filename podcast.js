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
var currentPodcast;

function getPodcastItems(id, after) {
  checkPodcastCache(id, function(){
    $.getFeed({
      url : "https://cors.jamesgittins.com/" + podcastShows[id].rss,
      success : function(feed) {
        feed.cacheTime = Date.now();
        podcastCache[id] = feed;
        after(feed);
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
  $("#shows").hide();
  $("#podcasts").show();
  currentPodcast = undefined;
  var htmlString = "";
  for(var i=0; i< podcastShows.length; i++) {
    htmlString += "<div class='podcast' data-podcast-id='" + i + "'><a href='javascript:void(0)'>" + podcastShows[i].name + "</a></div>";
  }
  $("#podcasts").html(htmlString);
  $("#videos").html("");
  $("#podcasts .podcast").click(function(event){
    selectPodcast($(this).data("podcast-id"));
  });
  selectPodcast(0);
}

function selectPodcast(id) {
  if ($("#video-container").is(":visible") || currentPodcast == id)
    return false;

  currentPodcast = id;
  podcastEpidodesToShow = Constants.videosPerRequest;
  $("#podcasts .podcast").removeClass("selected");
  $("#podcasts .podcast[data-podcast-id=" + id + "]").addClass("selected");

  $(".spinner").show();
  getPodcastItems(id, function(result){
    var htmlString = "";

    var numberToRender = Math.min(podcastEpidodesToShow, result.items.length);

    for (var i=0; i < numberToRender; i++) {
      htmlString += renderPodcastItem(result.items[i]);
    }

    $("#videos").html(htmlString);
    $("#videos").show();

    $("#videos .podcast").click(function(){
      playpodcast($(this).find("a").text(), $(this).data("mp3"), $(this).data("image"));
    });
    $(".spinner").hide();
  });
}

function renderPodcastItem(item) {
  var time = "<span class='video-time'>" + toHHMMSS(item.length) + "</span>";
  var image = item.image;
  var postedDate = "<span class='posted'>" + item.updated + "</span>";
  var datamp3 = "data-mp3='" + item.url + "' ";
  var dataImage = "data-image='" + item.image + "' ";
  return "<div class='podcast' data-podcast-id='" + item.id + "' style='background-image:url(" + image + ");' " + datamp3 + dataImage + "><span class='highlight'></span><a href='javascript:void(0)'>" + item.title + "</a>" + time + postedDate + "</div>";
}

function podcastScrollDown() {
  getPodcastItems(currentPodcast, function(result){
    if (podcastEpidodesToShow >= result.items.length)
      return false;

    var htmlString = "";
    podcastEpidodesToShow += Constants.videosPerRequest;
    var numberToRender = Math.min(podcastEpidodesToShow, result.items.length);
    for (var i=0; i < numberToRender; i++) {
      htmlString += renderPodcastItem(result.items[i]);
    }
    $("#videos").html(htmlString);
    $("#videos").show();

    $("#videos .podcast").click(function(){
      playpodcast($(this).find("a").text(), $(this).data("mp3"), $(this).data("image"));
    });
  });
}

function playpodcast(name, mp3, image) {
  if ($("#video-container").is(":visible"))
    return false;

  $("#video-player").hide();
  $("#audio-player").show();

  currentVideo = undefined;

  jsAudio.src({
    src:mp3,
    type:"audio/mp3",
    label:"mp3",
    selected:true
  });

  jsAudio.ready(function() {

    $("#video-container").show();
    $("#video-title").text(name);

    jsAudio.poster(image);
    jsAudio.play();
    jsAudio.playbackRate(2);
    jsAudio.playbackRate(1);

  });
}
