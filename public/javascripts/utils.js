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
      VIDEO: /youku\.com|tudou\.com|iqiyi\.com|pps\.tv|sohu\.com|my\.tv\.sohu\.com|qq\.com|sina\.com\.cn|ifeng\.com|letv\.com|pptv\.com|ku6\.com|56\.com|baomihua\.com|yinyuetai\.com|acfun\.tv|acfun\.com|bilibili\.tv|bilibili\.kankanews\.com$/i,
      WEIBO: /weibo\.com$/i
    },
    QUOTE_MAP: {
      'youku.com': '优酷',
      'tudou.com': '土豆',
      'iqiyi.com': '爱奇艺',
      'pps.tv': 'PPS',
      'sohu.com': '搜狐视频',
      'my.tv.sohu.com': '搜狐原创',
      'qq.com': '腾讯视频',
      'sina.com.cn': '新浪视频',
      'ifeng.com': '凤凰视频',
      'letv.com': '乐视',
      'pptv.com': 'PPTV',
      'ku6.com': '酷6',
      '56.com': '56',
      'baomihua.com': '爆米花',
      'yinyuetai.com': '音悦台',
      'acfun.tv': 'AcFun',
      'acfun.com': 'AcFun',
      'bilibili.tv': 'bilibili',
      'bilibili.kankanews.com': 'bilibili'
    },

    getQuote: function (url, type) {
      var temp;
      var quote = (temp = this.REGEXP_URL.exec(url)) && temp[2];
      var re = this.REGEXP_QUOTE[type];
      if (!re) {
        return quote;
      }
      quote = (temp = re.exec(quote)) && temp[0] && temp[0].toLowerCase();
      if (type == 'VIDEO') {
        quote = this.QUOTE_MAP[quote];
      }

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
    },

    getFormatedDate: function (date) {
      if (typeof date == Date) return date;

      function _prefixZero(num) {
        return num < 10 ? '0' + num : num;
      }

      return date.getFullYear() + '-'
        + _prefixZero(date.getMonth() + 1) + '-'
        + _prefixZero(date.getDate()) + ' '
        + _prefixZero(date.getHours()) + ':'
        + _prefixZero(date.getMinutes()) + ':'
        + _prefixZero(date.getSeconds());
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
  } else if (typeof window !== 'undefined') {
    window.shizier = window.shizier || {};
    shizier.utils = utils;
  }
})();