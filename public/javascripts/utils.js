/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 10/24/13
 * Time: 3:10 AM
 * To change this template use File | Settings | File Templates.
 */
(function () {

  var REGEXP_URL = /^(https?|ftp):\/\/(([\w\-]+\.)+[\w\-]+)(\/|\?|$)/i;

  var utils = {};

  utils.getVideoQuoteAndVid = function (url) {
    var urlParts = !url ? null : url.match(REGEXP_URL);
    var temp;
    var quote = !urlParts ? null : !urlParts[2] ? null : !(temp = urlParts[2].match(/youku\.com|tudou\.com$/i)) ? null : temp[0];
    var vid;

    switch (quote) {
      case 'youku.com':
        //http://v.youku.com/v_show/id_XNjEyOTU3NjE2.html?f=20383529&ev=1
        vid = !(temp = url) ? '#vid#' : !(temp = temp.match(/id_([\w\-]{13})\.html\/?(\?|$)/i)) ? '#vid#' : !temp[1] ? '#vid#' : temp[1];
        break;
      case 'tudou.com':
        //http://www.tudou.com/listplay/pKzzr-WLvwk/snBiS0Y74PQ.html
        //http://www.tudou.com/programs/view/TtwcrB0saxg
        vid = !(temp = url) ? '#vid#' : !(temp = temp.match(/([\w\-]{11})(\.html)?\/?(\?|$)/i)) ? '#vid#' : !temp[1] ? '#vid#' : temp[1];
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