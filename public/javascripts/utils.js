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
    REGEXP_QUOTE: {
      VIDEO: /youku\.com|tudou\.com|iqiyi\.com|pps\.tv|sohu\.com|qq\.com|sina\.com\.cn|ifeng\.com|letv\.com|pptv\.com|ku6\.com|56\.com|baomihua\.com|yinyuetai\.com|acfun\.tv|bilibili\.tv|bilibili\.kankanews\.com$/i,
      WEIBO: /weibo\.com$/i
    },

    getQuote: function (url, type) {
      var temp;
      var quote = (temp = this.REGEXP_URL.exec(url)) && temp[2];
      var re = this.REGEXP_QUOTE[type];
      if (!re) {
        return quote;
      }
      quote = (temp = re.exec(quote)) && temp[0] && temp[0].toLowerCase();

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
    },

    _normalizeTime: function (time) {
      if (time >= 10) {
        return time;
      }
      return '0' + time;
    },

    getWeiboTime: function (created_at) {
      var date = new Date(created_at);
      return date.getFullYear() + '.'
        + (date.getMonth() + 1) + '.'
        + date.getDate() + ' '
        + this._normalizeTime(date.getHours()) + ':'
        + this._normalizeTime(date.getMinutes());
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
  } else if (typeof window !== 'undefined') {
    window.shizier = window.shizier || {};
    shizier.utils = utils;
  }
})();