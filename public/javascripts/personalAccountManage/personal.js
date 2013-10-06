/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/5/13
 * Time: 6:00 PM
 * To change this template use File | Settings | File Templates.
 */

$(function ($) {
  $(".NavInner .BtnOpen")
    .button({
      text: false,
      icons: {
        primary: "ui-icon-triangle-1-s"
      }
    })
    .click(function () {
      $menu = $('.SubNav').toggle();

      $(document).one("click", function () {
        $menu.hide();
      });
      return false;
    })
});