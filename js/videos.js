function getVideoById(id, callback) {
  GbEndpoints.videoById(id, function(data){
    videoIdCache[data.results[0].id] = new GbVideo(data.results[0]);
    callback(videoIdCache[data.results[0].id]);
  });
}

function getNextContinueVideo(counter, after) {
  if (!savedTimes[counter]) {
    renderVideos();
    return;
  }
  if (videoIdCache[savedTimes[counter].videoId]) {
    var videoToAdd = videoIdCache[savedTimes[counter].videoId];
    videoToAdd.savedTime = savedTimes[counter].savedTime;
    videos.push(videoToAdd);
    if (counter < 1) {
      renderVideos();
    } else
      updateHiddenVideos();

    counter++;
    if (counter < savedTimes.length)
      getNextContinueVideo(counter, after);
  } else {
    getVideoById(savedTimes[counter].videoId, function (videoResults) {
      if (!stopLoadingContinueVideos) {
        videos.push(videoResults);
        if (counter < 1) {
          renderVideos();
        } else
          updateHiddenVideos();
        counter++;
        if (counter < savedTimes.length) {
          setTimeout(function () {
            if (!stopLoadingContinueVideos)
              getNextContinueVideo(counter, after);
          }, 500);
        }
      }
    });
  }
}

function savedVideoSort() {
  savedTimes.sort(function (a, b) {
    var aTime = a.savedOn.split("-");
    var bTime = b.savedOn.split("-");
    for (var i = 0; i < aTime.length; i++) {
      if (parseInt(aTime[i]) < parseInt(bTime[i]))
        return 1;
      if (parseInt(aTime[i]) > parseInt(bTime[i]))
        return -1;
    }
    return 0;
  });
}

function getVideosToContinue() {
  getAllSavedTimes(function () {
    var counter = 0;
    videos = [];
    savedVideoSort();
    stopLoadingContinueVideos = false;
    getNextContinueVideo(counter);
  });
}

function checkShowCache(request, callback, offset) {

  var cacheValue = currentMenuOption == "shows" ? videoShowCache[currentShow] : videoCategoryCache[currentCategory];
  var moreVideosToLoad = cacheValue && cacheValue.videos.length < cacheValue.total;

  if (cacheValue && (offset == 0 || !moreVideosToLoad)) {
    videos = cacheValue.videos;
    callback();
  }
  if (!cacheValue || Date.now() - cacheValue.time > Constants.cacheTime || (offset > 0 && moreVideosToLoad)) {
    request();
    if (cacheValue)
      $(".spinner").hide();
  }
}

function getVideosForShow(callback, offset) {
  checkShowCache(function () {

    GbEndpoints.videosForShow(offset, function(data) {
      if (offset > 0) {
        data.results.forEach(function (video) {
          videos.push(new GbVideo(video));
        });
        currentOffset = offset;
      } else {
        videos = [];
        data.results.forEach(function (video) {
          videos.push(new GbVideo(video));
        });
        currentOffset = 0;
        if (currentMenuOption == "videos") {
          videoCategoryCache[currentCategory] = { videos: videos, time: Date.now(), total: data.number_of_total_results };
        } else {
          videoShowCache[currentShow] = { videos: videos, time: Date.now(), total: data.number_of_total_results };
        }
      }
      callback();
    });
  }, callback, offset);
}


function getVideoShows(callback) {
  if (videoShows.length > 0) {
    callback();
    return;
  }
  GbEndpoints.videoShows(function (data) {
    
    videoShows = data.results;
    callback();
  });
}

function getVideoCategories(callback) {
  videoCategories = GbCache.getCategories();
  if (videoCategories.length > 0) {
    callback();
    setTimeout(function () {
      GbEndpoints.videoCategories(function (data) {
        if (!arrayEquals(videoCategories, extraVideoCategories.concat(data.results))) {
          videoCategories = extraVideoCategories.concat(data.results);
          GbCache.saveCategories(videoCategories);
          if (currentMenuOption == "videos")
            renderShows();
        }
      });
    }, 10000);
  } else {
    GbEndpoints.videoCategories(function (data) {
      videoCategories = extraVideoCategories.concat(data.results);
      GbCache.saveCategories(videoCategories);
      callback();
    });
  }

}

function getAllSavedTimes(callback) {
  GbEndpoints.getAllSavedTimes(function(data){
    savedTimes = data.savedTimes;
    callback();
  }, function() {
    savedTimes = [];
    callback();
  });
}

var liveTimeout;

function getLiveStream(callback) {
  clearTimeout(liveTimeout);

  // added for testing live stream function
  if (Constants.testLiveStream) {
    liveVideo = new GbVideo({
      title: "live stream test",
      image: "www.almasdarnews.com/wp-content/uploads/2017/08/video_thumbnail-31.jpg",
      stream: "https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8"
    });
    $("#live-menu-option").show();
    if (callback)
      callback();
  } else
    GbEndpoints.currentLive(function(data){
      if (data.success && data.video) {
        liveVideo = new GbVideo(data.video);
        $("#live-menu-option").show();
      } else {
        liveVideo = undefined;
        $("#live-menu-option").hide();
      }
      if (callback)
        callback();
    }, function(data){
      liveVideo = undefined;
        $("#live-menu-option").hide();
      if (callback)
        callback();
    });
  liveTimeout = setTimeout(function () {
    getLiveStream();
  }, Constants.liveVideoCheckTime);
}

function getVideos() {
  if (currentCategory == "continue" && currentMenuOption == "videos") {
    getVideosToContinue();
    $("#videos").show();
  } else if (currentMenuOption == "live") {
    videos = [liveVideo];
    renderVideos();
  } else {
    getVideosForShow(function () {
      renderVideos();
    }, 0);
  }
}

function updateVideoTime() {

  if (currentlyPlayingVideo.id != "live" && jsVideo.currentTime) {
    GbEndpoints.saveTime(currentlyPlayingVideo.id, Math.round(jsVideo.currentTime), function(data){
      // dont really need to do anything
    });
  }
}