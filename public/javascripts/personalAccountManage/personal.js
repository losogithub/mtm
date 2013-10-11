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


