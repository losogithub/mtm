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
    console.log('doIfGetIdDone');
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
        update: function (event, data) {
          console.log('sort');
          var itemId = data.item.attr('id').replace(/mtm_/, '');
          var tempId = data.item.prev().attr('id');
          var prevItemId = tempId ? tempId.replace(/mtm_/, '') : undefined;
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
      $('.Contents').edit({ itemsData: data.itemsData });
    });
  };

  $.widget('mtm.edit', {

    options: {
      mode: 'default'
    },

    _create: function () {
      this.options.$ul = this.widget().find('.WidgetList01');
      var self = this;

      var itemsData = this.options.itemsData;
      var prevItem;
      if (itemsData) {
        $.each(itemsData, function (i, itemData) {
          prevItem = self.insertItemAfter(itemData, prevItem);
        });
      }

      self.widget().delegate('#widgetMenu01', 'click', function (event) {
        if (self.options.mode == 'edit') {
          console.log('haha1');
          var $selected = $('.Selected', self.options.$ul);
          if ($selected.length) {
            console.log('haha2');
            var sType = ['Link', 'Img', 'Video', 'Quote', 'Txt', 'Ttl']
            for (var i = 0; i < sType.length; i++) {
              if ($selected.first().find('.WidgetItem').is('.Type' + sType[i]) && $(event.target).is('.Type' + sType[i])) {
                console.log('haha');
                $selected.find('.WidgetInputBox')
                  .focus()
                  .end();
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
        var options = {
          create: function () {
            self.options.mode = 'edit';
          },
          cancel: function () {
            self.options.mode = 'default';
          },
          commit: function () {
            self.options.mode = 'default';
          }
        };
        var $editWidget = self.widget().find('#templates .Widget').clone().addClass('Selected');
        self.options.$ul.prepend($editWidget);
        switch (event.target.className) {
          case 'WidgetMenuBtn TypeTxt':
            $editWidget.itemText(options);
            break;
          default :
            $editWidget.remove();
            break;
        }
      });
    },

    insertItemAfter: function (itemData, $prevItem) {
      console.log('insertItemAfter');
      var self = this;
      var $defaultWidget = this.widget().find('#templates .Widget').clone();
      if ($prevItem && $prevItem[0]) {
        $defaultWidget.insertAfter($prevItem);
      } else {
        $defaultWidget.prependTo(this.options.$ul);
      }
      console.log(itemData.type);
      console.log(itemData.text);
      itemData.li = $defaultWidget;
      createItem(itemData);
      return $defaultWidget;
    }

  });

  $.widget('mtm.itemText', {

    options: {
      mode: 'create',
      text: ''
    },

    _create: function () {
      var self = this;
      this.widget()
        .addClass('WidgetTypeTxt')
        .prepend($('#templates form.WidgetItem.TypeTxt').clone())
        .find('.WidgetInputBox')
        .autosize({ append: '\n' })
        .val(this.options.text.replace(/<br>/g, '\n'))
        .blur(function () {
          if (this.value.replace(/\n/g, '<br>') == self.options.text) {
            self.options.mode = 'create';
          } else {
            self.options.mode = 'edit';
          }
        })
        .end()
        .find('.BtnSave')
        .click(function (event) {
          $('form', self.widget()).submit();
        })
        .end()
        .find('.BtnCancel')
        .click(function () {
          self.cancel();
        })
        .end()
        .removeClass('HeightAnimation')
        .fadeIn('fast', function () {
          self.widget()
            .find('.WidgetInputBox')
            .addClass('HeightAnimation');
        })
        .find('.WidgetInputBox')
        .trigger('autosize.resize')
        .focus()
        .end();

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

    _destroy: function () {
      this.widget().empty();
    },

    cancel: function () {
      var self = this;
      if (self.options.mode == 'edit') {
        if (!confirm('您编辑的内容将被丢弃，确定要放弃吗？')) {
          return;
        }
      }
      var tempId = this.widget().attr('id');
      var id = tempId ? tempId.replace(/mtm_/, '') : undefined;
      if (!id) {
        this.widget().hide('fast', function () {
          this.remove();
        });
      } else {
        this.widget().hide();
        createItem({
          _id: id,
          type: 'TEXT',
          text: self.options.text.replace(/\n/g, '<br>'),
          li: self.widget()
        });
      }
      this._trigger('cancel');
    },
    commit: function () {
      var self = this;
      console.log('commit');
      var tempId = this.widget().attr('id');
      var itemId = tempId ? tempId.replace(/mtm_/, '') : undefined;
      if (itemId) {
        $.ajax('/topic/edititem', {
          type: 'PUT',
          data: {
            itemId: itemId,
            type: 'TEXT',
            text: self.widget().find('.WidgetInputBox').val().replace(/\n/g, '<br>')
          }
        }).done(function (data) {
            data.li = self.widget();
            createItem(data);
            self._trigger('commit', null, data);
          });
      } else {
        var tempId = this.widget().attr('id');
        var prevItemId = tempId ? tempId.replace(/mtm_/, '') : undefined;
        $.post('/topic/createitem', {
          topicId: topicId,
          prevItemId: prevItemId,
          type: 'TEXT',
          text: self.widget().find('.WidgetInputBox').val().replace(/\n/g, '<br>')
        }).done(function (data) {
            data.li = self.widget();
            createItem(data);
            self._trigger('commit', null, data);
          });
      }
    }
  });

  var createItem = function (data) {
    console.log('createItem');
    var itemId = data._id;
    var type = data.type;
    var li = data.li;
    if (li.data('mtm-itemText')) {
      console.log('destroy');
      li.itemText('destroy');
      li.removeAttr('style');
      li.hide();
    }
    switch (type) {
      case 'TEXT':
        var text = data.text;
        li.prepend($('#templates div.WidgetItem.TypeTxt').clone())
          .attr('id', 'mtm_' + itemId)
          .find('.WidgetItemTxtView')
          .html(text)
          .end()
          .find('.BtnEdit')
          .click(function () {
            li.hide();
            var text = li.find('.WidgetItemTxtView').html();
            li.empty();
            var options = $.extend(this.options, {
              id: itemId,
              text: text
            });
            li.itemText(options);
          })
          .end()
          .find('.BtnDel')
          .click(function () {
            if (!confirm('条目删除后无法找回，您确定要删除吗？')) {
              return;
            }
            li.hide('fast', function () {
              li.remove();
            });
            $.ajax('/topic/deleteitem', {
              type: 'DELETE',
              data: {
                topicId: topicId,
                itemId: li.attr('id').replace(/mtm_/, '')
              }
            });
          })
          .end()
          .fadeIn('fast');
        break;
    }
  }

})(jQuery);