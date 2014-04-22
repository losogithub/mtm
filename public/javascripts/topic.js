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
    var width = $li.find('.Content').width();
    var height = width * 4 / 5;
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
  $('.WidgetItemList').on('click', '.COLLECT', function () {
    var $this = $(this);
    $.post('/item', {
      type: $this.data('item').type,
      _id: $this.data('item')._id
    })
      .done(function () {
        Messenger().post({
          message: '已成功采集'
        });
      })
      .fail(function () {
        Messenger().post({
          message: '采集失败，请重试',
          type: 'error'
        });
      })
      .always(function () {
        $(document).one('mousedown keydown', function () {
          Messenger().hideAll();
        });
      });
  });
});