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
    if (jqXHR.status == 401) {
      var $model = $('#myModal');
      if ($model.is(':visible')) {
        $('.LoginDialog .ErrorHint').text('用户名或密码不正确。');
      } else {
        $model.modal('show');
      }
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
      });


    $('button[name="favorite"]').click(function () {
      var $this = $(this);
      var topicId = $this.data('favorite').topicId;
      var url = $this.data('favorite').url;
      var toLike = !$this.is('.ExSelected');
      $.ajax({
        type: 'POST',
        url: topicId ? '/topic/favorite' : url ? '/u/favorite' : '',
        xhrFields: { withCredentials: true },
        data: {topicId: topicId, url: url, toLike: toLike}
      })
        .done(function (data) {
          console.log('done');
          if (toLike) {
            $this.addClass('ExSelected');
          } else {
            $this.removeClass('ExSelected');
          }
          $('.HeadFVIco').next().text(data.FVCount);
          $('.mdFVCount01Num').text(data.favourite);
        });
    });

    mtm.loginCheck = function () {
      var username = document.getElementById('uName').value;
      var password = document.getElementById('uPas').value;
      var rememberMe = $('#idSaveCheck').is(":checked");
      //primary check: i.e. non empty.
      //either empty
      if (!username || !password) {
        $('.LoginDialog .ErrorHint').text('用户名和密码不能为空。');
        return false;
      }
      //: post topicId and toLike again
      var $button = $('button[name="favorite"]');
      var topicId = $button.data('favorite').topicId;
      var url = $button.data('favorite').url;
      var toLike = !$button.is('.ExSelected');
      //using an ajax send to server to check for login.
      //what is wrong ? why not send ???????????? 10.18 23:39 2013
      $.ajax({
        type: 'POST',
        url: topicId ? '/topic/favorite' : url ? '/u/favorite' : '/loginDialogCheck',
        xhrFields: { withCredentials: true },
        data: {userName: username, password: password, rememberMe: rememberMe, topicId: topicId, url: url, toLike: toLike}
      })
        .done(function (data) {
          location.reload();
          return false;
        });

      return false;
    }
  });
})(jQuery);