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

  utils.getVideoQuoteAndVid = function (url) {
    var urlParts = !url ? null : url.match(REGEXP_URL);
    var temp;
    var quote = !urlParts ? null : !urlParts[2] ? null : !(temp = urlParts[2].match(/youku\.com|tudou\.com|qq\.com|sina\.com\.cn$/i)) ? null : !temp[0] ? null : temp[0].toLowerCase();
    var vid;

    switch (quote) {
      case 'youku.com':
        //http://v.youku.com/v_show/id_XNjEyOTU3NjE2.html?f=20383529&ev=1
        vid = !(temp = url) ? null : !(temp = temp.match(/id_([\w\-]{13})\.html\/?(\?|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'tudou.com':
        //http://www.tudou.com/listplay/pKzzr-WLvwk/snBiS0Y74PQ.html
        //http://www.tudou.com/programs/view/TtwcrB0saxg
        vid = !(temp = url) ? null : !(temp = temp.match(/([\w\-]{11})(\.html)?\/?(\?|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'qq.com':
        //http://v.qq.com/page/c/w/m/c00139loswm.html
        //http://v.qq.com/cover/r/r0yx3vkrlz4rj85.html?vid=i00135hjy5k
        vid = (!(temp = url) ? null : !(temp = temp.match(/vid=([\w\-]{11})/i)) ? null : !temp[1] ? null : temp[1])
          || (!(temp = url) ? null : !(temp = temp.match(/([\w\-]{11})\.html\/?(\?|$)/i)) ? null : !temp[1] ? null : temp[1]);
        break;
      case 'sina.com.cn':
        //http://video.sina.com.cn/bl/6646436-1624364062-117652070.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d{9})\.html\/?(\?|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
    }

    return {quote: quote, vid: vid};
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
  } else if (typeof window !== 'undefined') {
    window.mtm = window.mtm || {};
    mtm.utils = utils;
  }
})();