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
    var quote = !urlParts ? null : !urlParts[2] ? null : !(temp = urlParts[2].match(/youku\.com|tudou\.com|qq\.com|sina\.com\.cn|pps\.tv|ku6\.com|56\.com|baomihua\.com|ifeng\.com|letv\.com|iqiyi\.com|yinyuetai\.com|pptv\.com$/i)) ? null : !temp[0] ? null : temp[0].toLowerCase();
    var vid;

    switch (quote) {
      case 'youku.com':
        //http://v.youku.com/v_show/id_XNjEyOTU3NjE2.html?f=20383529&ev=1
        vid = !(temp = url) ? null : !(temp = temp.match(/id_([\w\-]{13})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'tudou.com':
        //http://www.tudou.com/listplay/pKzzr-WLvwk/snBiS0Y74PQ.html
        //http://www.tudou.com/programs/view/TtwcrB0saxg
        vid = !(temp = url) ? null : !(temp = temp.match(/([\w\-]{11})(\.html)?\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'qq.com':
        //http://v.qq.com/page/c/w/m/c00139loswm.html
        //http://v.qq.com/cover/r/r0yx3vkrlz4rj85.html?vid=i00135hjy5k
        vid = (!(temp = url) ? null : !(temp = temp.match(/vid=([\w\-]{11})/i)) ? null : !temp[1] ? null : temp[1])
          || (!(temp = url) ? null : !(temp = temp.match(/([\w\-]{11})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1]);
        break;
      case 'sina.com.cn'://todo 重做
        //http://video.sina.com.cn/bl/6646436-1624364062-117652070.html
        //http://video.sina.com.cn/v/b/50691086-1854900491.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d{9})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'pps.tv':
        //http://v.pps.tv/play_38J3NV.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\w{6})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'ku6.com':
        //http://v.ku6.com/show/Dq-TEVeOSRPxpr-MKaAhHg...html?hpsrc=1_12_1_1_0
        vid = !(temp = url) ? null : !(temp = temp.match(/([\w\-]{22}\.\.)\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case '56.com':
        //http://www.56.com/u48/v_MTAxMTQ3MDYx.html
        //http://www.56.com/w92/play_album-aid-12053351_vid-MTAwOTU1MDI0.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\w{12})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'baomihua.com':
        //http://video.baomihua.com/11258722/28470044
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d{8})\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'ifeng.com':
        //http://v.ifeng.com/mil/mainland/201311/01bf1722-6d9d-419f-bf04-0c3afd6f2cf8.shtml
        //http://v.ifeng.com/ent/yllbt/special/20131125/index.shtml#b2755624-d591-4f08-ae54-349f473fe490(不能获取title，暂不支持，同weibo)
        //http://v.ifeng.com/live/#4AC51C17-9FBE-47F2-8EE0-8285A66EAFF5(直播用的channelId，暂不支持，同weibo)
        vid = !(temp = url) ? null : !(temp = temp.match(/(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})\.shtml([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'letv.com':
        //http://www.letv.com/ptv/vplay/2050605.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d{7})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'iqiyi.com'://todo
        //http://www.iqiyi.com/v_19rrhfuy7s.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d{7})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'yinyuetai.com':
        //http://v.yinyuetai.com/video/818636
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d{6})\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'pptv.com':
        //http://v.pptv.com/show/icwtr6HibzIFicCQKg.html#
        vid = !(temp = url) ? null : !(temp = temp.match(/(\w{18})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
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