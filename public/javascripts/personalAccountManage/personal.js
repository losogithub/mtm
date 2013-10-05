/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/5/13
 * Time: 6:00 PM
 * To change this template use File | Settings | File Templates.
 */

$(function ($) {
  $(".mdHeadUtil01Open")
    .button({
      text: false,
      icons: {
        primary: "ui-icon-triangle-1-s"
      }
    })
    .click(function () {
      $(this).next().toggle();
      var menu = $(this).next().position({
        my: "left top",
        at: "left bottom",
        of: this
      });
      $(document).one("click", function () {
        menu.hide();
      });
      return false;
    })
});