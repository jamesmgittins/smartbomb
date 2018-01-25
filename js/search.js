var searchHistory = GbCache.getSearchHistory();
var currentPage = 1;
var currentSearch;
var newSearchOption = {
  label : "[New Search]",
  id : "new-search"
};

function performSearch() {
  var searchValue = encodeURIComponent($("#search-input").val().trim());
  if (searchValue.length > 0) {
    searchHistory.unshift(searchValue);
    searchHistory = searchHistory.slice(0,10);
    GbCache.saveSearchHistory(searchHistory);
    currentSearch = searchValue;
    renderSearchHistory();
    selectSearchHistory("search-" + searchValue);
  }
  $("#search-form").hide();
}


function renderSearchHistory(callback) {

  var wasActive = $("#shows .show.active").length > 0;
  var owlIndex = 0;
  var htmlString = "";
  htmlString += renderShow(newSearchOption.id, newSearchOption.label, false, owlIndex++);

  for (var i = 0; i < searchHistory.length; i++) {
    htmlString += renderShow("search-" + searchHistory[i], cleanTextForDisplay(decodeURIComponent(searchHistory[i])), false, owlIndex++);
  }

  owlShowInit(htmlString, searchHistory.length + 1);
  $("#shows").show();

  $("#shows .show").click(function (event) {
    selectSearchHistory($(this).data("show-id"));
    owlShowGoTo($(this).data("owl-index"));
  });

  if (currentSearch) {
    $(".show[data-show-id='search-" + currentSearch + "']").addClass("selected");
    if (wasActive) {
      $(".show[data-show-id='search-" + currentSearch + "']").addClass("active");
    }
  } else {
    $(".show[data-show-id='" + newSearchOption.id + "']").addClass("selected");
    if (wasActive) {
      $(".show[data-show-id='" + newSearchOption.id + "']").addClass("active");
    }
  }
  owlShowJumpTo($(".show.selected").data("owl-index"));

  setNavBarMouseOverActions();
  if (currentSearch) {
    selectSearchHistory("search-" + currentSearch);
  }
}

function displaySearchForm() {
  $("#search-form").show();
  $("#search-input").val("").focus();
}

function selectNewSearchOption() {
  $("#shows .show").removeClass("selected");
  $(".show[data-show-id='" + newSearchOption.id + "']").addClass("selected");
  resetVideoCarousel();
  hideMediaView();
  currentSearch = undefined;
  if (showSelectTimeout)
      clearTimeout(showSelectTimeout);
}

function selectSearchHistory(searchId) {
  resetVideoCarousel();
  $("#shows .show").removeClass("selected");
  currentlyPlayingVideo = undefined;
  hideMediaView();
  stopLoadingContinueVideos = true;
  currentPage = 1;
  videos = [];

  if (searchId == newSearchOption.id) {
    $(".show[data-show-id='" + newSearchOption.id + "']").addClass("selected");
    currentSearch = undefined;
    displaySearchForm();
  } else {
    currentSearch = searchId.substring(7);
    $(".show[data-show-id='" + searchId + "']").addClass("selected");

    if (showSelectTimeout)
      clearTimeout(showSelectTimeout);

    showSelectTimeout = setTimeout(function () { getSearchResults(); }, Constants.uiNavigationDelay);
  }
}

function getSearchResults() {
  if (currentSearch)
    getVideosForSearch(function () {
      renderVideos();
    }, 0);
}


function getVideosForSearch(callback) {

  GbEndpoints.search(currentSearch, currentPage, function (data) {
    data.results.forEach(function (video) {
      if (!video.saved_time && savedTimes) {
        savedTimes.forEach(function(savedTime){
          if (savedTime.videoId == video.id)
            video.saved_time = savedTime.savedTime;
        });
      }
      videos.push(new GbVideo(video));
    });
    videos.total = data.number_of_total_results;
    if (callback)
      callback();
  });
}