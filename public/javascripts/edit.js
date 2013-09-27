/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/3/13
 * Time: 11:26 PM
 * To change this template use File | Settings | File Templates.
 */

(function ($) {

  var console = window.console || {log: $.noop, error: $.noop};
  //数据库中该总结id
  var topicId = 0;

  /**
   * 入口函数，必须要从服务器验证或获取topicId才能编辑总结
   */
  (function getTopicId() {
    console.log('getTopicId');
    //#后面有16进制数字就验证id并获取items，否则获取新id
    if (location.hash
      && !isNaN(parseInt(location.hash.substr(1), 16))) {
      topicId = location.hash.substr(1);
      $.getJSON('/topic/getcontents', {
        topicId: topicId
      }).done(function (data) {
          _doIfGetIdDone(data);
        });
    } else {
      $.getJSON('/topic/getid')
        .done(function (data) {
          _doIfGetIdDone(data);
        });
    }
  })();

  /**
   * main function
   * @param data
   */
  var _doIfGetIdDone = function (data) {
    console.log('doIfGetIdDone');
    if (data.topicId) {
      topicId = data.topicId;
      location.hash = '#' + topicId;
    }

    $(function ($) {
      __initHead();
      __initOption();
      __initSort();
      $(document).editPage({
        itemsData: data.itemsData
      });
    });
  };

  /**
   * 总结菜单栏固定窗口顶部、监听按钮点击事件
   * @private
   */
  var __initHead = function () {
    var $head = $('.EditHead');
    var headPosition = $head.offset().top;
    $(window).scroll(function () {
      if ($(this).scrollTop() >= headPosition) {
        $head.addClass('EditHeadFixed');
      } else {
        $head.removeClass('EditHeadFixed');
      }
    });
    $head.find('.BtnPublish').click(function () {
      $('.Top form').submit();
    });
  }

  /**
   * 监听可选项目点击事件
   */
  var __initOption = function () {
    //开关可选项目的动画
    $('.EditFormOption').click(function () {
      $(this).toggleClass('ButtonToggleClose ButtonToggleOpen')
      $('.EditFormBox02').toggle('fast')
    }).fadeIn('slow');
  }

  /**
   * 启用列表排序微件
   */
  var __initSort = function () {
    $('.WidgetItemList')
      //防止拖动开始时高度减小导致的抖动
      .mousedown(function () {
        $(this).css('min-height', $(this).height());
      })
      .mouseup(function () {
        $(this).removeAttr('style');
      })

      //启用sortable微件
      .sortable({

        //sortable微件的标准参数
        placeholder: 'Widget WidgetDragPlaceholder',
        forcePlaceholderSize: true,
        opacity: 0.5,
        tolerance: "pointer",
        cursor: 'move',
        scrollSensitivity: 100,
        scrollSpeed: 10,

        //列表顺序改变后的回调函数
        update: function (event, data) {
          console.log('sort');
          data.item.prev().prev().prev();
          //拖动的item是editWidget，不用重排
          var itemId = data.item.attr('mtm_id');
          if (!itemId) {
            return;
          }
          //拖动的item放在了editWidget下面，用
          var prevItemType = data.item.prev().attr('mtm_type');
          if (!prevItemType) {
            prevItemType = data.item.prev().prev().attr('mtm_type');
          }
          var prevItemId = data.item.prev().attr('mtm_id');
          if (!prevItemId) {
            prevItemId = data.item.prev().prev().attr('mtm_id');
          }
          //拖动改变了列表顺序，通知服务器将item插入他前一个item的后面
          // TODO 安全起见topicId由服务器计算
          $.ajax('/topic/sort', {
            type: 'PUT',
            data: {
              topicId: topicId,
              type: data.item.attr('mtm_type'),
              itemId: itemId,
              prevItemType: prevItemType,
              prevItemId: prevItemId
            }
          });
        }
      });
  }

  /*
   * 定义微件：编辑widget的base对象
   */
  $.widget('mtm.editWidget', {

    options: {
    },

    _create: function () {
      console.log('_create');
      var self = this;

      this.widget()
        .attr('mtm_type', this.type)
        .prepend($('.templates .Widget').clone())
        .find('.Widget').children().first()
        .after($('.templates .WidgetContent.' + this.type).clone())
        .end().end().end();

      this.__create();

      this.widget()
        //自适应高度结束后再删除旧内容，以防抖动
        .children().first().next().remove().end().end()
        .end()
        //监听保存按钮点击事件
        .find('.BtnSave')
        .click(function () {
          self.widget().find('form').submit();
        })
        .end()
        //监听放弃按钮点击事件
        .find('.BtnCancel')
        .click(function () {
          self._trigger('cancel');
        })
        .end();

      //如果是修改就淡入，否则是新建就淡入加展开
      if (this.widget().attr('mtm_id')) {
        this.widget()
          .css({ 'opacity': 0 })
          .animate({ 'opacity': 1 }, 'fast', function () {
            self.__animateDone();
          });
      } else {
        this.widget().hide().show('fast');
      }

      //移动光标到输入框末尾
      moveSelection2End(this.widget().find('.WidgetInputBox')[0]);

      this.__initFormValidation();
    },

    __create: $.noop,
    __animateDone: $.noop,
    __initFormValidation: $.noop,

    /**
     * 不带提示的放弃修改
     */
    remove: function () {
      console.log('remove');
      var self = this;

      //如果是新建的就删除dom元素，否则是修改就新建条目dom元素
      var itemId = this.widget().attr('mtm_id');
      if (!itemId) {
        this.widget().css('visibility', 'hidden');
        this.widget().hide('fast', function () {
          $(this).remove();
        });
        this._trigger('setState', null, 'default');
      } else {
        this._trigger('createDisplayItem', null, $.extend({
          $li: self.widget(),
          itemId: itemId,
          type: this.type
        }, this._getOriginalData()));
      }
    },

    _getOriginalData: $.noop,

    /**
     * 保存修改验证表格通过后的发送新文本到服务器
     */
    commit: function () {
      var self = this;
      console.log('commit');

      //ajax完成后修改widget为显示item
      var doneCallback = function (data) {
        data.$li = self.widget();
        self._trigger('createDisplayItem', null, data);
      }

      //如果是修改则传itemId，否则是新建则传prevId
      var data = this._getCommitData();
      var itemId = this.widget().attr('mtm_id');
      if (itemId) {
        $.ajax('/topic/edititem', {
          type: 'PUT',
          data: $.extend({
            itemId: itemId,
            type: self.type
          }, data)
        }).done(doneCallback);
      } else {
        var prevItemType = this.widget().prev().attr('mtm_type');
        var prevItemId = this.widget().prev().attr('mtm_id');
        $.post('/topic/createitem', $.extend({
            topicId: topicId,
            prevItemType: prevItemType,
            prevItemId: prevItemId,
            type: self.type
          }, data))
          .done(doneCallback);
      }
    },

    _getCommitData: $.noop

  });

  /*
   * 定义微件：TEXT编辑widget
   */
  $.widget('mtm.textWidget', $.mtm.editWidget, {

    type: 'TEXT',

    options: {
      //初始文本
      text: ''
    },

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      //textarea自适应高度、填充文本、监听文本改变事件
      this.widget()
        .find('.WidgetInputBox')
        .autosize({
          append: '\n'
        })
        .val(this.options.text)
        .trigger('autosize.resize')
        .on('input blur mousedown mouseup keydown keypress keyup', function () {
          if (this.value == self.options.text) {
            self._trigger('setState', null, 'create');
          } else {
            self._trigger('setState', null, 'edit');
          }
        })
        .focus()
        .end();
    },

    __animateDone: function () {
      this.widget()
        .find('.WidgetInputBox')
        .addClass('HeightAnimation')
    },

    /**
     * 子类的表单验证
     * @private
     */
    __initFormValidation: function () {
      var self = this;
      this.widget().find('form').validate({
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
            maxlength: "请输入2000字以内文本。"
          }
        }
      });
    },

    /**
     * 子类提交给服务器的数据
     * @returns {{text: *}}
     * @private
     */
    _getCommitData: function () {
      return { text: this.widget().find('.WidgetInputBox').val() }
    },

    /**
     * 子类的原始数据
     * @returns {{text: (string)}}
     * @private
     */
    _getOriginalData: function () {
      return { text: this.options.text}
    }

  });

  /*
   * 定义微件：TITLE编辑widget
   */
  $.widget('mtm.titleWidget', $.mtm.editWidget, {

    type: 'TITLE',

    options: {
      //初始标题
      title: ''
    },

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      //填充文本、监听文本改变事件
      this.widget()
        .find('.WidgetInputBox')
        .val(this.options.title)
        .on('input blur mousedown mouseup keydown keypress keyup', function () {
          if (this.value == self.options.title) {
            self._trigger('setState', null, 'create');
          } else {
            self._trigger('setState', null, 'edit');
          }
        })
        .focus()
        .end();
    },

    /**
     * 子类的表单验证
     * @private
     */
    __initFormValidation: function () {
      var self = this;
      this.widget().find('form').validate({
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
            maxlength: 100
          }
        },
        messages: {
          contents: {
            required: "尚未输入标题。",
            maxlength: "请输入100字以内标题。"
          }
        }
      });
    },

    /**
     * 子类提交给服务器的数据
     * @returns {{text: *}}
     * @private
     */
    _getCommitData: function () {
      return { title: this.widget().find('.WidgetInputBox').val() }
    },

    /**
     * 子类的原始数据
     * @returns {{title: (string)}}
     * @private
     */
    _getOriginalData: function () {
      return { title: this.options.title}
    }

  });

  /*
   * 定义微件：包含菜单和条目列表
   */
  $.widget('mtm.editPage', {

    //编辑状态标志
    state: 'default',
    //条目列表$对象
    $ul: null,
    //调用微件方法的函数
    callWidgetMethod: $.noop,

    options: {
      //初始化时需要的item数据
      itemsData: []
    },

    /**
     * $.widget框架自动调用的构造函数
     * @private
     */
    _create: function () {
      this.$ul = this.widget().find('.WidgetItemList');
      this.__initTop();
      this.__initMenu();
      this.__initItems();
    },

    /**
     * 初始化总结标题，总结描述
     * @private
     */
    __initTop: function () {
      var $form = this.widget().find('.Top form');
      $form.validate({
        debug: false,
        ignore: "",
        onkeyup: false,
        focusInvalid: false,
        onfocusout: false,
        submitHandler: function (form) {
          self.commit();
        },
        showErrors: function (errorMap, errorList) {
          if (errorMap.title) {
            alert(errorMap.title);
          } else if (errorMap.description) {
              alert(errorMap.description);
          }
        },
        rules: {
          title: {
            required: true,
            minlength: 5,
            maxlength: 50
          },
          description: {
            required: false,
            maxlength: 150
          }
        },
        messages: {
          title: {
            required: "请输入5～50字的总结标题。",
            minlength: "请输入5～50字的总结标题。",
            maxlength: "请输入5～50字的总结标题。"
          },
          description: {
            maxlength: "总结描述超出150字限制。"
          }
        }
      });
    },

    commit: function () {
      $.ajax('topic/publish', {
        type: 'PUT',
        data: {
          topicId: topicId,
          title: this.widget().find('.Top ')
        }
      })
    },

    /**
     * 初始化item创建menu的点击响应
     * @private
     */
    __initMenu: function () {
      var self = this;
      this.widget().delegate('.WidgetMenu01 .WidgetMenuBtn', 'click', function (event) {
        self._createEditWidget($(event.target).attr('mtm_type'), {
          from: 'STATIC'
        });
      });
    },

    /**
     * 对于已经存在的总结，往条目列表填充服务器返回的数据
     * @private
     */
    __initItems: function () {
      var self = this;
      var prevItem;
      this.options.itemsData.forEach(function (itemData) {
        prevItem = self._insertDisplayItem(itemData, prevItem);
      });
    },

    /**
     * 创建一个编辑微件
     * @param type
     * @param extraOptions
     * @private
     */
    _createEditWidget: function (type, extraOptions) {
      console.log('_createEditWidget');
      var self = this;

      var from = extraOptions.from;
      var $prevItem = extraOptions.$prevItem;
      var $item = extraOptions.$item;

      //传给微件的选项
      var options = $.extend({

        /**
         * 编辑微件通知编辑页面创建条目的回调事件
         * @param event
         * @param data
         */
        createDisplayItem: function (event, data) {
          self._createDisplayItem(data.$li, data.type, data.itemId, data);
          console.log('default');
          self.state = 'default';
        },

        /**
         * $.widget框架自动调用的回调事件
         */
        create: function () {
          console.log('create');
          self.state = 'create';
          self.editType = type;
          self.from = from;
          self.$editingWidget = $editWidget;
          self.$editingPrevItem = $prevItem;
        },

        /**
         * 带提示的放弃修改
         */
        cancel: function () {
          console.log('cancel');
          if (self.state == 'edit') {
            if (!confirm('您编辑的内容将被丢弃，确定要放弃吗？')) {
              return;
            }
          }

          self.callWidgetMethod.call($(this), 'remove');
        },

        setState: function (event, state) {
          console.log(state);
          self.state = state;
        }

      }, extraOptions);

      //编辑页面不在默认状态
      if (self.state != 'default') {
        console.log('self.state != default');

        //编辑中的微件和目标微件:类型相同、来源相同，只需给输入框焦点
        var $editingWidget = self.$editingWidget;
        if ($editingWidget.attr('mtm_type') == type
          && self.from == from
          && (from == 'STATIC'
          || from == 'DYNAMIC' && self.$editingPrevItem == $prevItem)) {
          console.log('重置焦点');

          $editingWidget.find('.WidgetInputBox')
            .focus()
            .end();
          //todo 优化：是否要移动光标？
          return;
        }

        //编辑中的微件处在已修改状态
        if (this.state == 'edit'
          && !confirm('您有正在编辑的内容，确定要放弃然后添加其他类型的条目吗？')) {
          return;
        }

        //删除编辑中的微件
        this.callWidgetMethod.call($editingWidget, 'remove');
      }

      //如果是修改就用原条目新建微件，否则是插入就复制新的li元素
      if ($item) {
        var $editWidget = $item;
      } else {
        var $editWidget = this.widget().find('.templates .WidgetItem').clone();
        //如果是动态插入就插入前趋条目的后面，否则是静态插入就插入最前面
        if ($prevItem) {
          $prevItem.after($editWidget);
        } else {
          this.$ul.prepend($editWidget);
        }
      }

      //根据类型选择微件，并保存调用微件方法的函数
      switch (type) {
        case 'TEXT':
          console.log('_createEditWidget TEXT');
          $editWidget.textWidget(options);
          this.callWidgetMethod = $editWidget.textWidget;
          break;
        case 'TITLE':
          console.log('_createEditWidget TITLE');
          $editWidget.titleWidget(options);
          this.callWidgetMethod = $editWidget.titleWidget;
          break;
        default :
          $editWidget.remove();
          break;
      }
    },

    /**
     * 插入一个显示item
     * @param itemData
     * @param $prevItem
     * @returns {*}
     * @private
     */
    _insertDisplayItem: function (itemData, $prevItem) {
      console.log('_insertDisplayItem');

      var type = itemData.type;
      var itemId = itemData.itemId;

      var $displayItem = this.widget().find('.templates .WidgetItem').clone();
      //如果指定了前趋条目就插入其后面，否则插入最前
      if ($prevItem && $prevItem[0]) {
        $prevItem.after($displayItem);
      } else {
        this.$ul.prepend($displayItem);
      }

      this._createDisplayItem($displayItem, type, itemId, itemData);
      return $displayItem;
    },

    /**
     * 创建条目
     * @param type
     * @param data
     * @private
     */
    _createDisplayItem: function ($item, type, itemId, data) {
      console.log('_createDisplayItem');
      var self = this;

      //销毁编辑微件，填充新内容后再remove以防抖动
      if ($item.data('mtm-textWidget')) {
        console.log('destroy');
        $item.textWidget('destroy');
        $item.removeAttr('style');
      } else if ($item.data('mtm-titleWidget')) {
        console.log('destroy');
        $item.titleWidget('destroy');
        $item.removeAttr('style');
      }

      console.log($item);
      //填充新内容，然后删除旧内容，顺序很重要！！！防止抖动
      $item.prepend($('.templates .Item').clone())
        .find('.Item').children().first()
        .after($('.templates .ItemContent.' + type).clone())
        .end().end().end()
        .children().first().next().remove().end().end()
        .end()
        .attr('mtm_type', type)
        .attr('mtm_id', itemId)
        //绑定插入点击响应
        .find('.BtnInsert')
        .click(function () {
          self._createEditWidget(type, {
            from: 'DYNAMIC',
            $prevItem: $item
          });
        })
        .end()
        //绑定删除点击相应
        .find('.BtnDel')
        .click(function () {
          if (!confirm('条目删除后无法找回，您确定要删除吗？')) {
            return;
          }
          $.ajax('/topic/deleteitem', {
            type: 'DELETE',
            data: {
              topicId: topicId,
              type: $item.attr('mtm_type'),
              itemId: $item.attr('mtm_id')
            }
          });
          $item.hide('fast', function () {
            $item.remove();
          });
        })
        .end();

      switch (type) {
        case 'TEXT':
          this.__createTextItem($item, type, itemId, data);
          break;
        case 'TITLE':
          this.__createTitleItem($item, type, itemId, data);
          break;
      }

      //淡入
      $item
        .css('opacity', 0)
        .animate({ 'opacity': 1}, 'fast');
    },

    __createTextItem: function ($li, type, itemId, data) {
      var self = this;
      var text = data.text;
      $li
        //填充文本
        .find('.ItemView.TEXT')
        .html(text.replace(/\n/g, '<br>'))
        .end()
        //绑定修改点击响应
        .find('.BtnEdit')
        .click(function () {
          var text = $li.find('.ItemView.TEXT').html().replace(/<br>/g, '\n');
          self._createEditWidget(type, {
            from: 'EDIT',
            text: text,
            $item: $li
          });
        })
        .end();
    },

    __createTitleItem: function ($li, type, itemId, data) {
      var self = this;
      var title = data.title;
      $li
        //填充文本
        .find('.ItemView.TITLE')
        .html(title)
        .end()
        //绑定修改点击响应
        .find('.BtnEdit')
        .click(function () {
          var title = $li.find('.ItemView.TITLE').html();
          self._createEditWidget(type, {
            from: 'EDIT',
            title: title,
            $item: $li
          });
        })
        .end();
    }

  });

  /**
   * 移动光标到末尾
   * @param textArea
   */
  var moveSelection2End = function (textArea) {
    var length = textArea.value.length;
    if (document.selection) {
      var selection = textArea.createTextRange();
      selection.moveStart('character', length);
      selection.collapse();
      selection.select();
    } else if (typeof textArea.selectionStart == 'number') {
      textArea.selectionStart = textArea.selectionEnd = length;
    }
  }

})(jQuery);