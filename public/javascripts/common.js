/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 10/6/13
 * Time: 12:00 AM
 * To change this template use File | Settings | File Templates.
 */
var errorImage = function (img, name) {
  var url = '/images/no_img/' + name + '.png';
  if (url != $(img).attr('src')) {
    $(img).attr('src', url);
  }
}