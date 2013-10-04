/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/3/13
 * Time: 11:26 PM
 * To change this template use File | Settings | File Templates.
 */

(function ($) {

  var console = window.console || {log: $.noop, error: $.noop};
  var REGEXP_URL = /^((http[s]?|ftp):\/)?\/?((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]))(:([^\/]*))?(((\/\w+)*\/)([\w\-\.]+[^#?\s]+))?(\?([^#]*))?(#(.*))?$/;
  var REGEXP_URL_NO_PROTOCOL = /^((http[s]?|ftp):\/)?\/?((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]))(:([^\/]*))?(((\/\w+)*\/)([\w\-\.]+[^#?\s]+))?(\?([^#]*))?(#(.*))?$/;
  //数据库中该总结id
  var topicId = 0;
  //
  var mode = 'create';

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
    $head.find('.Btn_Publish').click(function () {
      $('.Top form').submit();
    });
    $head.find('.Btn_HeadSave').click(function () {
      $('.Top form').submit();
    });
  }

  /**
   * 监听可选项目点击事件
   */
  var __initOption = function () {
    var $Button = $('.EditFormOption');

    //开关可选项目的动画
    $Button.click(function () {
      $(this).toggleClass('ButtonToggleClose ButtonToggleOpen');
      $('.EditFormBox02').toggle('fast');
    });

    if (/showOption=true/.test(location.search)) {
      $Button.toggleClass('ButtonToggleClose ButtonToggleOpen').show();
      $('.EditFormBox02').toggle();
    } else {
      $Button.fadeIn('slow');
    }
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
        handle: '.MoveHandle',
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
  };

  /*
   * 定义微件：编辑widget的base对象
   */
  $.widget('mtm.editWidget', {

    options: {
    },

    _create: function () {
      console.log('_create');
      var self = this;
      var empty = !this.widget().children().length;

      this.widget()
        .attr('mtm_type', this.type)
        .prepend($('.Templates .Widget').clone())
        .find('.Widget').children().first()
        .after($('.Templates .WidgetContent.' + this.type).clone())
        .end().end().end();

      this.__create();

      this.widget()
        //自适应高度结束后再删除旧内容，以防抖动
        .children().first().next().remove().end().end()
        .end()
        //监听保存按钮点击事件
        .find('.Btn_Save')
        .click(function () {
          self.widget().find('form').submit();
        })
        .end()
        //监听放弃按钮点击事件
        .find('.Btn_Cancel')
        .click(function () {
          self._trigger('cancel');
        })
        .end();

      //如果是修改就淡入，否则是新建就淡入加展开
      if (empty) {
        this.widget()
          .hide()
          .css({ 'opacity': 0 })
          .slideDown({
            duration: 'fast',
            queue: false
          })
          .fadeTo(400, 1);
      } else {
        this.widget()
          .css({ 'opacity': 0 })
          .fadeTo('fast', 1, function () {
            self.__animateDone();
          });
      }

      this.autoFocus();

      this.__initFormValidation();
    },

    __create: $.noop,
    __animateDone: $.noop,
    __initFormValidation: $.noop,

    autoFocus: function () {
      var self = this;
      this.widget()
        .scroll(function () {
          self.widget().scrollTop(0);
        })
        .find('.AutoFocus')
        .focus()
        .end();
    },

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

      //ajax完成后将微件改为条目
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
   * 定义微件：图片编辑微件
   */
  $.widget('mtm.imageWidget', $.mtm.editWidget, {

    type: 'IMAGE',

    options: {
      url: '',
      title: '',
      quote: '',
      description: ''
    },

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      //填充图片、textarea自适应高度、填充文本
      var urlParts = this.options.url.match(REGEXP_URL);
      this.widget()
        .find('.WidgetItemThumb')
        .attr('src', this.options.url)
        .end()
        .find('.WidgetInputBox_Desc')
        .autosize({
          append: '\n'
        })
        .val(this.options.description)
        .trigger('autosize.resize')
        .end()
        .find('.WidgetInputBox_Ttl')
        .val(this.options.title)
        .end()
        .find('.WidgetInputBox_Quo')
        .val(this.options.quote ? this.options.quote : urlParts ? urlParts[2] + '://' + urlParts[3] : 'http://')
        .end();

      //移动光标到输入框末尾
      moveSelection2End(this.widget().find('.WidgetInputBox_Desc')[0]);
    },

    __animateDone: function () {
      this.widget()
        .find('.WidgetInputBox_Desc')
        .addClass('HeightAnimation');
    },

    /**
     * 子类的表单验证
     * @private
     */
    __initFormValidation: function () {
      var self = this;
      this.widget().find('form')
        .submit(function () {
          var $quote = self.widget().find('.WidgetInputBox_Quo');
          var quote = $quote.val();
          console.log('quote=' + quote);
          var urlParts = quote.match(REGEXP_URL_NO_PROTOCOL);
          console.log('urlParts[2]=' + urlParts[2]);
          if (urlParts && urlParts[3] && !urlParts[2]) {
            $quote.val('http://' + quote);
          }
        })
        .validate({
        debug: false,
        ignore: "",
        onkeyup: false,
        focusInvalid: false,
        onfocusout: false,
        submitHandler: function (form) {
          self.commit();
        },
        showErrors: function (errorMap, errorList) {
          if (errorList.length) {
            alert(errorMap.title || errorMap.description || errorMap.quote);
          }
        },
        rules: {
          title: {
            maxlength: 100,
            required: false
          },
          quote: {
            required: true,
            url: true
          },
          description: {
            maxlength: 300,
            required: false
          }
        },
        messages: {
          title: {
            maxlength: '图片标题太长，请缩写到100字以内。'
          },
          quote: {
            required: '尚未输入图片来源网页URL。',
            url: '图片来源网页URL格式错误。'
          },
          description: {
            maxlength: '图片简介、评论太长，请缩写到300字以内。'
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
      return {
        url: this.options.url,
        title: this.widget().find('.WidgetInputBox_Ttl').val(),
        quote: this.widget().find('.WidgetInputBox_Quo').val(),
        description: this.widget().find('.WidgetInputBox_Desc').val()
      }
    },

    /**
     * 子类的原始数据
     * @private
     */
    _getOriginalData: function () {
      return {
        url: this.options.url,
        title: this.options.title,
        quote: this.options.quote,
        description: this.options.description
      }
    }

  });

  /*
   * 定义微件：图片创建微件
   */
  $.widget('mtm.imageWidgetCreate', $.mtm.editWidget, {

    type: 'IMAGE_CREATE',

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      //监听文本改变事件
      this.widget()
        .find('.WidgetInputBox')
        .on('input blur mousedown mouseup keydown keypress keyup', function () {
          if (this.value) {
            self.widget().find('.Btn_Check').removeClass('Btn_Check_Disabled').removeAttr('disabled');
          } else {
            self.widget().find('.Btn_Check').addClass('Btn_Check_Disabled').attr('disabled', 'disabled');
          }
        })
        .end();

      //移动光标到输入框末尾
      moveSelection2End(this.widget().find('.WidgetInputBox')[0]);
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
          self.__getImage(form);
        },
        showErrors: function (errorMap, errorList) {
          if (errorMap.url) {
            alert(errorMap.url);
          }
        },
        rules: {
          url: {
            required: true,
            url: true
          }
        },
        messages: {
          url: {
            required: "尚未输入URL。",
            url: "URL格式错误。"
          }
        }
      });
    },

    __getImage: function (form) {
      var self = this;
      var url = $(form).find('input:text').val();
      var callback = function () {
        self.destroy();
        self._trigger('createEditWidget', null, {
          from: self.options.from,
          type: 'IMAGE',
          $item: self.widget(),
          url: url
        });
        self._trigger("setState", null, "edit");
      };
//      checkDupl(oData, callback);
      callback();
    }

  })

  /*
   * 定义微件：文本编辑微件
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
        .end();

      //移动光标到输入框末尾
      moveSelection2End(this.widget().find('.WidgetInputBox')[0]);
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
            maxlength: "文本太长，请缩写到2000字以内。"
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
        .end();

      //移动光标到输入框末尾
      moveSelection2End(this.widget().find('.WidgetInputBox')[0]);
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
            maxlength: "标题太长，请缩写到100字以内。"
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
      //初始化时需要的总结信息
      topicData: {},
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
      var self = this;
      var $form = this.widget().find('.Top form');

      var title = this.options.topicData.title;
      var desc = this.options.topicData.desc;
      if (title) {
        $form.find('.InputBoxTitle').val(title);
        $form.find('.InputBoxDesc').val(desc);
      }

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
            minlength: "总结标题太短，请控制在5～50字之间。",
            maxlength: "总结标题太长，请控制在5～50字之间。"
          },
          description: {
            maxlength: "总结描述太长，请缩写到150字以内。"
          }
        }
      });
    },

    commit: function () {
      console.log('commit-topic/publish');
      $.ajax('/topic/publish', {
        type: 'PUT',
        data: {
          topicId: topicId,
          title: this.widget().find('.Top .InputBoxTitle').val(),
          desc: this.widget().find('.Top .InputBoxDesc').val()
        }
      })
        .done(function () {
          window.location = '/topic/' + topicId;
        });
    },

    /**
     * 初始化条目创建菜单的点击响应
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
      this.widget().find('.WidgetItemList li').each(function (i, li) {
        self.__initItemListener($(li), $(li).attr('mtm_type'));
      });
      var prevItem;
      this.options.itemsData.forEach(function (itemData) {
        prevItem = self._insertDisplayItem(itemData, prevItem);
      });
    },

    __initItemListener: function ($li, type) {
      var self = this;
      //绑定插入点击响应
      $li
        .find('.Btn_Insert')
        .click(function () {
          self._createEditWidget('MENU', {
            from: 'INSERT',
            $prevItem: $li
          });
        })
        .end()
        //绑定删除点击响应
        .find('.Btn_Del')
        .click(function () {
          if (!confirm('条目删除后无法找回，您确定要删除吗？')) {
            return;
          }
          $.ajax('/topic/deleteitem', {
            type: 'DELETE',
            data: {
              topicId: topicId,
              type: $li.attr('mtm_type'),
              itemId: $li.attr('mtm_id')
            }
          });
          $li.css('visibility', 'hidden');
          $li.hide('fast', function () {
            $li.remove();
          });
        })
        .end();

      switch (type) {
        case 'IMAGE':
          //绑定修改点击响应
          $li
            .find('.Btn_Edit')
            .click(function () {
              var url = $li.find('.IMAGE .WidgetItemThumb').attr('src');
              var title = $li.find('.ItemTtl').text();
              var quote = $li.find('.ItemQuote').attr('href');
              var description = $('<div/>').html($li.find('.ItemDesc').html().replace(/<br>/g, '\n')).text();
              self._createEditWidget(type, {
                from: 'EDIT',
                url: url,
                title: title,
                quote: quote,
                description: description,
                $item: $li
              });
            })
            .end();
          break;
        case 'TEXT':
          //绑定修改点击响应
          $li
            .find('.Btn_Edit')
            .click(function () {
              var text = $('<div/>').html($li.find('.ItemView').html().replace(/<br>/g, '\n')).text();
              self._createEditWidget(type, {
                from: 'EDIT',
                text: text,
                $item: $li
              });
            })
            .end();
          break;
        case 'TITLE':
          //绑定修改点击响应
          $li
            .find('.Btn_Edit')
            .click(function () {
              var title = $li.find('.ItemView').text();
              self._createEditWidget(type, {
                from: 'EDIT',
                title: title,
                $item: $li
              });
            })
            .end();
          break;
      }
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
         * 编辑微件通知编辑页面创建微件的回调事件
         * @param event
         * @param data
         */
        createEditWidget: function (event, data) {
          self._createEditWidget(data.type, data);
        },

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

      var removeDynamicMenu = function ($li) {
        self.state = 'default';
        $li.css('visibility', 'hidden')
          .hide('fast', function () {
            $(this).remove();
          });
      }

      //编辑页面不在默认状态
      if (self.state != 'default') {
        console.log('self.state != default');

        //编辑中的微件和目标微件:类型相同、来源相同，只需给输入框焦点
        var $editingWidget = self.$editingWidget;
        if (($editingWidget.attr('mtm_type') == type
          || $editingWidget.attr('mtm_type') + '_CREATE' == type)
          && self.from == from
          && (from == 'STATIC'
          || from == 'DYNAMIC' && self.$editingPrevItem == $prevItem)) {
          console.log('重置焦点');

          if (this.callWidgetMethod) {
            this.callWidgetMethod.call($editingWidget, 'autoFocus');
          }
          //todo 优化：是否要移动光标？
          return;
        }

        //编辑中的微件处在已修改状态
        if (this.state == 'edit'
          && !confirm('您有正在编辑的内容，确定要放弃然后添加其他类型的条目吗？')) {
          return;
        }

        //删除编辑中的微件
        if (from != 'DYNAMIC') {
          if (this.callWidgetMethod) {
            if ($editingWidget.attr('mtm_type') != type + '_CREATE') {
              this.callWidgetMethod.call($editingWidget, 'remove');
            }
          } else {
            removeDynamicMenu(this.$editingWidget);
          }
        }
      }

      //如果是修改就用原条目新建微件，否则是插入就复制新的li元素
      if ($item) {
        var $editWidget = $item;
      } else {
        var $editWidget = this.widget().find('.Templates .LiWrapper li').clone();
        //如果是动态插入就插入前趋条目的后面，否则是静态插入就插入最前面
        if ($prevItem) {
          $prevItem.after($editWidget);
        } else {
          this.$ul.prepend($editWidget);
        }
      }

      //根据类型选择微件，并保存调用微件方法的函数
      switch (type) {
        case 'MENU':
          console.log('_createEditWidget MENU');
          $editWidget
            .attr('mtm_type', type)
            .insertAfter($prevItem)
            .prepend(self.widget().find('.Templates .DynamicMenu').clone())
            .delegate('.DynamicMenuBtn', 'click', function (event) {
              self._createEditWidget($(event.target).attr('mtm_type'), {
                from: 'DYNAMIC',
                $item: $editWidget
              });
            })
            .find('.Btn_Close')
            .click(function () {
              removeDynamicMenu($editWidget);
            })
            .end()
            .hide().show('fast');
          this.callWidgetMethod = null;
          break;
        case 'IMAGE_CREATE':
          console.log('_createEditWidget IMAGE_CREATE');
          $editWidget.imageWidgetCreate(options);
          this.callWidgetMethod = $editWidget.imageWidgetCreate;
          break;
        case 'IMAGE':
          console.log('_createEditWidget IMAGE');
          $editWidget.imageWidget(options);
          this.callWidgetMethod = $editWidget.imageWidget;
          break;
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
          return;
      }

      console.log('create');
      self.state = 'create';
      self.from = from;
      self.$editingWidget = $editWidget;
      self.$editingPrevItem = $prevItem;
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

      var $displayItem = this.widget().find('.Templates .LiWrapper li').clone();
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
      if (this.callWidgetMethod) {
        this.callWidgetMethod.call($item, 'destroy');
      }

      //填充新内容，然后删除旧内容，顺序很重要！！！防止抖动
      $item.prepend($('.Templates .Item').clone())
        .find('.Item').children().first()
        .after($('.Templates .ItemContent.' + type).clone())
        .end().end().end()
        .children().first().next().remove().end().end()
        .end()
        .attr('mtm_type', type)
        .attr('mtm_id', itemId);

      switch (type) {
        case 'IMAGE':
          //填充图片信息
          var url = data.url;
          var title = data.title;
          var quote = data.quote;
          var description = data.description;
          var urlParts = quote.match(REGEXP_URL);
          $item
            .find('.ImageLink')
            .attr('href', url)
            .end()
            .find('.WidgetItemThumb')
            .attr('src', url)
            .end()
            .find('.ItemTtl')
            .text(title)
            .end()
            .find('.ItemQuote')
            .attr('href', quote)
            .text(urlParts ? urlParts[3] : '')
            .end()
            .find('.ItemDesc')
            .html($('<div/>').text(description).html().replace(/\n/g, '<br>'))
            .end();
          break;
        case 'TEXT':
          //填充文本
          var text = data.text;
          $item
            .find('.ItemView')
            .html($('<div/>').text(text).html().replace(/\n/g, '<br>'))
            .end();
          break;
        case 'TITLE':
          //填充标题
          var title = data.title;
          $item
            .find('.ItemView')
            .text(title)
            .end();
          break;
      }

      this.__initItemListener($item, type);

      //淡入
      $item
        .css('opacity', 0)
        .animate({ 'opacity': 1}, 'fast');
    }

  });

  /**
   * main function
   * @param data
   */
  var _doIfGetIdDone = function (data) {
    console.log('doIfGetIdDone');

    if (data.redirect) {
      window.location.replace(data.redirect);
      if (typeof window.history.pushState == "function") {
        window.history.replaceState({}, document.title, window.location.href);
      }
    }

    if (data.topicId) {
      topicId = data.topicId;
      window.location.replace(window.location.pathname + "#" + topicId);
      if (typeof window.history.pushState == "function") {
        window.history.replaceState({}, document.title, window.location.href);
      }
    }

    $(function ($) {
      __initHead();
      __initOption();
      __initSort();
      $(document).editPage({
        topicData: data.topicData,
        itemsData: data.itemsData
      });
    });
  };

  /**
   * 入口函数，必须要从服务器验证或获取topicId才能编辑总结
   */
  (function getTopicId() {
    console.log('getTopicId');

    if (location.pathname == '/topic/create') {
      console.log('/topic/create');
      mode = 'create';

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
    } else {
      topicId = location.pathname.match(/^\/topic\/([0-9a-f]{24})\/edit$/)[1];
      console.log('topicId=' + topicId);
      _doIfGetIdDone({});
    }
  })();

  /**
   * 移动光标到末尾
   * @param textArea
   */
  var moveSelection2End = function (textArea) {
    if (!textArea) {
      return;
    }

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