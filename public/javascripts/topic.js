/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 12/23/13
 * Time: 10:13 AM
 * To change this template use File | Settings | File Templates.
 */

window.sng.controller('TopicCtrl', function (
  $scope, $sce, $ionicPopup, $ionicSlideBoxDelegate, $ionicModal, $ionicScrollDelegate, $timeout) {
  $.extend(this, new ItemsCtrl($scope, $sce, $ionicPopup, $ionicSlideBoxDelegate, $ionicModal, $ionicScrollDelegate, $timeout));
  $scope.loadApi = '/api' + location.pathname;
  $scope.loadMore();
});