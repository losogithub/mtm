/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/12/13
 * Time: 2:50 PM
 * To change this template use File | Settings | File Templates.
 */


/**
 * When given a plain text, translate into a certain html tagged str.
 *
 */
var Url = require('url');
var Iconv = require('iconv').Iconv;
var zlib = require('zlib');
var async = require('async');
var sanitize = require('validator').sanitize;
var check = require('validator').check;
var request = require('request');
var domain = require('domain');
var extend = require('extend');

var config = require('../config');
var WeiboHelper = require('../helper/weibo');
var utils = require('../public/javascripts/utils');

function linkify(inputText) {
  //empty case
  if (!inputText) {
    return inputText;
  }
  var replacedText, replacePattern1, replacePattern2, replacePattern3;

  //URLs starting with http://, https://, or ftp://
  replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
  replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

  //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
  replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
  replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

  //Change email addresses to mailto:: links.
  replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
  replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

  return replacedText.replace(/(\n)+/g, '<br>');
}

function validateEmail(email) {
  // First check if any value was actually set
  if (!email || !email.length) return false;
  // Now validate the email format using Regex
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
  return re.test(email);
}

function escape(html) {
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

function concatNoDup(a, b) {
  for(var i=0,j=0,ci,r={},c=[];ci=a[i++]||b[j++];){
    if(r[ci])continue;
    r[ci]=1;
    c.push(ci);
  }
  return c;
}

function _getHtml(url, callback) {
  console.log(url);
  callback = callback || function () {
  };
  var d = domain.create();
  d.on('error', function (err) {
    callback(err);
  });
  d.run(function () {
    request({url: url, encoding: null, 'headers': {'Accept-Encoding': 'gzip,deflate'}}, function (error, response, body) {
      if (error) {
        return callback(error);
      }
      var buffer = body;
      async.series([function (callback) {
        switch (response.headers['content-encoding']) {
          case 'gzip':
            zlib.gunzip(buffer, function (err, buf) {
              if (err) {
                return callback(err);
              }

              buffer = buf;
              callback();
            });
            break;
          case 'deflate':
            zlib.inflateRaw(buffer, function (err, buf) {
              if (err) {
                return callback(err);
              }

              buffer = buf;
              callback();
            });
            break;
          default:
            callback();
            break;
        }
      }], function (err) {
        if (err) {
          return callback(err);
        }

        var temp;
        var charset = !(temp = response.headers['content-type']) ? null :
          !(temp = temp.match(/charset=([^\s;]+)/i)) ? null :
            !temp[1] ? null : temp[1];
        console.log(charset);
        try {
          var html = new Iconv(charset || 'UTF-8', 'UTF-8//TRANSLIT//IGNORE').convert(buffer).toString();
        } catch (err) {
          return callback(err);
        }
        var charset2 = !(temp = html.match(/<meta[^<>]+charset\s*=\s*("|')?([^"'\s/>]+)/i)) ? null : temp[2];
        console.log(charset2);
        if (charset2 &&
          (!charset
            || charset2.toLowerCase() != charset.toLowerCase())) {
          try {
            var html = new Iconv(charset2 || 'UTF-8', 'UTF-8//TRANSLIT//IGNORE').convert(buffer).toString();
          } catch (err) {
            return callback(err);
          }
        }

        callback(null, html);
      })
    });
  });
}

function getLinkDetail(url, callback) {
  callback = callback || function () {
  };
  _getHtml(url, function (err, html) {
    if (err) {
      return callback(err);
    }
    var temp;
    var title = !(temp = html.match(/<title[^>]*>([^<]*)<\/title[^>]*>/i)) ? null : temp[1];
    title = sanitize(title).entityDecode();
    title = sanitize(title).trim();
    if (title.length > 50) {
      title = title.substr(0, 49) + '…';
    }

    temp = !(temp = html.match(/<meta([^>]*)name\s*=\s*("|')description("|')([^>]*)>/i)) ? null : temp[1] + temp[4];
    var snippet = temp && (temp = temp.match(/content\s*=\s*("|')([^"']*)("|')/i)) && temp[2].trim();
    if (snippet.length > 140) {
      snippet = snippet.substr(0, 139) + '…';
    }
    snippet = sanitize(snippet).entityDecode();
    snippet = sanitize(snippet).trim();

    callback(null, {
      type: 'LINK',
      url: url,
      title: title,
      snippet: snippet
    });
  });
}

function getVideoDetail(url, callback) {
  callback = callback || function () {
  };
  _getHtml(url, function (err, html) {
    if (err) {
      callback(err);
      return;
    }
    var temp;
    var title;
    var quote = utils.getQuote(url, 'VIDEO');
    var vid;
    var cover;
    console.log(quote);
    switch (quote) {
      case 'youku.com':
        //plan A
        //&tt=第二十一回&nbsp;惊见摘头鬼 坑亲王谢幕&pu=
        title = !(temp = html.match(/&tt=(((?!&pu).)*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.youku.com/v_show/id_XNjEyOTU3NjE2.html?f=20383529&ev=1
        //http://v.youku.com/v_show/id_XNjQxNTE5MDYw_ev_1.html
        //http://v.youku.com/v_show/id_XOTc4MTQ5MDg=.html
        vid = !(temp = url) ? null : !(temp = temp.match(/id_([\w\-=]{13})/i)) ? null : !temp[1] ? null : temp[1];
        //&pics=http://g1.ykimg.com/0100641F465298B35464C306340F021E6E83FF-FD92-B358-8009-D0B224F8C83D&site=优酷
        //128x96
        cover = !(temp = html.match(/&pics=([^&"']*)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'tudou.com':
        //plan A
        //,kw: '爆笑恶搞淮秀帮-超强阵容配音坑爹的谣言时代（淮秀帮 出品）-2bzhan.cc'
        //,kw:"校长 开房找我啊"
        //,kw: "星映话之《金刚狼2：狼叔来袭》上集"
        title = (!(temp = html.match(/,kw:\s*('|")(.*)('|")/)) ? null : !temp[2] ? null : temp[2])
          //plan B1
          //<h4 class="vcate_title" id="vcate_title"><a href="http://www.tudou.com/albumcover/RHCS8jx9TQo.html" target="_blank">星映话之《金刚狼2：狼叔来袭》上集</a></h4>
          || (!(temp = html.match(/<h4 class="vcate_title" id="vcate_title"><a(.*)>(.*)<\/a><\/h4>/)) ? null : !temp[2] ? null : temp[2])
          //plan B2
          //<h1 class="kw" id="videoKw" title="爆笑恶搞淮秀帮-超强阵容配音坑爹的谣言时代（淮秀帮 出品）-2bzhan.cc">爆笑恶搞淮秀帮-超强阵容配音坑爹的谣言时代（淮秀帮 出品）-2bzhan.cc</h1>
          || (!(temp = html.match(/<h1 class="kw" id="videoKw"(.*)>(.*)<\/h1>/)) ? null : !temp[2] ? null : temp[2])
          //plan B3
          //<span id="vcate_title" class="vcate_title">校长 开房找我啊</span>
          || (!(temp = html.match(/<span id="vcate_title" class="vcate_title">(.*)<\/span>/)) ? null : !temp[1] ? null : temp[1])
          //plan C
          || (!(temp = html.match(/<title>([^_]+)(.*)<\/title>/)) ? null : !temp[1] ? null : temp[1]);
        //http://www.tudou.com/listplay/pKzzr-WLvwk/snBiS0Y74PQ.html
        //http://www.tudou.com/programs/view/TtwcrB0saxg
        vid = !(temp = url) ? null : !(temp = temp.match(/([\w\-]{11})(\.html)?\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script...,pic:"http://i1.tdimg.com/183/538/614/p.jpg"...</script>
        //<script...,pic: 'http://i2.tdimg.com/008/657/421/p.jpg'...</script>
        //128x96
        cover = !(temp = html.match(/<script[\s\S]*,pic:\s*("|')([^"']+)("|')[\s\S]*<\/script>/)) ? null : !temp[2] ? null : temp[2];
        break;
      case 'iqiyi.com':
        //专题性质的，即a_的暂不支持，同weibo，无技术障碍
        //plan A
        //<em data-widget-crumbs-elem="name" data-widget-crumbs-name-max="56">恐怖杀手：诡异人体寄生虫-热纪录</em>
        title = !(temp = html.match(/<em data-widget-crumbs-elem="name" data-widget-crumbs-name-max="56">([^<>]*)<\/em>/i)) ? null : !temp[1] ? null : temp[1];
        //http://www.iqiyi.com/a_19rrgjauj5.html(无标题，封面)
        //http://www.iqiyi.com/v_19rrhfcr84.html
        //<div id="flashbox"......data-player-videoid="a97be8194627fef129d23cd05b834f79"......>
        vid = !(temp = html.match(/<div[^<>]*\sid="flashbox"[^<>]*\sdata-player-videoid="([^">]*)/i)) ? null : !temp[1] ? null : temp[1];
        //<meta itemprop="image" content='http://pic5.qiyipic.com/image/20131121/v_103890888_m_601_160_120.jpg' />
        //160x120
        //todo 封面403
        cover = !(temp = html.match(/<meta\s+itemprop="image"\s+content='([^'>]*)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'pps.tv':
        //plan A
        //<h1 class="p-title"><a title="最肥小龙女！陈妍希被喊滚出娱乐圈"
        title = !(temp = html.match(/<h1 class="p-title"><a title="([^"'>]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.pps.tv/play_38J3NV.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\w{6})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script..."sharepic":"http:\/\/s2.ppsimg.com\/ugc\/ugc_pic\/1\/70\/18adf8c00dcb95a947c272ef063e8f631f8e791d\/480_360_pps-000.jpg"...</script>
        //128x80
        cover = !(temp = html.match(/<script[\s\S]*"sharepic":"([^">]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1].replace(/\\\//g, '/').replace('480_360', '128_80');
        break;
      case 'sohu.com':
        //plan A
        //<h2>\s20130712 第一期 姚贝娜《也许明天》\s</h2>
        title = !(temp = html.match(/<h2>\s*([^<>]*)\s*<\/h2>/i)) ? null : !temp[1] ? null : temp[1];
        //http://tv.sohu.com/20130712/n381487508.shtml
        //<script type="text/javascript">......var vid="1237900";......</script>
        vid = !(temp = html.match(/<script((?!<\/script>)[\s\S])*\svar vid\s*=\s*['"]([^"'<>;]+)['"];/i)) ? null : !temp[2] ? null : temp[2];
        //<script...var cover="http://photocdn.sohu.com/20130712/vrsb902245.jpg";...</script>
        //120x90
        cover = !(temp = html.match(/<script[\s\S]*var cover="([^">]*)";[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'my.tv.sohu.com':
        //plan A
        //<script>......,title: '立邦漆广告之小屁股篇'......</script>
        title = !(temp = html.match(/<script((?!<\/script>)[\s\S])*\s,title:\s*['"]([^"'<>;]+)['"]/i)) ? null : !temp[2] ? null : temp[2];
        //http://my.tv.sohu.com/us/139695/445280.shtml
        //<script>......var vid  ='445280';......</script>
        vid = !(temp = html.match(/<script((?!<\/script>)[\s\S])*\svar vid\s*=\s*['"]([^"'<>;]+)['"];/i)) ? null : !temp[2] ? null : temp[2];
        //<script...,bCover: 'http://220.img.pp.sohu.com.cn/p220/2012/10/21/4/8/6_13b449acc64g102_445280_1_1.jpg'...</script>
        //120x90
        cover = !(temp = html.match(/<script((?!<\/script>)[\s\S])*,bCover: '([^'>]*)'/i)) ? null : !temp[2] ? null : temp[2];
        break;
      case 'qq.com':
        //plan A
        //var VIDEO_INFO={vid:"c00139loswm",title:" Ballerina",typeid:22,duration:"177",specialTemp:false}
        title = !(temp = html.match(/VIDEO_INFO=\{[\s\S]*title\s*:\s*("|')([^"'}]*)/i)) ? null : !temp[2] ? null : temp[2];
        //http://v.qq.com/page/c/w/m/c00139loswm.html
        //http://v.qq.com/cover/r/r0yx3vkrlz4rj85.html?vid=i00135hjy5k
        vid = (!(temp = url) ? null : !(temp = temp.match(/vid=([\w\-]{11})/i)) ? null : !temp[1] ? null : temp[1])
          || (!(temp = url) ? null : !(temp = temp.match(/([\w\-]{11})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1]);
        //http://vpic.video.qq.com/c00139loswm_160_90_3.jpg
        //160x90
        cover = 'http://vpic.video.qq.com/' + vid + '_160_90_3.jpg';
        break;
      case 'sina.com.cn':
        //http://video.sina.com.cn/haokan/play.html?url=http%3A%2F%2Fmy.tv.sohu.com%2Fus%2F53375285%2F62269772.shtml
        //http://video.sina.com.cn/m/sztvyw_63172701.html
        //上面两种url暂不支持，同weibo，未尝试
        //http://video.sina.com.cn/bl/6646436-1624364062-117652070.html(无封面)
        //http://tv.video.sina.com.cn/play/214323.html(无封面)
        //http://video.sina.com.cn/v/b/50691086-1854900491.html
        //http://video.sina.com.cn/p/news/s/v/2013-11-26/110663190307.html
        //plan A
        //$SCOPE['video'] = {......title:'【拍客】险 学生穿梭烂尾无护栏天桥上学',......}
        //<h1 class="titName" id="videoTitle">我们约会吧 20111115 张孟宁  </h1>
        title = (!(temp = html.match(/\$SCOPE\['video'\]\s*=\s*\{[\s\S]*title\s*:\s*'([^'}]*)/i)) ? null : !temp[1] ? null : temp[1])
          || (!(temp = html.match(/<h1[^>]*>([^<>]*)<\/h1>/i)) ? null : !temp[1] ? null : temp[1]);
        //<script......vid:'120263847',......</script>
        vid = !(temp = html.match(/<script((?!<\/script>)[\s\S])*\s+vid:'(\d+)',/i)) ? null : !temp[2] ? null : temp[2];
        //$SCOPE['video'] = {...pic: 'http://p3.v.iask.com/271/848/50691086_2.jpg',......}
        //119x90
        //135x90
        //160x90
        cover = !(temp = html.match(/\$SCOPE\['video'\] = \{[^{}]*\spic:\s*'([^'{}]*)',/i)) ? null : !temp[1] ? null : temp[1].replace('2.jpg', '1.jpg');
        break;
      case 'ifeng.com':
        //plan A
        //var videoinfo = {......"name": "中方就划设东海防空识别区驳斥美日有关言论",......}
        title = !(temp = html.match(/var videoinfo = \{[\s\S]*"name": "([^"}]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.ifeng.com/mil/mainland/201311/01bf1722-6d9d-419f-bf04-0c3afd6f2cf8.shtml
        //http://v.ifeng.com/ent/yllbt/special/20131125/index.shtml#b2755624-d591-4f08-ae54-349f473fe490(不能获取title，暂不支持，同weibo)
        //http://v.ifeng.com/live/#4AC51C17-9FBE-47F2-8EE0-8285A66EAFF5(直播用的channelId，暂不支持，同weibo)
        vid = !(temp = url) ? null : !(temp = temp.match(/(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})\.shtml([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script..."img": "http://d.ifengimg.com/w120_h90/y0.ifengimg.com/pmop/storage_img/2013/11/25/9533e052-4f28-49b6-b545-87f95cdd643644.jpg",...</script>
        //120x90
        cover = !(temp = html.match(/<script[\s\S]*"img":\s*"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'letv.com':
        //plan A
        //var __INFO__={......video : {......title:"唐罗利猜中获双人普吉岛浪漫游—非常了得",//视频名称......}......}
        title = !(temp = html.match(/var __INFO__=\{[\s\S]*video : \{[\s\S]*\stitle:"([^"}]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://www.letv.com/ptv/vplay/2050605.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d{7})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script...share:{pic:"http://i1.letvimg.com/yunzhuanma/201307/11/3790edee80983825b130eb660a067181/thumb/2.jpg",...</script>
        //120x90
        cover = !(temp = html.match(/<script[\s\S]*share:\{pic:"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'pptv.com':
        //plan A
        //<title>英超-1314赛季-联赛-第12轮-曼城6：0热刺-精华_PPTV网络电视</title>
        title = !(temp = html.match(/<title>([^<>]*)<\/title>/i)) ? null : !temp[1] ? null : temp[1].substr(0, temp[1].lastIndexOf('_PPTV网络电视'));
        //http://v.pptv.com/show/icwtr6HibzIFicCQKg.html#(无封面)
        //http://v.pptv.com/show/VvVW1T2jE1G0Mpo.html
        vid = !(temp = url) ? null : !(temp = temp.match(/\/(\w+)\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'ku6.com':
        //plan A
        //<h1 title="《全民奥斯卡之幕后》第六期：道哥幽默访谈笑点多">
        title = !(temp = html.match(/<h1 title="([^"'>]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.ku6.com/show/Dq-TEVeOSRPxpr-MKaAhHg...html?hpsrc=1_12_1_1_0
        vid = !(temp = url) ? null : !(temp = temp.match(/([\w\-]{22}\.\.)\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script...cover: "http://vi0.ku6img.com/data1/p9/ku6video/2013/11/22/18/1390433061875_86998474_86998474/1.jpg",...</script>
        //132x99
        cover = !(temp = html.match(/<script[\s\S]*cover:\s*"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case '56.com':
        //plan A
        //<h1 id="vh_title">爸爸去哪儿20131122海岛特辑 暖男天天荣升好帮手 </h1>
        //<h1 id="vh_title"><span id="albumTitle">最强cos美少女战士 这样上街不怕被砍吗[搞笑视频 笑死人]</span>
        title = !(temp = html.match(/<h1 id="vh_title">(<span id="albumTitle">)?([^<>]*)(<\/h1>|<\/span>)/i)) ? null : !temp[2] ? null : temp[2];
        //http://www.56.com/u48/v_MTAxMTQ3MDYx.html
        //http://www.56.com/w92/play_album-aid-12053351_vid-MTAwOTU1MDI0.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\w{12})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script..."URL_pURL":"24",..."user_id":"r480730716",..."URL_sURL":"3",..."URL_URLid":"sc_138478337743hd",..."img_host":"v19.56.com",...</script>
        //上面对应的url=http://v19.56img.com/images/24/3/r480730716i56olo56i56.com_sc_138478337743hd.jpg
        //130x78
        var p = !(temp = html.match(/<script[\s\S]*"URL_pURL":"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        var u = !(temp = html.match(/<script[\s\S]*"user_id":"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        var s = !(temp = html.match(/<script[\s\S]*"URL_sURL":"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        var id = !(temp = html.match(/<script[\s\S]*"URL_URLid":"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        var h = !(temp = html.match(/<script[\s\S]*"img_host":"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1].replace('56.com', '56img.com');
        cover = !(p && u && s && id && h) ? null : 'http://' + h + '/images/' + p + '/' + s + '/' + u + 'i56olo56i56.com_' + id + '.jpg';
        break;
      case 'baomihua.com':
        //plan A
        //var temptitle = '权志龙独揽四项大奖演出惊艳全场';
        title = !(temp = html.match(/var temptitle = '([^']*)';/i)) ? null : !temp[1] ? null : temp[1];
        //http://video.baomihua.com/11258722/28470044
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d{8})\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script...var pic = "http://img03.video.baomihua.com/x/28470044.jpg";...</script>(也可以直接拼)
        //120x90
        cover = 'http://img01.video.baomihua.com/x/' + vid + '.jpg';
        break;
      case 'yinyuetai.com':
        //plan A
        //<meta property="og:title"......content="意外 官方版 - 薛之谦"/>
        title = !(temp = html.match(/<meta property="og:title"[^<>]*content="([^">]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.yinyuetai.com/video/818636
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d+)\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<meta property="og:image" content="http://img0.yytcdn.com/video/mv/131125/818636/E66901428C8A00732EBC7FE11A528C50_240x135.jpeg"/>
        //240x135
        //todo playlist
        cover = !(temp = html.match(/<meta property="og:image"[^<>]*content="([^">]*)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'acfun.tv':
      case 'acfun.com':
        //plan A
        //<h1 id="title-article" class="title" title="视频标题">日产GT-R Nismo</h1>
        title = !(temp = html.match(/<h1 id="title-article" class="title" title="视频标题">([^<>]*)<\/h1>/i)) ? null : !temp[1] ? null : temp[1];
        //http://www.acfun.tv/a/ac926643(这是文章，要排除)
        //http://www.acfun.tv/v/ac926028
        vid = !(temp = url) ? null : !(temp = temp.match(/\/v\/ac(\w+)\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script...system.preview = $.parseSafe('http://g2.ykimg.com/1100641F4650FA56B9414F046A66C3E3F08B15-C6AF-7C3E-27F1-FED09306E33F');...</script>
        cover = !vid ? null : ~vid.indexOf('_') ? null : !(temp = html.match(/<script[\s\S]*system.preview\s*=\s*\$\.parseSafe\('([^';,<>)]*)'[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'bilibili.tv':
      case 'bilibili.kankanews.com':
        //plan A
        //<meta name="title" content="【舍长实况】《逃生》全集（6P完结）" />
        title = !(temp = html.match(/<meta name="title" content="([^"<>]+)/i)) ? null : !temp[1] ? null : temp[1];
        //http://www.bilibili.tv/video/av805830
        //http://www.bilibili.tv/video/av805830/index.html
        //http://www.bilibili.tv/video/av805830/index_2.html
        vid = !(temp = url) ? null : !(temp = temp.match(/\/av(\d+)(\/index(_(\d+))?\.html)?\/?([?&#]|$)/i)) ? null : temp[1] + '&page=' + (temp[3] || '1');
        //<img src="http://i0.hdslb.com/u_f/50e9761218ca14014408fa95e8e0af9c.jpg" class="cover_image"/>
        //120x90
        cover = (/index_\d+\.html([?&#]|$)/i.test(url) && !/index(_1)?\.html([?&#]|$)/i.test(url)) ? null : !(temp = html.match(/<img src="([^"<>]+)" class="cover_image"\/>/i)) ? null : !temp[1] ? null : temp[1];
        break;
    }
    if (!vid) {
      callback(new Error(400));
      return;
    }
    if (title && title.length > 50) {
      title = title.substr(0, 49) + '…';
    }
    title = sanitize(title).entityDecode();
    title = sanitize(title).trim();
    callback(null, {
      type: 'VIDEO',
      url: url,
      vid: vid,
      cover: cover,
      title: title
    });
  });
}

function getWeiboDetail(url, callback) {
  callback = callback || function () {
  };
  var temp;
  var mid = (temp = /weibo\.com\/\d+\/(\w+)/i.exec(url)) && temp[1];
  console.log(mid);
  var data;

  _getHtml('https://api.weibo.com/2/statuses/queryid.json?source=' + config.WEIBO_APPKEY + '&access_token=' + 'd4e7f8f717428c1e2ed3f2bc936d063d' + '&type=1&isBase62=1&mid=' + mid, function (err, html) {
    if (err) {
      return callback(err);
    }
    var idstr = JSON.parse(html).id;
    console.log(idstr);

    _getHtml('https://api.weibo.com/2/statuses/show.json?source=' + config.WEIBO_APPKEY + '&access_token=' + 'd4e7f8f717428c1e2ed3f2bc936d063d' + '&id=' + idstr, function (err, html) {
      if (err) {
        return callback(err);
      }
      console.log(html);
      async.series([function (callback) {
        data = extend(JSON.parse(html), {mid62: mid, id: null});
        if (!data.retweeted_status || !data.retweeted_status.idstr) {
          return callback();
        }
        _getHtml('https://api.weibo.com/2/statuses/querymid.json?source=' + config.WEIBO_APPKEY + '&access_token=' + 'd4e7f8f717428c1e2ed3f2bc936d063d' + '&type=1&id=' + data.retweeted_status.idstr, function (err, html) {
          if (err) {
            return callback(err);
          }
          console.log(JSON.parse(html));
          extend(data.retweeted_status, {mid62: JSON.parse(html).mid, id: null});
          return callback();
        });
      }], function (err) {
        if (err) {
          return callback(err);
        }
        if (!data || data.error) {
          return callback(new Error(400));
        }
        data.parsed_text = WeiboHelper.process_text(escape(data.text));
        if (data.retweeted_status && data.retweeted_status.idstr) {
          data.retweeted_status.parsed_text = WeiboHelper.process_text(escape(data.retweeted_status.text));
        }

        if (data.retweeted_status && data.retweeted_status.idstr) {
          data.retweeted_status.time = getWeiboTime(data.retweeted_status.created_at);
        }
        callback(null, extend(data, {
          type: 'WEIBO',
          url: url,
          time: getWeiboTime(data.created_at)
        }));
      });
    });
  });
}

function getSearchImages(keyword, callback) {
  callback = callback || function () {
  };
  _getHtml('http://image.so.com/j?pn=100&q=' + keyword, function (err, html) {
    if (err) {
      return callback(err);
    }
    var list = JSON.parse(html).list;
    var images = [];
    list.forEach(function (item) {
      if (item.title && item.title.length > 50) {
        item.title = item.title.substr(0, 49) + '…';
      }
      images.push({
        url: item.img,
        quote: item.link,
        title: item.title
      })
    });
    callback(null, images);
  });
}

function getWeiboTime(created_at) {
  var date = new Date(created_at);
  var _normalizeTime = function (time) {
    if (time >= 10) {
      return time;
    }
    return '0' + time;
  }
  return date.getFullYear() + '.'
    + (date.getMonth() + 1) + '.'
    + date.getDate() + ' '
    + _normalizeTime(date.getHours()) + ':'
    + _normalizeTime(date.getMinutes());
}

function getDetail(url, callback) {
  var temp;
  temp = (temp = utils.REGEXP_URL.exec(url)) && temp[2];
  if (utils.REGEXP_QUOTE.WEIBO.test(temp)) {
    getWeiboDetail(url, function (err, result) {
      if (err) {
        return callback();
      }
      callback(null, result);
    });
  } else if (utils.REGEXP_QUOTE.VIDEO.test(temp)) {
    getVideoDetail(url, function (err, result) {
      if (err) {
        return callback();
      }
      callback(null, result);
    });
  } else {
    callback();
  }
}

function getData(req) {
  var type = req.body.type;
  var data;

  switch (type) {
    case 'LINK_CREATE':
    case 'LINK':
      var url = sanitize(req.body.url).trim();
      var title = sanitize(req.body.title).trim();
      var snippet = sanitize(req.body.snippet).trim();
      var description = sanitize(req.body.description).trim();

      check(url).notNull().isUrl();
      check(title).len(0, 50);
      check(snippet).len(0, 140);
      check(description).len(0, 140);

      data = {
        url: url,
        title: title,
        snippet: snippet,
        description: description
      }
      break;
    case 'IMAGE_CREATE':
    case 'IMAGE':
      var url = sanitize(req.body.url).trim();
      var title = sanitize(req.body.title).trim();
      var quote = sanitize(req.body.quote).trim();
      var description = sanitize(req.body.description).trim();
      var imageByteData = req.body.imageByteData;

      check(url).notNull().isUrl();
      check(title).len(0, 50);
      if (quote.length) check(quote).isUrl();
      check(description).len(0, 140);

      data = {
        url: url,
        title: title,
        quote: quote,
        description: description,
        imageByteData: imageByteData
      }
      break;
    case 'VIDEO_CREATE':
    case 'VIDEO':
      var url = sanitize(req.body.url).trim();
      var vid = sanitize(req.body.vid).trim();
      var cover = sanitize(req.body.cover).trim();
      var title = sanitize(req.body.title).trim();
      var description = sanitize(req.body.description).trim();

      check(url).notNull().isUrl();
      if (type == 'VIDEO') check(vid).notNull();
      if (cover.length) check(cover).isUrl();
      check(title).len(0, 50);
      check(description).len(0, 140);

      data = {
        url: url,
        vid: vid,
        cover: cover,
        title: title,
        description: description
      }
      break;
    case 'CITE':
      var cite = sanitize(req.body.cite).trim();
      var url = sanitize(req.body.url).trim();
      var title = sanitize(req.body.title).trim();
      var description = sanitize(req.body.description).trim();

      check(cite).len(1, 140);
      if (url.length) check(url).isUrl();
      check(title).len(0, 50);
      check(description).len(0, 140);

      data = {
        cite: cite,
        url: url,
        title: title,
        description: description
      }
      break;
    case 'WEIBO_CREATE':
    case 'WEIBO':
      var url = sanitize(req.body.url).trim();
      var description = sanitize(req.body.description).trim();
      var created_at = sanitize(req.body.created_at).trim();
      var idstr = sanitize(req.body.idstr).trim();
      var mid62 = sanitize(req.body.mid62).trim();
      var text = sanitize(req.body.text).trim();
      var parsed_text = sanitize(req.body.parsed_text).trim();
      var source = sanitize(req.body.source).trim();
      var pic_urls = req.body.pic_urls;
      var user = req.body.user;
      var retweeted_status = req.body.retweeted_status;

      check(url).notNull().isUrl();
      check(description).len(0, 140);

      data = {
        url: url,
        description: description,
        created_at: created_at,
        idstr: idstr,
        mid62: mid62,
        text: text,
        parsed_text: parsed_text,
        source: source,
        pic_urls: pic_urls,
        user: user,
        retweeted_status: retweeted_status
      }
      break;
    case 'TEXT':
      var text = sanitize(req.body.text).trim();

      check(text).len(1, 140);

      data = {
        text: text
      }
      break;
    case 'TITLE':
      var title = sanitize(req.body.title).trim();

      check(title).len(1, 50);

      data = {
        title: title
      }
      break;
    default :
      data = {};
      break;
  }
  data.type = type;
  return data;
}

function getItemData(item) {
  var itemData;

  switch (item.type) {
    case 'LINK':
      itemData = {
        url: item.url,
        fav: utils.getFav(item.url),
        title: item.title,
        snippet: item.snippet,
        description: item.description
      }
      break;
    case 'IMAGE':
      itemData = {
        url: item.url,
        title: item.title,
        quote: item.quote,
        quoteDomain: utils.getQuote(item.quote),
        description: item.description
      }
      break;
    case 'VIDEO':
      itemData = {
        url: item.url,
        quote: utils.getQuote(item.url, 'VIDEO'),
        cover: item.cover,
        vid: item.vid,
        title: item.title,
        description: item.description
      }
      break;
    case 'CITE':
      itemData = {
        cite: item.cite,
        url: item.url,
        title: item.title,
        description: item.description
      }
      break;
    case 'WEIBO':
      itemData = {
        url: item.url,
        description: item.description,
        created_at: item.created_at,
        time: getWeiboTime(item.created_at),
        idstr: item.idstr,
        mid62: item.mid62,
        text: item.text,
        parsed_text: item.parsed_text,
        source: item.source,
        pic_urls: item.pic_urls,
        user: item.user.toObject(),
        retweeted_status: item.retweeted_status.toObject()
      }

      if (itemData.retweeted_status && itemData.retweeted_status.idstr) {
        itemData.retweeted_status.time = getWeiboTime(item.retweeted_status.created_at);
      }
      break;
    case 'TEXT':
      itemData = {
        text: item.text
      }
      break;
    case 'TITLE':
      itemData = {
        title: item.title
      }
      break;
    default:
      itemData = {};
      break;
  }
  itemData._id = item._id;
  itemData.type = item.type;
  return itemData;
}

exports.linkify = linkify;
exports.validateEmail = validateEmail;
exports.escape = escape;
exports.concatNoDup = concatNoDup;
exports.getLinkDetail = getLinkDetail;
exports.getVideoDetail = getVideoDetail;
exports.getWeiboDetail = getWeiboDetail;
exports.getSearchImages = getSearchImages;
exports.getWeiboTime = getWeiboTime;
exports.getDetail = getDetail;
exports.getData = getData;
exports.getItemData = getItemData;