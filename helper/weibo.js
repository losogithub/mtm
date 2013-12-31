/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 12/31/13
 * Time: 12:45 PM
 * To change this template use File | Settings | File Templates.
 */
module.exports = {
  config: {

    host: 'http://api.t.sina.com.cn',

    user_home_url: 'http://weibo.com/n/',

    search_url: 'http://weibo.com/k/'
  },
  URL_RE: new RegExp('(?:\\[url\\s*=\\s*|)((?:www\\.|http[s]?://)[\\w\\.\\?%&\\-/#=;:!\\+~]+)(?:\\](.+)\\[/url\\]|)', 'ig'),
  /**
   * format status.text to display
   */
  process_text: function (str_or_status, need_encode) {
    var str = str_or_status;
    if (need_encode === 'undedfined') {
      need_encode = true;
    }
    if (str_or_status.text !== undefined) {
      str = str_or_status.text;
    }
    if (str) {
      if (need_encode) {
        str = utils.htmlencode(str);
      }
      str = str.replace(this.URL_RE, this._replace_url_callback);
      str = this.process_at(str, str_or_status); //@***
      str = this.process_emotional(str);
      str = this.process_search(str); //#xxXX#
// iPhone emoji
      str = str.replace(/([\uE001-\uE537])/gi, this._get_iphone_emoji);
    }
    return str || '&nbsp;';
  },
  _replace_url_callback: function (m, g1, g2) {
    var _url = g1;
    if (g1.indexOf('http') !== 0) {
      _url = 'http://' + g1;
    }
    return '<a target="_blank" class="link" href="{{url}}">{{value}}</a>'.format({
      url: _url, title: g1, value: g2 || g1
    });
  },

  _get_iphone_emoji: function (str) {
    return "<span class=\"iphoneEmoji " + str.charCodeAt(0).toString(16).toUpperCase() + "\"></span>";
  },

  SEARCH_MATCH_RE: /#([^#]+)#/g,
  SEARCH_TPL: '<a target="_blank" href="{{search_url}}{{search}}" title="Search #{{search}}">#{{search}}#</a>',

  process_search: function (str) {
    var that = this;
    return str.replace(this.SEARCH_MATCH_RE, function (m, g1) {
      return that._process_search_callback(m, g1);
    });
  },

  _process_search_callback: function (m, g1) {
// 修复#xxx@xxx#嵌套问题
// var search = g1.remove_html_tag();
    return this.SEARCH_TPL.format({ search: g1, search_url: this.config.search_url });
  },

  format_search_text: function (str) { // 格式化主题
    return '#' + str.trim() + '#';
  },

  AT_RE: /@([\w\-\_\u2E80-\u3000\u303F-\u9FFF]+)/g,
  process_at: function (str) {
//@*** u4e00-\u9fa5:中文字符 \u2E80-\u9FFF:中日韩字符
//【观点·@任志强】今年提出的1000万套的保障房任务可能根本完不成
// http://blog.oasisfeng.com/2006/10/19/full-cjk-unicode-range/
// CJK标点符号：3000-303F
    var tpl = '<a class="at_user" data-name="$1" href="javascript:;" rhref="' +
      this.config.user_home_url + '$1" title="show users">@$1</a>';
    return str.replace(this.AT_RE, tpl);
  },

  process_emotional: function (str) {
    var that = this;
    return str.replace(/\[([\u4e00-\u9fff,\uff1f,\w]{1,4})\]/g, function (m, g1) {
      return that._replace_emotional_callback(m, g1);
    });
  },

  EMOTIONAL_TPL: '<img title="{{title}}" src="{{src}}" />',
  _replace_emotional_callback: function (m, g1) {
    if (g1) {
      var face = this.EMOTIONS[g1];
      if (face) {
        return this.EMOTIONAL_TPL.format({ title: m, src: FACE_URL_PRE + face });
      }
    }
    return m;
  }
};