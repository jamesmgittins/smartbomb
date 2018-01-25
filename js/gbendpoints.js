var GbEndpoints = {

  constants: {
    // videoFields: "&field_list=hd_url,high_url,low_url,url,id,image,length_seconds,name,publish_date,saved_time,deck,user,youtube_id"
    videoFields : ""
  },

  urls: {
    currentLive : "https://www.giantbomb.com/api/video/current-live/",
    getAllSavedTimes: "https://www.giantbomb.com/api/video/get-all-saved-times/",
    saveTime : "https://www.giantbomb.com/api/video/save-time/",
    search : "https://www.giantbomb.com/api/search/",
    videos: "https://www.giantbomb.com/api/videos/",
    videoCategories: "https://www.giantbomb.com/api/video_categories/1/",
    videosShows: "https://www.giantbomb.com/api/video_shows/"
  },

  currentLive : function (callback, error) {
    corsRequest(GbEndpoints.urls.currentLive + "?api_key=" + regToken, function (data) {
      if (data.success) {
        callback(data);
      } else {
        error(data);
      }
    }, true);
  },

  getAllSavedTimes: function (callback, error) {
    corsRequest(GbEndpoints.urls.getAllSavedTimes + "?api_key=" + regToken + "&sort=latest:desc", function (data) {
      if (data.success) {
        callback(data);
      } else {
        error();
      }
    });
  },

  saveTime : function(videoId, timeToSave, callback) {
    corsRequest(GbEndpoints.urls.saveTime + "?api_key=" + regToken + "&video_id=" + videoId + "&time_to_save=" + timeToSave, function (data) {
        callback(data);
      }, true);
  },

  search : function(searchString, page, callback) {
    corsRequest(GbEndpoints.urls.search + "?api_key=" + regToken + "&resources=video&query=" + searchString + "&page=" + page + GbEndpoints.constants.videoFields, function (data) {
      if (data.error == "OK") {
        callback(data);
      }
    });
  },

  videoById : function(videoId, callback) {
    corsRequest(GbEndpoints.urls.videos + "?api_key=" + regToken + "&filter=id:" + videoId + GbEndpoints.constants.videoFields + Constants.videosLimit, function (data) {
      if (data.error == "OK") {
        callback(data);
      } else {
        // handle error
      }
    }, true);
  },

  videoCategories: function (callback) {
    corsRequest(GbEndpoints.urls.videoCategories + "?api_key=" + regToken, function (data) {
      if (data.error == "OK") {
        callback(data);
      } else {
        // handle error
      }
    });
  },

  videosForShow: function (offset, callback) {
    var showFilter = "&filter=video_show:" + currentShow;
    if (currentMenuOption == "videos")
      showFilter = currentCategory == "all" ? "" : "&filter=video_categories:" + currentCategory;
    corsRequest(GbEndpoints.urls.videos + "?offset=" + offset + "&api_key=" + regToken + showFilter + GbEndpoints.constants.videoFields + Constants.videosLimit, function (data) {
      if (data.error == "OK") {
        callback(data);
      } else {
        // handle error
      }
    });
  },

  videoShows: function (callback) {
    corsRequest(GbEndpoints.urls.videosShows + "?api_key=" + regToken + "&sort=latest:desc", function (data) {
      if (data.error == "OK") {
        callback(data);
      } else {
        // handle error
      }
    });
  }
};