/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 10/6/13
 * Time: 12:00 AM
 * To change this template use File | Settings | File Templates.
 */
//使用全局变量应避免污染命名空间
(function ($) {

  window.mtm = window.mtm || {};

  mtm.errorImage = mtm.errorImage || function (img, name) {
    var url = '/images/no_img/' + name + '.png';
    if (url != $(img).attr('src')) {
      $(img).attr('src', url);
    }
  }

  $(function ($) {
    $(".Nav-Right .Btn-Header-Open")
      .click(function () {
        var $menu = $('.Nav-Drop').toggle();

        $(document).one("click", function () {
          $menu.hide();
        });

        return false;
      })
  });

})(jQuery);