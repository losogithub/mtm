/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 6/3/14
 * Time: 6:27 PM
 * To change this template use File | Settings | File Templates.
 */

function ItemsCtrl($scope, $sce, $ionicPopup, $ionicSlideBoxDelegate, $ionicModal, $ionicScrollDelegate, $timeout) {
  var index = 0;
  $scope.items = [];
  $scope.slidesItems = [];
  $scope.noMoreHotTopics;
  $scope.loadMore = function () {
    $.get($scope.loadApi, {
      index: index,
      count: 10
    })
      .done(function (data) {
        if (!data.length) {
          $scope.noMoreHotTopics = true;
        }
        index += data.length;
        $scope.items = $scope.items.concat(data);
        $scope.slidesItems = $scope.items.slice(0, $ionicSlideBoxDelegate.currentIndex() + 1);
        $scope.$apply();
        $ionicSlideBoxDelegate.update();
      })
      .always(function () {
        $scope.$broadcast('scroll.infiniteScrollComplete');
      });
  };
  $scope.submit = function (item, scope) {
    if (!scope.comment) return;
    $.post('/comment', {
      itemType: $scope.modal.item.type,
      itemId: $scope.modal.item._id,
      replyId: null,
      text: scope.comment
    })
      .done(function (data) {
        data.author = $scope.yourself;
        $scope.modal.item.comments.splice(0, 0, data);
        scope.comment = '';
        $scope.closeModal();
        $ionicScrollDelegate.scrollTop();
        $scope.$apply();
      })
      .fail(function () {
        $ionicPopup.alert({
          title: '评论失败'
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
  $scope.onFavError = function (item) {
    var temp = 'http://www.google.com/s2/favicons?domain=' + item.url;
    if (temp != item.fav) {
      item.fav = temp;
    }
  };
  $scope.getHtml = function (text) {
    return $sce.trustAsHtml(text && shizier.utils.escape(text).replace(/\n/g, "<br>") || '');
  };
  $scope.getWeiboHtml = function (text) {
    return $sce.trustAsHtml(text);
  };

  $ionicModal.fromTemplateUrl('comment.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
      $scope.modal = modal;
    });
  $scope.openModal = function(item) {
    $scope.modal.item = item;
    $(window).one('keyup', function(e) {
      // Escape pressed
      if (e.keyCode == 27) {
        $scope.closeModal();
      }
    });
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  $scope.$on('modal.shown', function() {
    $('#_comment').find('input').focus();
  });
  $scope.getVideoSrc = function (item) {
    var temp = shizier.getVideoSrc(item.quoteDomain, item.vid);
    return $sce.trustAsResourceUrl(temp ? temp.src : '');
  };
  $scope.getVideoVars = function (item) {
    var temp = shizier.getVideoSrc(item.quoteDomain, item.vid);
    return temp ? temp.vars : '';
  };
  $scope.playVideo = function (item) {
    item.playing = true;
    $timeout(function () {
      item.show = true;
    });
    item.width = $('.VideoWrapper').width();
    item.height = item.width * 4 / 5;
  };
}

window.sng.controller('IndexCtrl', function (
  $scope, $sce, $ionicPopup, $ionicSlideBoxDelegate, $ionicModal, $ionicScrollDelegate, $timeout) {
  $.extend(this, new ItemsCtrl($scope, $sce, $ionicPopup, $ionicSlideBoxDelegate, $ionicModal, $ionicScrollDelegate, $timeout));
  $scope.loadApi = '/api/t/hot';
  $scope.slideHasChanged = function (index) {
    if (index + 1 == $ionicSlideBoxDelegate.slidesCount()
      && !$scope.noMoreHotTopics) {
      $scope.loadMore();
      return;
    }
    $scope.slidesItems = $scope.items.slice(0, index + 1);
    $timeout(function () {
      $ionicSlideBoxDelegate.update();
    });
  };
});