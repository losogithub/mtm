/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 12/23/13
 * Time: 10:13 AM
 * To change this template use File | Settings | File Templates.
 */

window.sng.controller('CommentCtrl2', function ($scope, $ionicPopup) {
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
});