/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/3/13
 * Time: 11:26 PM
 * To change this template use File | Settings | File Templates.
 */
$(function($){
  $('#editFormBox02').toggle();
  $('.EditFormOption').click(function() {
    $(this).toggleClass('ButtonToggleClose ButtonToggleOpen');
    $('#editFormBox02').toggle('fast');
  });
}($));