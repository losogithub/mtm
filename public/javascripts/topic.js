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
    $.post('/tag', $.extend({ topicId: topicId }, $tag))
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
      data: $.extend({ topicId: topicId }, $tag)
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

window.sng.controller('CommentCtrl', function ($scope) {
  function _formatCreateDate(comment) {
    function _prefixZero(num) {
      return num < 10 ? '0' + num : num;
    }

    var temp = new Date(comment.createDate);
    comment.createDate = temp.getFullYear() + '-'
      + _prefixZero(temp.getMonth() + 1) + '-'
      + _prefixZero(temp.getDate()) + ' '
      + _prefixZero(temp.getHours()) + ':'
      + _prefixZero(temp.getMinutes()) + ':'
      + _prefixZero(temp.getSeconds());
  }
  $scope.init = function () {
    $scope.comments.forEach(function (comment) {
      _formatCreateDate(comment);
    });
  }
  $scope.submit = function () {
    if (!$scope.comment) return;
    $.post('/comment2', {
      itemType: $scope.itemType,
      itemId: $scope.itemId,
      replyId: null,
      text: $scope.comment
    })
      .done(function (data) {
        _formatCreateDate(data);
        data.author = $scope.yourself;
        $scope.comments.splice(0, 0, data);
        $scope.comment = '';
        $scope.$apply();
      })
      .fail(function () {
        Messenger().post({
          message: '评论失败',
          type: 'error'
        });
        $(document).one('mousedown keydown', function () {
          Messenger().hideAll();
        });
      });
  };
  $scope.like = function (comment) {
    $.post('/comment/like', {
      _id: comment._id
    })
      .done(function (data) {
        comment.like = data.like;
        comment.liked = true;
        $scope.$apply();
      });
  };
});

window.sng.controller('CommentCtrl2', function ($scope, $timeout) {
  function _formatCreateDate(comment) {
    function _prefixZero(num) {
      return num < 10 ? '0' + num : num;
    }

    var temp = new Date(comment.createDate);
    comment.createDate = temp.getFullYear() + '-'
      + _prefixZero(temp.getMonth() + 1) + '-'
      + _prefixZero(temp.getDate()) + ' '
      + _prefixZero(temp.getHours()) + ':'
      + _prefixZero(temp.getMinutes()) + ':'
      + _prefixZero(temp.getSeconds());
  }
  $scope.init = function () {
    for (var key in $scope.comments) {
      $scope.comments[key].forEach(function (comment) {
        _formatCreateDate(comment);
      });
    }
  }
  $scope.submit = function () {
    if (!$scope.comment) return;
    $.post('/comment2', {
      itemType: $scope.itemType,
      itemId: $scope.itemId,
      replyId: null,
      text: $scope.comment
    })
      .done(function (data) {
        _formatCreateDate(data);
        data.author = $scope.yourself;
        $scope.comments[data.itemId].splice(0, 0, data);
        $scope.comment = '';
        $scope.$apply();
      })
      .fail(function () {
        Messenger().post({
          message: '评论失败',
          type: 'error'
        });
        $(document).one('mousedown keydown', function () {
          Messenger().hideAll();
        });
      });
  };
  $scope.like = function (comment) {
    $.post('/comment/like', {
      _id: comment._id
    })
      .done(function (data) {
        comment.like = data.like;
        comment.liked = true;
        $scope.$apply();
      });
  };

  var $window = $(window);
  var $spitWrapper = $('.SpitWrapper');
  var $spitBubble = $('.SpitBubble');
  var $spits = $spitBubble.find('.Spits');
  var $item;
  $spits.perfectScrollbar({
    suppressScrollX: true
  });

  function _updateArrow() {
    $scope.arrowY = Math.min(
      Math.max(
        $item.offset().top - $window.scrollTop() + $item.outerHeight()/2 - 35,
        25
      ),
      $window.outerHeight() - 95);
  }

  $window.scroll(function () {
    $timeout(function () {
      if ($item) {
        _updateArrow();
      }
    });
  });
  $('.WidgetItemList .Hoverable').add($spitWrapper)
    .hover(function () {
      if ($spitWrapper.is(':hidden')) {
        return;
      }
      var $this = $(this);
      var options = $this.closest('li').data('options');

      if (options) {
        $item = $this;
        $timeout(function () {
          $scope.itemType = options.type;
          $scope.itemId = options._id;
          _updateArrow();
          $spits.scrollTop(0);
          setTimeout(function () {
            $spits.perfectScrollbar('update');
          }, 0);
        });
      }
      if ($spitBubble.is(':hidden')) {
        $spitBubble.show();
        setTimeout(function () {
          $spitBubble.find('.AUTO_FOCUS').blur();
          setTimeout(function () {
            $spitBubble.find('.AUTO_FOCUS').focus();
          }, 0);
        }, 0);
      }
      if ($item) {
        $item.addClass('Hover');
      }
    }, function () {
      if ($spitWrapper.is(':hidden')) {
        return;
      }
      $item.removeClass('Hover');
    });
  $('.WidgetItemList').add($spitWrapper)
    .hover(null, function () {
      if ($spitWrapper.is(':hidden')) {
        return;
      }
      $spitBubble.hide();
    });
});

