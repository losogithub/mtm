/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 10/24/13
 * Time: 3:10 AM
 * To change this template use File | Settings | File Templates.
 */
(function () {

  var REGEXP_URL = /^(https?|ftp):\/\/(([\w\-]+\.)+[\w\-]+)(:|\/|\?|$)/i;
  var REGEXP_PROTOCOL = /^(https?|ftp):\/\//i;

  var utils = {};

  utils.REGEXP_URL = REGEXP_URL;
  utils.REGEXP_PROTOCOL = REGEXP_PROTOCOL;

  utils.getImageQuoteDomain = function (quote) {
    var temp;
    return !quote ? null : !(temp = quote.match(utils.REGEXP_URL)) ? null : temp[2];
  }

  utils.getVideoQuote = function (url) {
    var urlParts = !url ? null : url.match(REGEXP_URL);
    var temp;
    var quote = !urlParts ? null : !urlParts[2] ? null : !(temp = urlParts[2].match(
      /youku\.com|tudou\.com|iqiyi\.com|pps\.tv|sohu\.com|qq\.com|sina\.com\.cn|ifeng\.com|letv\.com|pptv\.com|ku6\.com|56\.com|baomihua\.com|yinyuetai\.com$/i)) ? null : !temp[0] ? null : temp[0].toLowerCase();

    return quote;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
  } else if (typeof window !== 'undefined') {
    window.mtm = window.mtm || {};
    mtm.utils = utils;
  }
})();