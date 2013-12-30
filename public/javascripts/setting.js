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
  var $input = $thumbEdit.find('input[name="url"]');
  var $preview = $thumbEdit.find('button[name="preview"]');
  var $reset = $thumbEdit.find('button[name="reset"]');
  $input.keypress(function (event) {
    if (event.keyCode != 13) {
      return;
    }
    $preview.click();
    return false;
  });
  $preview.click(function () {
    $img.attr('src', shizier.utils.suffixImage($input.val()));
  });
  $reset.click(function () {
    $img.attr('src', coverUrl);
  });
  $('.SettingsForm').submit(function () {
    console.log("click on save settings button");
    var imageUrl = $img.attr('src');
    var description = $('textarea[class="InputBox_Introduce"]').val();
    var connectUrl = $('input[name="site"]').val();
    console.log(imageUrl);
    console.log(description);
    console.log(connectUrl);
    //then send ajax to server.
    $.post('/settings', {
      imageUrl: imageUrl, description: description, connectUrl: connectUrl
    }).done(function () {
        alert('已更新您的个人设置');
      })
      .fail(function () {
        alert('未能成功更新您的个人设置！');
      });
    return false;
  });
});