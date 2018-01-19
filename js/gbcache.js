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
  }

}