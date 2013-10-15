/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/10/13
 * Time: 8:45 PM
 * To change this template use File | Settings | File Templates.
 */
/*
 settings page
 personal image
 button click
 */

$(function ($) {
  $('button[name="preview"]')
    .click(function () {
      console.log("click on url button");
      var $url = $('input[name="url" ]').val();
      console.log($url);
      if ($url) {
        //first check the url.
        if (/^(http|https|ftp):\/\/[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i.test($url)) {
          $('#setImage').attr("src", $url).error(function () {
            alert('该图片无法正常显示,');
            $('#setImage').attr("src", "/images/no_img/user_120x120.png");
          });
        } else {
          alert('invalid url');
        }
      }
      return false;
    })
})

$(function ($) {
  $('button[name="save"]')
    .click(function () {
      console.log("click on save settings button");
      var imageUrl = $('input[name="url" ]').val();
      var description = $('textarea[class="InputBox_Introduce"]').val();
      var connectUrl = $('input[name="site"]').val();
      console.log(imageUrl);
      console.log(description);
      console.log(connectUrl);
      //then send ajax to server.
      $.ajax({
        type: 'POST',
        url: '/settings',
        xhrFields: { withCredentials: true },
        data: {imageUrl: imageUrl, description: description, connectUrl: connectUrl},
        success: function () {
          //alert('personal information updated !');
          return;
        },
        error: function () {
          alert('failed');
        }
      });
    })
})

