/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 10/24/13
 * Time: 3:10 AM
 * To change this template use File | Settings | File Templates.
 */
(function () {
  var utils = {
    REGEXP_URL: /^(https?|ftp):\/\/(([\w\-]+\.)+[\w\-]+)(:|\/|\?|$)/i,
    REGEXP_PROTOCOL: /^(https?|ftp):\/\//i,

    getImageQuoteDomain: function (quote) {
      var temp;
      return !quote ? null : !(temp = quote.match(this.REGEXP_URL)) ? null : temp[2];
    },

    getVideoQuote: function (url) {
      var urlParts = !url ? null : url.match(this.REGEXP_URL);
      var temp;
      var quote = !urlParts ? null : !urlParts[2] ? null : !(temp = urlParts[2].match(
        /youku\.com|tudou\.com|iqiyi\.com|pps\.tv|sohu\.com|qq\.com|sina\.com\.cn|ifeng\.com|letv\.com|pptv\.com|ku6\.com|56\.com|baomihua\.com|yinyuetai\.com|acfun\.tv|bilibili\.tv$/i)) ? null : !temp[0] ? null : temp[0].toLowerCase();

      return quote;
    },

    suffixImage: function (src) {
      if (!src) {
        return src;
      }
      if (src.indexOf('?') < 0) {
        return src + '?&';//这个&是针对tianya加的
      } else {
        return src + '&';
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
  } else if (typeof window !== 'undefined') {
    window.shizier = window.shizier || {};
    shizier.utils = utils;
  }
})();