var savePodcastTimeKey = "smartBombSavePodcastTime";
var GbCache = {

  regTokenKey : "smartBombRegToken",

  getRegToken : function() {
    return localStorage.getItem(GbCache.regTokenKey);
  },

  saveRegToken : function(regToken) {
    localStorage.setItem(GbCache.regTokenKey, regToken);
  },

  categoryKey : "smartBombCategories",

  getCategories : function() {
    var categories = localStorage.getItem(GbCache.categoryKey);
    if (categories)
      return JSON.parse(categories);

    return [];
  },

  saveCategories : function(categories) {
    localStorage.setItem(GbCache.categoryKey, JSON.stringify(categories));
  },

  searchHistoryKey : "smartBombSearchHistory",

  getSearchHistory : function() {
    var searchHistory = localStorage.getItem(GbCache.searchHistoryKey);
    if (searchHistory)
      return JSON.parse(searchHistory);

    return [];
  },

  saveSearchHistory : function(searchHistory) {
    localStorage.setItem(GbCache.searchHistoryKey, JSON.stringify(searchHistory));
  },

  savePodcastTimeKey : savePodcastTimeKey,

  podcastTimes : (function(){
    var times = localStorage.getItem(savePodcastTimeKey);
    if (times === null) {
      localStorage.setItem(savePodcastTimeKey, JSON.stringify({}));
    }
    return JSON.parse(localStorage.getItem(savePodcastTimeKey));
  })(),

  savePodcastTime : function(podcastId, timeToSave) {
    GbCache.podcastTimes[podcastId] = timeToSave;
    localStorage.setItem(GbCache.savePodcastTimeKey, JSON.stringify(GbCache.podcastTimes));
  },

  getPodcastTime : function(podcastId) {
    if (GbCache.podcastTimes[podcastId])
      return GbCache.podcastTimes[podcastId];
    else
      return 0;
  },

  clearCache : function() {
    localStorage.removeItem(GbCache.regTokenKey);
    localStorage.removeItem(GbCache.categoryKey);
  }

}