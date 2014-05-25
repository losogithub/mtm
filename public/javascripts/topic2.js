/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 12/23/13
 * Time: 10:13 AM
 * To change this template use File | Settings | File Templates.
 */

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

$(function () {

  var $player = $('.TEMPLATES>.Player');

  $('.WidgetItemList').on('click', '.Cover', function () {
    var $li = $(this).closest('li');
    var options = $li.data('options');
    var temp = shizier.getVideoSrc(options.quote, options.vid);
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

});