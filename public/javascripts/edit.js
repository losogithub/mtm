/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/3/13
 * Time: 11:26 PM
 * To change this template use File | Settings | File Templates.
 */

(function ($) {

  var topicId = 0;

  (function getMissionId() {
    if (location.hash
      && !isNaN(parseInt(location.hash.substr(1), 16))) {
      topicId = location.hash.substr(1);
      $.getJSON('/topic/getcontents', {
        id: topicId
      }).done(function (data) {
          doIfGetIdDone(data);
        });
    } else {
      $.getJSON('/topic/getid')
        .done(function (data) {
          doIfGetIdDone(data);
        });
    }
  })();

  var doIfGetIdDone = function (data) {
    console.log(data.id);
    if (data.id) {
      topicId = data.id;
      location.hash = '#' + topicId;
    }
    $(function ($) {
      $('#editFormOption').click(function () {
        $(this).toggleClass('ButtonToggleClose ButtonToggleOpen')
        $('#editFormBox02').toggle('fast')
      }).fadeIn('slow');
      $('.WidgetList01').sortable({
        placeholder: 'Widget WidgetDragPlaceholder',
        forcePlaceholderSize: true,
        opacity: 0.5,
        tolerance: "pointer",
        start: function (event, data) {
        },
        stop: function (event, data) {
        },
        update: function (event, data) {
          console.log('update');
          var itemId = data.item.attr('id');
          var prevItemId = data.item.prev().attr('id');
          console.log(data.item.prev());
          console.log(data.item.prev().attr('id'));
          $.ajax('/topic/sort', {
            type: 'PUT',
            data: {
              topicId: topicId,
              itemId: itemId,
              prevItemId: prevItemId
            }
          })
        }
      });
    }($));

    $(function ($) {
      $('.Contents').edit({ items: data.items });
    });
  };

  $.widget('mtm.edit', {

    options: {
      mode: 'default'
    },

    _create: function () {
      this.options.$ul = this.widget().find('.WidgetList01');
      var self = this;

      var items = this.options.items;
      var prevItem;
      if (items) {
        $.each(items, function (i, item) {
          prevItem = self.insertItemAfter(item, prevItem);
        });
      }

      self.widget().delegate('.WidgetList01', 'click', function (event) {
        if (self.options.mode == 'edit') {
          console.log('haha1');
          var $selected = $('.Selected', self.options.$ul);
          if ($selected.length) {
            console.log('haha2');
            var sType = ['Link', 'Img', 'Video', 'Quote', 'Txt', 'Ttl']
            for (var i = 0; i < sType.length; i++) {
              if ($selected.first().find('.WidgetItem').is('.Type' + sType[i]) && $(event.target).is('.Type' + sType[i])) {
                console.log('haha');
                return;
              }
            }
          }
          if ($selected.itemText('option', 'mode') == 'create') {
            $selected.itemText('cancel');
          } else {
            if (!confirm('您有正在编辑的内容，确定要放弃然后添加其他类型的条目吗？')) {
              return;
            }
            //TODO 放弃对已有条目的修改
          }
        }
        ;
        var options = {
          create: function () {
            self.options.mode = 'edit';
          },
          cancel: function () {
            self.options.mode = 'default';
          },
          commit: function (event, data) {
            self.insertItemAfter(data);
            self.options.mode = 'default';
          }
        };
        var $editWidget = self.widget().find('#templates .Widget').clone().addClass('Selected');
        self.options.$ul.prepend($editWidget);
        switch (event.target.className) {
          case 'WidgetUtilBtn TypeTxt':
            $editWidget.itemText(options);
            break;
          default :
            $editWidget.remove();
            break;
        }
      });
    },

    insertItemAfter: function (item, prevItem) {
      var $defaultWidget = this.widget().find('#templates .Widget').clone();
      if (prevItem) {
        $defaultWidget.insertAfter(prevItem);
      } else {
        $defaultWidget.prependTo(this.options.$ul);
      }
      console.log(item.type);
      console.log(item.text);
      switch (item.type) {
        case 'TEXT':
          console.log('case TEXT');
          $defaultWidget.prepend(this.widget().find('#templates div.WidgetItem.TypeTxt').clone())
            .attr('id', item._id)
            .find('.WidgetItemTxtView')
            .html(item.text)
            .end()
            .slideDown('fast');
          break;
      }
      return $defaultWidget;
    }

  });

  $.widget('mtm.itemText', {
    options: {
      mode: 'create'
    },
    _create: function () {
      var self = this;
      this.widget()
        .addClass('WidgetTypeTxt')
        .prepend($('#templates form.WidgetItem.TypeTxt').clone())
        .find('.WidgetInputBox')
        .autosize({append: '\n'})
        .blur(function () {
          if (this.value == '') {
            self.options.mode = 'create';
          } else {
            self.options.mode = 'edit';
          }
        })
        .focus()
        .end()
        .find('.BtnSave')
        .click(function (event) {
          $('form', self.widget()).submit();
        })
        .end()
        .find('.BtnCancel')
        .click(function (event) {
          if (self.options.mode == 'edit') {
            if (!confirm('您编辑的内容将被丢弃，确定要放弃吗？')) {
              return;
            }
          }
          self.cancel();
        })
        .end()
        .slideDown('fast');

      $('form', this.widget()).validate({
        debug: false,
        ignore: "",
        onkeyup: false,
        focusInvalid: false,
        onfocusout: false,
        submitHandler: function (form) {
          self.commit();
        },
        showErrors: function (errorMap, errorList) {
          if (errorMap.contents) {
            alert(errorMap.contents);
          }
        },
        rules: {
          contents: {
            required: true,
            maxlength: 2000
          }
        },
        messages: {
          contents: {
            required: "尚未输入文本。",
            maxlength: "请输入2000个字以内。"
          }
        }
      });
    },
    remove: function () {
      this.widget().slideUp('fast', function () {
        this.remove();
      });
    },
    cancel: function () {
      this.remove();
      this._trigger('cancel');
    },
    commit: function () {
      var self = this;
      console.log('commit');
      var prevId = this.widget().prev().attr('id');
      $.post('/topic/create', {
        topic_id: topicId,
        prev_item_id: prevId,
        type: 'TEXT',
        text: this.widget().find('.WidgetInputBox').val().replace(/\n/g,'<br>')
      }).done(function (data) {
          self.remove();
          self._trigger('commit', null, data);
        });
    }
  });

})(jQuery);