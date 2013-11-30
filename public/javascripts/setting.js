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
  var $thumbEdit = $('#_thumbEdit');
  var $img = $thumbEdit.find('#_thumb');
  var coverUrl = $img.attr('src');
  var $input = $thumbEdit.find('input');
  var $preview = $thumbEdit.find('button[name="preview"]');
  var $reset = $thumbEdit.find('button[name="reset"]');
  var autoHide = false;
  $reset.click(function() {
    autoHide = true;
    $img.attr('src', coverUrl);
  });
  $preview.click(function () {
    autoHide = true;
    $img.attr('src', shizier.utils.suffixImage($input.val()));
  });
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

