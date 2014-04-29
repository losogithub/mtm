/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 10/24/13
 * Time: 3:10 AM
 * To change this template use File | Settings | File Templates.
 */
(function () {
  var utils = {
    CATEGORIES2ENG: {
      '生活': 'life',
      '娱乐': 'entertainment',
      '新闻': 'news',
      '科技': 'tech',
      '文化': 'culture',
      '时尚': 'fashion',
      '幽默': 'humor',
      '商业': 'business',
      '体育': 'sport',
      '未分类': 'unclassified'
    },
    REGEXP_URL: /^(https?|ftp):\/\/(([\w\-]+\.)+[\w\-]+)(:|\/|\?|$)/i,
    REGEXP_PROTOCOL: /^(https?|ftp):\/\//i,
    REGEXP_QUOTE: {
      VIDEO: /youku\.com|tudou\.com|iqiyi\.com|pps\.tv|sohu\.com|my\.tv\.sohu\.com|qq\.com|sina\.com\.cn|ifeng\.com|letv\.com|pptv\.com|ku6\.com|56\.com|baomihua\.com|yinyuetai\.com|acfun\.tv|acfun\.com|bilibili\.tv|bilibili\.kankanews\.com$/i,
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

    getFav: function (url) {
      var temp;
      var fav = 'http://' + ((temp = this.REGEXP_URL.exec(url)) && temp[2]) + '/favicon.ico';

      return fav;
    },

    suffixImage: function (src) {
      if (!src || src.indexOf('?&') > -1) {
        return src;
      }
      if (src.indexOf('?') < 0) {
        return src + '?&';//这个&是针对tianya加的
      } else {
        return src + '&';
      }
    },

    escape: function (html) {
    if (!html) {
      return html;
    }
    return String(html)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
  } else if (typeof window !== 'undefined') {
    window.shizier = window.shizier || {};
    shizier.utils = utils;
  }
})();