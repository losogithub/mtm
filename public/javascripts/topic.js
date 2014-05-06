/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 12/23/13
 * Time: 10:13 AM
 * To change this template use File | Settings | File Templates.
 */

window.sng.controller('TagsInputCtrl', function ($scope, $timeout, $element) {
  var topicId = location.pathname.match(/^\/topic\/([0-9a-f]{24})/)[1];
  $scope.editTag = function () {
    $scope.editing = true;
    $timeout(function () {
      $($element).find('input[placeholder="标签"]').focus();
    })
  };
  $scope.encodeURIComponent = function (text) {
    return encodeURIComponent(text);
  };
  $scope.onAdded = function ($tag) {
    $.post('/tag', angular.extend({ topicId: topicId }, $tag))
      .done(function () {
        Messenger().post({
          message: '成功添加标签 [ ' + $tag.text + ' ]'
        });
      })
      .fail(function () {
        Messenger().post({
          message: '标签 [ ' + $tag.text + ' ] 添加失败',
          type: 'error'
        });
      })
      .always(function () {
        $(document).one('mousedown keydown', function () {
          Messenger().hideAll();
        });
      });
  };
  $scope.onRemoved = function ($tag) {
    $.ajax('/tag', {
      type: 'DELETE',
      data: angular.extend({ topicId: topicId }, $tag)
    })
      .done(function () {
        Messenger().post({
          message: '成功删除标签 [ ' + $tag.text + ' ]'
        });
      })
      .fail(function () {
        Messenger().post({
          message: '标签 [ ' + $tag.text + ' ] 删除失败',
          type: 'error'
        });
      })
      .always(function () {
        $(document).one('mousedown keydown', function () {
          Messenger().hideAll();
        });
      });
  };
});

$(function () {

  var $player = $('.TEMPLATES>.Player');

  //初始化fancybox
  $('.fancybox:visible').fancybox(shizier.fancyboxOptions);

  $('.WidgetItemList').on('click', '.Cover', function () {
    var $li = $(this).closest('li');
    var vid = $li.data('options').vid;
    var quote = $li.find('.Quote a').text();
    var temp = shizier.getVideoSrc(quote, vid);
    var width = $li.find('.Content').width();
    var height = width * 4 / 5;
    $player.clone()
      .find('embed')
      .attr('width', width)
      .attr('height', height)
      .attr('flashvars', temp.vars)
      .attr('src', temp.src)
      .end()
      .show()
      .insertAfter($(this).hide());
  });
  $('.WidgetItemList').on('click', '.Player button[name="close"]', function () {
    $(this).parent().prev().slideDown(100).end().slideUp(100, function () {
      $(this).remove();
    });
  });
  $('.WidgetItemList').on('click', '.COLLECT', function () {
    var $this = $(this);
    $.post('/item', {
      type: $this.data('item').type,
      _id: $this.data('item')._id
    })
      .done(function () {
        Messenger().post({
          message: '已成功采集'
        });
      })
      .fail(function () {
        Messenger().post({
          message: '采集失败，请重试',
          type: 'error'
        });
      })
      .always(function () {
        $(document).one('mousedown keydown', function () {
          Messenger().hideAll();
        });
      });
  });

  var $previewWrapper = $('.PreviewWrapper');
  var $preview = $('.Preview');
  var contentWindow = $preview.find('>iframe').get(0).contentWindow;
//  var timeout;
  $('.WidgetItemList').on('mouseenter', '>li .Quote a', function () {
    if ($previewWrapper.is(':hidden')) {
      return;
    }
    var $this = $(this);
    var options = $this.closest('.WidgetItemList>li').data('options');
    var url = options.type == 'IMAGE' ? options.quote : options.url;
    if (url) {
      $preview.show();
      console.log(url)
//      timeout = setTimeout(function () {
        contentWindow.location.replace(url);
//      }, 1000);
    }
  })
  $('.WidgetItemList').on('mouseleave', '>li .Quote a', function () {
//    clearTimeout(timeout);
    if ($preview.is(':visible')) {
      contentWindow.location.replace('about:blank');
    }
    $preview.hide();
  })
});