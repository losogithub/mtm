/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/5/13
 * Time: 6:00 PM
 * To change this template use File | Settings | File Templates.
 */

$(function ($) {
  $(".NavInner .BtnOpen")
    .click(function () {
      var $menu = $('.SubNav').toggle();

      $(document).one("click", function () {
        $menu.hide();
      });

      return false;
    })
});


/*
  works page, sort by crete date, update date ...
  */

$(function($){
  $(".MainTblSortSub a[data-value='c']")
    .click(function(){
      var order = $.data('order');
      if  (order == 'a') {
        $.ajax({
          type: 'get',
          url: '/works',
          success: function(){}
        })
      }
    })
})