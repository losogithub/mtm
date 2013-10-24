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

  $(document).ajaxError(function (event, jqXHR) {
    if (jqXHR.status == 401
      && confirm('您的身份信息已过期：\n重新登录请按“确定”，忽略请按“取消”。')) {
      location = '/login';
    }
  });

  $(function ($) {
    $(".Nav-Right_Inner>li:last>button")
      .click(function () {
        var $i = $(this).find('>i');
        $i.toggleClass('icon-caret-down icon-caret-up');
        var $menu = $('.Nav-Drop').toggle();

        $(document).one('click', function () {
          $i.addClass('icon-caret-down');
          $i.removeClass('icon-caret-up');
          $menu.hide();
        });

        return false;
      })
  });

})(jQuery);