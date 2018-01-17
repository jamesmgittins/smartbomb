GbVideo = function(apiVideo) {

  // if there's a stream then this is a live video
  if (apiVideo.stream) {

    this.id = "live";
    this.live = true;
    this.name = apiVideo.title;
    this.image = encodeURI("https://" + apiVideo.image);
    this.savedTime = 0;
    this.length = 0;
    this.stream = apiVideo.stream;
    this.cssId = "video-live";

  } else {

    this.id = apiVideo.id;
    this.live = false;
    this.name = apiVideo.name;
    this.image = apiVideo.image.small_url;
    this.largeImage = apiVideo.image.super_url;
    this.savedTime = apiVideo.saved_time || 0;
    this.length = apiVideo.length_seconds;
    this.publishDate = apiVideo.publish_date;
    this.description = apiVideo.deck;
    this.user = apiVideo.user;
    this.hdUrl = apiVideo.hd_url;
    this.highUrl = apiVideo.high_url;
    this.lowUrl = apiVideo.low_url;
    this.cssId = "video-" + apiVideo.id;
    this.youtube = apiVideo.youtube_id;

  }
  
};

GbVideo.prototype.getHtml = function(left) {
  if (this.live) {
    return "<div class='video " + this.cssId +  "' data-video-id='video-live' style='background-image:url(\"" + this.image + "\");'><a href='javascript:void(0)'>" + 
            this.name + "</a><span class='posted live'>LIVE NOW!</span></div>";
  } else {
    var savedTimer = "";
    if (this.savedTime) {
      var width = Math.max(1,Math.min(Math.round(this.savedTime / this.length * 100),100));
      savedTimer = "<div class='video-timer'><span class='video-timer-marker' style='width:" + width + "%;'></span></div>";
    }
    return "<div class='video " + this.cssId + "' style='background-image:url(\"" +  this.image + "\");" + (left ? left : "") + 
            "' data-video-id='" + this.id + "'><a href='javascript:void(0)'>" + this.name + "</a>" + savedTimer + 
            "<span class='video-time'>" + toHHMMSS(this.length) + "</span><span class='posted'>" + 
            formatDateString(this.publishDate) + "</span></div>";
  }
};

GbVideo.prototype.getMediaInformationHtml = function() {
  var htmlString = "";
  if (this.live) {
    changeBackgroundImage(this.image);
    htmlString = "<h1>" + this.name + "</h1>" +
                   "<p>Streaming live now</p>";
  } else {
    changeBackgroundImage(this.largeImage);
    htmlString = "<h1>" + this.name + "</h1>" +
                  "<p>" + this.description + "</p>" +
                  "<small>Posted by " + this.user + "</small><small>" + 
                  formatDateString(this.publishDate) + "</small>";
  }
  return htmlString;
};

GbVideo.prototype.getPlayButtons = function() {
  var htmlString = "";

  if (this.youtube) {
    htmlString += '<a class="btn play" onclick="playButton(\'youtube\')" href="javascript:void(0)"><span class="fa fa-play"></span> Youtube</a>';
  }
  if (this.hdUrl) {
    htmlString += '<a class="btn play" onclick="playButton(\'hd\')" href="javascript:void(0)"><span class="fa fa-play"></span> HD</a>';
  }
  if (this.highUrl) {
    htmlString += '<a class="btn play" onclick="playButton(\'high\')" href="javascript:void(0)"><span class="fa fa-play"></span> High</a>';
  }
  if (this.lowUrl) {
    htmlString += '<a class="btn play" onclick="playButton(\'low\')" href="javascript:void(0)"><span class="fa fa-play"></span> Low</a>';
  }
  if (this.live) {
    htmlString += '<a class="btn play" onclick="playButton()" href="javascript:void(0)">Watch Live</a>';
  }
  return htmlString;
};


GbVideo.prototype.getSrc = function(quality) {
  if (this.live) {
    return { src: this.stream + "?api_key=" + regToken, type: "application/x-mpegURL" };
  } else {
    var options = {
      option : {}
    };
    if (this.savedTime) {
      options.option.transmission = {};
      options.option.transmission.playTime = {};
      options.option.transmission.start = Math.round(this.savedTime  * 1000);
    }
    var src;
    if (this.youtube && quality == "youtube")
      return {
        src: "https://www.youtube.com/embed/" + this.youtube + "?start=" + Math.round(this.savedTime),
        type: "video/youtube"
      };
    if (this.hdUrl && quality == "hd")
      return {
        src: this.hdUrl + "?api_key=" + regToken,
        type: "video/mp4;mediaOption=" + escape(JSON.stringify(options))
      };
    if (this.highUrl && quality == "high")
      return {
        src: this.highUrl + "?api_key=" + regToken,
        type: "video/mp4;mediaOption=" + escape(JSON.stringify(options))
      };
    if (this.lowUrl && quality == "low")
      return {
        src: this.lowUrl + "?api_key=" + regToken,
        type: "video/mp4;mediaOption=" + escape(JSON.stringify(options))
      };
  }
};