window.sng.controller('SpitCtrl', function ($scope, $timeout) {
  $scope.submit = function () {
    if (!$scope.spit) return;
    $.post('/spit', {
      itemType: $scope.itemType,
      itemId: $scope.itemId,
      text: $scope.spit
    })
      .done(function (data) {
        $scope.spits[data.itemId].splice(0, 0, data);
        $scope.spit = '';
        $scope.$apply();
      })
      .fail(function () {
        Messenger().post({
          message: '吐槽失败',
          type: 'error'
        });
        $(document).one('mousedown keydown', function () {
          Messenger().hideAll();
        });
      });
  };
  $scope.like = function (spit) {
    $.post('/spit/like', {
      _id: spit._id
    })
      .done(function (data) {
        spit.like = data.like;
        spit.liked = true;
        $scope.$apply();
      });
  };

  var $window = $(window);
  var $spitWrapper = $('.SpitWrapper');
  var $spitBubble = $('.SpitBubble');
  var $spits = $spitBubble.find('.Spits');
  var $item;
  $spits.perfectScrollbar({
    suppressScrollX: true
  });

  function _updateArrow() {
    $scope.arrowY = Math.min(
      Math.max(
        $item.offset().top - $window.scrollTop() + $item.outerHeight()/2 - 35,
        25
      ),
      $window.outerHeight() - 95);
  }

  $window.scroll(function () {
    $timeout(function () {
      if ($item) {
        _updateArrow();
      }
    });
  });
  $('.WidgetItemList .Hoverable').add($spitWrapper)
    .hover(function () {
      if ($spitWrapper.is(':hidden')) {
        return;
      }
      var $this = $(this);
      var options = $this.closest('li').data('options');

      if (options) {
        $item = $this;
        $timeout(function () {
          $scope.itemType = options.type;
          $scope.itemId = options._id;
          _updateArrow();
          $spits.scrollTop(0);
          setTimeout(function () {
            $spits.perfectScrollbar('update');
          }, 0);
        });
      }
      if ($spitBubble.is(':hidden')) {
        $spitBubble.show();
        setTimeout(function () {
          $spitBubble.find('.AUTO_FOCUS').blur().focus();
        }, 0);
      }
      if ($item) {
        $item.addClass('Hover');
      }
    }, function () {
      if ($spitWrapper.is(':hidden')) {
        return;
      }
      $item.removeClass('Hover');
    });
  $('.WidgetItemList').add($spitWrapper)
    .hover(null, function () {
      if ($spitWrapper.is(':hidden')) {
        return;
      }
      $spitBubble.hide();
    });
});

$(function () {

  var $player = $('.TEMPLATES>.Player');

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

//  var $previewWrapper = $('.PreviewWrapper');
//  var $preview = $('.Preview');
//  var contentWindow = $preview.find('>iframe').get(0).contentWindow;
//  var lastUrl;
//  $('.WidgetItemList').on('mouseenter', '>li .Quote a', function () {
//    if ($previewWrapper.is(':hidden')) {
//      return;
//    }
//    var $this = $(this);
//    var options = $this.closest('.WidgetItemList>li').data('options');
//    var url = options.type == 'IMAGE' ? options.quote : options.url;
//    if (url) {
//      $preview.show();
//    if (lastUrl != url) {
//      lastUrl = url;
//      contentWindow.location.replace(url);
//    }
//    }
//  });
//  $('.WidgetItemList').on('mouseleave', '>li .Quote a', function () {
//    $preview.hide();
//  });

});