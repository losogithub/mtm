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
    var $li = $(this).closest('li');
    var vid = $li.data('options').vid;
    var quote = $li.find('.Quote a').text();
    var temp = shizier.getVideoSrc(quote, vid);
    var width = $li.width();
    width = width < 480 && width || 480;
    var height = width * 5 / 6;
    $player.clone()
      .find('embed')
      .attr('width', width)
      .attr('height', height)
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