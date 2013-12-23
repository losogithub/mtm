/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 12/23/13
 * Time: 10:13 AM
 * To change this template use File | Settings | File Templates.
 */
$(function () {

  var $player = $('.TEMPLATES>.Player');

  //初始化fancybox
  $('.fancybox:visible').fancybox(shizier.fancyboxOptions);

  $('.WidgetItemList').on('click', '.Cover', function () {
    var $content = $(this).closest('.Content');
    var vid = $content.data('vid');
    var quote = $content.find('.Quote a').text();
    var temp = shizier.getVideoSrc(quote, vid);
    $player.clone()
      .find('embed')
      .attr('flashvars', temp.vars)
      .attr('src', temp.src)
      .end()
      .show()
      .insertAfter($(this).hide());
  });
  $('.WidgetItemList').on('click', '.Player button[name="close"]', function () {
    $(this).parent().prev().slideDown(100).end().slideUp(100, function () {
      $(this).remove();
    });
  });
});