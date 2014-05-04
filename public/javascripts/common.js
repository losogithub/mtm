/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 10/6/13
 * Time: 12:00 AM
 * To change this template use File | Settings | File Templates.
 */
//使用全局变量应避免污染命名空间
(function ($) {

  window.console = window.console || {log: $.noop, error: $.noop};
  window.shizier = window.shizier || {};

  if (window.angular) {
    window.sng = angular.module(
      'sng',
      ['ui.bootstrap'].concat(
        shizier.pageType == 'EDIT'
          ? ['ui.utils', 'monospaced.elastic', 'ui.sortable']
          : shizier.pageType == 'TOPIC'
          ? ['ngTagsInput']
          : shizier.pageType == 'BOOKMARKLET'
          ? ['ui.utils']
          : [])
    );

    window.sng.controller('LoginDialogCtrl', function ($scope, $http) {
      $scope.submit = function () {
        if (!$scope.username || !$scope.password) {
          $scope.error = '用户名和密码不能为空';
          return;
        }
        $http.post('/login_dialog', {
          userName: $scope.username,
          password: $scope.password,
          remember: $scope.remember
        })
          .success(function () {
            location.reload();
          })
          .error(function () {
            $scope.error = '用户名或密码不正确';
          });
      };
    });
  }

  $._messengerDefaults = {
    extraClasses: 'messenger-fixed messenger-on-bottom messenger-on-right',
    theme: 'flat'
  };

  shizier.fancyboxOptions = {
    openEffect: 'elastic',
    closeEffect: 'elastic',
    openSpeed: 100,
    closeSpeed: 100,
    nextSpeed: 100,
    prevSpeed: 100,
    nextClick: true,
    closeBtn: false,
    helpers: {
      overlay: {
        speedOut: 100
      },
      buttons: {},
      thumbs: {}
    }
  };

  shizier.errorImage = shizier.errorImage || function (img, name, ignoreNull) {
    var $img = $(img);
    if (ignoreNull && !$img.attr('src')) {
      return;
    }
    var url = '/images/no_img/' + name + '.png';
    if (url != $img.attr('src')) {
      $img.attr('src', url);
    }
  };

  shizier.errorFavImage = shizier.errorFavImage || function (img, oriUrl, ignoreNull) {
    var $img = $(img);
    if (ignoreNull && !$img.attr('src')) {
      return;
    }
    var url = 'http://www.google.com/s2/favicons?domain=' + oriUrl;
    if (url != $img.attr('src')) {
      $img.attr('src', url);
    }
  };

  $(function ($) {

    var $modal = $('#myModal');
    $(document).ajaxError(function (event, jqXHR) {
      if (jqXHR.status == 401) {
        $modal.modal('show');
      }
    });

    $('.ShowLogin').click(function () {
      $modal.modal('show');
    });

    $modal.on('shown.bs.modal', function () {
      $('.LoginFocus').focus();
    });

    var URL_INPUT_SELECTOR = 'input[name="url"], input.Url';

    shizier.normalizeUrl = function($url) {
      var url = $url.val();
      if (!$url.length || !url) {
        return;
      }
      url = url.trim().replace('。', '.');
      if (!shizier.utils.REGEXP_PROTOCOL.test(url)) {
        url = 'http://' + url;
      }
      $url.val(url);
    };

    $('form').submit(function () {
      var $urls = $(this).find(URL_INPUT_SELECTOR);
      for (var i = 0; i < $urls.size(); i++) {
        shizier.normalizeUrl($($urls.get(i)));
      }
    });

    $(URL_INPUT_SELECTOR).keypress(function (event) {
      if (event.keyCode != 13) {
        return;
      }
      shizier.normalizeUrl($(this));
    });


  });

  var VIDEO_MAP = {
    'youku.com': ['http://player.youku.com/player.php/sid/#vid#/v.swf', 'isAutoPlay=true'],
    'tudou.com': ['http://www.tudou.com/v/#vid#&autoPlay=true/v.swf', ''],
    'iqiyi.com': ['http://www.iqiyi.com/player/20131119102234/Player.swf?vid=#vid#', 'playMovie=true'],
    'pps.tv': ['http://player.pps.tv/player/sid/#vid#/v.swf', 'auto=1'],
    'sohu.com': ['http://share.vrs.sohu.com/#vid#/v.swf', 'autoplay=true'],
    'my.tv.sohu.com': ['http://share.vrs.sohu.com/my/v.swf&id=#vid#', 'autoplay=true'],
    'qq.com': ['http://static.video.qq.com/TPout.swf?vid=#vid#', 'auto=1'],
    'sina.com.cn': ['http://you.video.sina.com.cn/api/sinawebApi/outplayrefer.php/vid=#vid#&autoPlay=1/s.swf', ''],
    'ifeng.com': ['http://v.ifeng.com/include/exterior.swf?guid=#vid#&AutoPlay=true', ''],
    'letv.com': ['http://i7.imgs.letv.com/player/swfPlayer.swf?id=#vid#', 'autoplay=1'],
    'pptv.com': ['http://player.pptv.com/v/#vid#.swf', 'autostart=true'],
    'ku6.com': ['http://player.ku6.com/refer/#vid#/v.swf', 'auto=1'],
    '56.com': ['http://player.56.com/v_#vid#.swf', 'auto=1'],
    'baomihua.com': ['http://resources.pomoho.com/swf/out_player.swf?flvid=#vid#', ''],
    'yinyuetai.com': ['http://player.yinyuetai.com/video/swf/#vid#/1/a.swf', 'playMovie=true'],
    'acfun.tv': ['http://static.acfun.tv/player/ACFlashPlayerX.out.20130927.swf?type=page&url=ac#vid#', ''],
    'acfun.com': ['http://static.acfun.tv/player/ACFlashPlayerX.out.20130927.swf?type=page&url=ac#vid#', ''],
    'bilibili.tv': ['http://static.hdslb.com/miniloader.swf?aid=#vid#', ''],
    'bilibili.kankanews.com': ['http://static.hdslb.com/miniloader.swf?aid=#vid#', '']
  };

  shizier.getVideoSrc = function (quote, vid) {
    var temp = VIDEO_MAP[quote];
    return {
      src: (temp && temp[0] || '').replace('#vid#', vid),
      vars: temp && temp[1] || ''
    };
  };

})(jQuery);