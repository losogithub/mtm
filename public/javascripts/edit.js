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
    $head.find('button[name="publish"]').click(function () {
      $(this).button('loading');
      $('.Top form').submit();
    });
    $head.find('button[name="save"]').click(function () {
      $(this).button('loading');
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
      $(this).find('.BtnToggle').toggleClass('BtnToggleClose');
      $('.EditFormBox02').toggle('fast');
    });

    if (/showOption=true/.test(location.search)) {
      $Button
        .find('.BtnToggle')
        .toggleClass('BtnToggleClose')
        .end()
        .show();
      $('.EditFormBox02').toggle();
    } else {
      $Button.fadeIn('slow');
    }

    var $link = $('.TopicThumbLink');
    var $edit = $('.ThumbEdit');
    var $input = $edit.find('input');
    var $save = $edit.find('button[name="save"]');
    var $cancel = $edit.find('button[name="cancel"]');
    $link.click(function () {
      $edit.toggle('fast');
    });
    $cancel.click(function () {
      $edit.css('visibility', 'hidden')
        .hide('fast', function () {
          $edit.css('visibility', 'visible');
        })
    });
    $save.click(function () {
      $link.find('img').attr('src', $input.val());
      $cancel.click();
    });
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
        opacity: 0.8,
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
          var itemId = data.item.data('id');
          if (!itemId) {
            return;
          }
          //拖动的item放在了editWidget下面，用
          var prevItemType = data.item.prev().data('type');
          if (!prevItemType) {
            prevItemType = data.item.prev().prev().data('type');
          }
          var prevItemId = data.item.prev().data('id');
          if (!prevItemId) {
            prevItemId = data.item.prev().prev().data('id');
          }
          //拖动改变了列表顺序，通知服务器将item插入他前一个item的后面
          // TODO 安全起见topicId由服务器计算
          $.ajax('/topic/sort', {
            type: 'PUT',
            data: {
              topicId: topicId,
              type: data.item.data('type'),
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
      from: ''
    },

    _create: function () {
      console.log('_create');
      var self = this;
      var empty = !this.widget().children().length;

      this.widget()
        .data('type', this.type)
        .prepend($('.Templates .Widget:first').clone())
        .find('.Widget').children().first()
        .after($('.Templates .Widget .' + this.type).clone()).end().end()
        .end()
        //textarea自适应高度
        .find('textarea')
        .css('resize', 'none')
        .autosize({
          append: '\n'
        })
        .end();

      this.__create();

      this.widget()
        //textarea赋值后出发resize事件
        .find('textarea')
        .trigger('autosize.resize')
        .end()
        //自适应高度结束后再删除旧内容，以防抖动
        .children().first().next().remove().end().end()
        .end()
        //监听保存按钮点击事件
        .find('button[name="save"]')
        .click(function () {
          $(this).button('loading');
          self.widget().find('form').submit();
        })
        .end()
        //监听放弃按钮点击事件
        .find('button[name="cancel"]')
        .click(function () {
          self._trigger('cancel');
        })
        .end();

      var animateDone = function () {
        self.widget()
          .find('textarea')
          .addClass('HeightAnimation')
          .end();
      }

      //如果是修改就淡入，否则是新建就淡入加展开
      if (empty) {
        this.widget()
          .hide()
          .css({ 'opacity': 0 })
          .slideDown({
            duration: 'fast',
            queue: false
          })
          .fadeTo(400, 1, animateDone);
      } else {
        this.widget()
          .css({ 'opacity': 0 })
          .fadeTo('fast', 1, animateDone);
      }

      this.autoFocus();

      this.__initFormValidation();
    },

    __create: $.noop,
    __initFormValidation: $.noop,

    stateHandler: function (defaultValue, event) {
      if (event.target.value == defaultValue) {
        this._trigger('setState', null, 'create');
      } else {
        this._trigger('setState', null, 'edit');
      }
    },

    autoFocus: function () {
      var self = this;
      this.widget()
        .scroll(function () {
          self.widget().scrollTop(0);
        })
        .find('.AUTO_FOCUS')
        .focus()
        .end();

      //移动光标到输入框末尾
      moveSelection2End(this.widget().find('.AUTO_FOCUS')[0]);
    },

    /**
     * 不带提示的放弃修改
     */
    remove: function () {
      console.log('remove');
      var self = this;

      this.disable();
      //如果是新建的就删除dom元素，否则是修改就新建条目dom元素
      var itemId = this.widget().data('id');
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
        if (self.options.disabled) {
          return;
        }
        data.$li = self.widget();
        self._trigger('createDisplayItem', null, data);
      }

      //如果是修改则传itemId，否则是新建则传prevId
      var data = this._getCommitData();
      var itemId = this.widget().data('id');
      if (itemId) {
        $.ajax('/topic/edititem', {
          type: 'PUT',
          data: $.extend({
            itemId: itemId,
            type: self.type
          }, data)
        }).done(doneCallback);
      } else {
        var prevItemType = this.widget().prev().data('type');
        var prevItemId = this.widget().prev().data('id');
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

      //填充图片、填充文本
      this.widget()
        .find('img')
        .attr('src', this.options.url)
        .end()
        .find('.WidgetInputBox_Ttl')
        .val(this.options.title)
        .on('input blur mousedown mouseup keydown keypress keyup', this.options.from != 'EDIT' ? $.noop : function (event) {
          self.stateHandler(self.options.title, event);
        })
        .end()
        .find('.WidgetInputBox_Quo')
        .val(this.options.quote)
        .on('input blur mousedown mouseup keydown keypress keyup', this.options.from != 'EDIT' ? $.noop : function (event) {
          self.stateHandler(self.options.quote, event);
        })
        .end()
        .find('.WidgetInputBox_Desc')
        .val(this.options.description)
        .on('input blur mousedown mouseup keydown keypress keyup', this.options.from != 'EDIT' ? $.noop : function (event) {
          self.stateHandler(self.options.description, event);
        })
        .end();
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
              alert(errorMap.title || errorMap.quote || errorMap.description);
            }
            self.widget().find('button[name="save"]').button('reset');
          },
          rules: {
            title: {
              maxlength: 100,
              required: false
            },
            quote: {
              url: true,
              required: false
            },
            description: {
              maxlength: 300,
              required: false
            }
          },
          messages: {
            title: {
              maxlength: '标题太长，请缩写到100字以内。'
            },
            quote: {
              url: 'URL格式错误。'
            },
            description: {
              maxlength: '介绍、评论太长，请缩写到300字以内。'
            }
          }
        });
    },

    /**
     * 子类提交给服务器的数据
     * @private
     */
    _getCommitData: function () {
      var quote = this.widget().find('.WidgetInputBox_Quo').val();
      var urlParts = this.options.url.match(REGEXP_URL);
      return {
        url: this.options.url,
        title: this.widget().find('.WidgetInputBox_Ttl').val(),
        quote: quote
          ? quote : urlParts ? urlParts[2] + '://' + urlParts[3]
          : '',
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
        .find('input')
        .on('input blur mousedown mouseup keydown keypress keyup', function () {
          if (this.value) {
            self.widget().find('.Btn_Check').removeClass('Btn_Check_Disabled').removeAttr('disabled');
          } else {
            self.widget().find('.Btn_Check').addClass('Btn_Check_Disabled').attr('disabled', 'disabled');
          }
        })
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
          self.__getImage(form);
        },
        showErrors: function (errorMap, errorList) {
          if (errorMap.url) {
            alert(errorMap.url);
          }
          self.widget().find('button[name="save"]').button('reset');
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

  });

  /*
   * 定义微件：视频微件
   */
  $.widget('mtm.videoWidget', $.mtm.editWidget, {

    type: 'VIDEO',

    options: {
      url: '',
      title: '',
      description: ''
    },

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;
      var urlParts = this.options.url.match(REGEXP_URL);
      var temp;
      var quote = !urlParts ? null : !urlParts[3] ? null : !(temp = urlParts[3].match(/^[^\.]+\.(([^\.]+)\.([^\.]+\.)*[^\.]+)$/)) ? null : !temp[1] ? null : temp[1];
      var type = temp[2].toUpperCase();
      var vid;
      console.log(this.type);

      switch (type) {
        case 'YOUKU':
          vid = !(temp = this.options.url) ? '' : !(temp = temp.substring(temp.length - 18, temp.length - 5)) ? '' : temp;
          break;
        case 'TUDOU':
          vid = !(temp = this.options.url) ? '#vid#' : !(temp = temp.match(/([^\/]{11})(\/|\.html)$/)) ? '#vid#' : !temp[1] ? '#vid#' : temp[1];
          break;
      }

      //填充视频、填充文本
      this.widget()
        .find('.' + type)
        .attr('src', this.widget().find('.' + type).attr('src').replace('#vid#', vid))
        .removeAttr('style')
        .end()
        .find('.VIDEO_URL')
        .attr('href', this.options.url)
        .end()
        .find('.Quote a')
        .text(quote)
        .end()
        .find('.WidgetInputBox_Ttl')
        .val(this.options.title)
        .on('input blur mousedown mouseup keydown keypress keyup', this.options.from != 'EDIT' ? $.noop : function (event) {
          self.stateHandler(self.options.title, event);
        })
        .end()
        .find('.WidgetInputBox_Desc')
        .val(this.options.description)
        .on('input blur mousedown mouseup keydown keypress keyup', this.options.from != 'EDIT' ? $.noop : function (event) {
          self.stateHandler(self.options.description, event);
        })
        .end();
    },

    /**
     * 子类的表单验证
     * @private
     */
    __initFormValidation: function () {
      var self = this;
      this.widget().find('form')
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
              alert(errorMap.title || errorMap.description);
            }
            self.widget().find('button[name="save"]').button('reset');
          },
          rules: {
            title: {
              maxlength: 100,
              required: false
            },
            description: {
              maxlength: 300,
              required: false
            }
          },
          messages: {
            title: {
              maxlength: '标题太长，请缩写到100字以内。'
            },
            description: {
              maxlength: '介绍、评论太长，请缩写到300字以内。'
            }
          }
        });
    },

    /**
     * 子类提交给服务器的数据
     * @private
     */
    _getCommitData: function () {
      return {
        url: this.options.url,
        title: this.widget().find('.WidgetInputBox_Ttl').val(),
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
        description: this.options.description
      }
    }

  });

  /*
   * 定义微件：视频创建微件
   */
  $.widget('mtm.videoWidgetCreate', $.mtm.editWidget, {

    type: 'VIDEO_CREATE',

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      //监听文本改变事件
      this.widget()
        .find('input')
        .on('input blur mousedown mouseup keydown keypress keyup', function () {
          if (this.value) {
            self.widget().find('.Btn_Check').removeClass('Btn_Check_Disabled').removeAttr('disabled');
          } else {
            self.widget().find('.Btn_Check').addClass('Btn_Check_Disabled').attr('disabled', 'disabled');
          }
        })
        .end();
    },

    /**
     * 子类的表单验证
     * @private
     */
    __initFormValidation: function () {
      var self = this;
      this.widget().find('form')
        .validate({
          debug: false,
          ignore: "",
          onkeyup: false,
          focusInvalid: false,
          onfocusout: false,
          submitHandler: function (form) {
            self.__getVideo(form);
          },
          showErrors: function (errorMap, errorList) {
            if (errorMap.url) {
              alert(errorMap.url);
            }
            self.widget().find('button[name="save"]').button('reset');
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

    __getVideo: function (form) {
      var self = this;
      var url = $(form).find('input:text').val();

      var callback = function (data) {
        if (self.options.disabled) {
          return;
        }
        self.destroy();
        self._trigger('createEditWidget', null, {
          from: self.options.from,
          type: 'VIDEO',
          $item: self.widget(),
          url: url,
          title: data.title
        });
        self._trigger("setState", null, "edit");
      };
      $.getJSON('/topic/video_title', { url: url }, callback);
    }

  });

  /*
   * 定义微件：引用微件
   */
  $.widget('mtm.citeWidget', $.mtm.editWidget, {

    type: 'CITE',

    options: {
      //初始值
      cite: '',
      url: '',
      title: '',
      description: ''
    },

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      //填充文本
      this.widget()
        .find('.WidgetInputBox_Cite')
        .val(this.options.cite)
        .on('input blur mousedown mouseup keydown keypress keyup', function (event) {
          self.stateHandler(self.options.cite, event);
        })
        .end()
        .find('.WidgetInputBox_Url')
        .val(this.options.url)
        .on('input blur mousedown mouseup keydown keypress keyup', function (event) {
          self.stateHandler(self.options.url, event);
        })
        .end()
        .find('.WidgetInputBox_Ttl')
        .val(this.options.title)
        .on('input blur mousedown mouseup keydown keypress keyup', function (event) {
          self.stateHandler(self.options.title, event);
        })
        .end()
        .find('.WidgetInputBox_Desc')
        .val(this.options.description)
        .on('input blur mousedown mouseup keydown keypress keyup', function (event) {
          self.stateHandler(self.options.description, event);
        })
        .end();
    },

    /**
     * 子类的表单验证
     * @private
     */
    __initFormValidation: function () {
      var self = this;
      this.widget().find('form')
        .submit(function () {
          var $url = self.widget().find('.WidgetInputBox_Url');
          var url = $url.val();
          var urlParts = url.match(REGEXP_URL_NO_PROTOCOL);
          if (urlParts && urlParts[3] && !urlParts[2]) {
            $url.val('http://' + url);
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
              alert(errorMap.cite || errorMap.url || errorMap.title || errorMap.description);
            }
            self.widget().find('button[name="save"]').button('reset');
          },
          rules: {
            cite: {
              required: true,
              maxlength: 500
            },
            url: {
              required: false,
              url: true
            },
            title: {
              required: false,
              maxlength: 100
            },
            description: {
              required: false,
              maxlength: 300
            }
          },
          messages: {
            cite: {
              required: "尚未输入引文。",
              maxlength: "引文太长，请缩写到500字以内。"
            },
            url: {
              url: 'URL格式错误。'
            },
            title: {
              maxlength: "网页标题太长，请缩写到100字以内。"
            },
            description: {
              maxlength: "介绍、评论太长，请缩写到300字以内。"
            }
          }
        });
    },

    /**
     * 子类提交给服务器的数据
     * @private
     */
    _getCommitData: function () {
      return {
        cite: this.widget().find('.WidgetInputBox_Cite').val(),
        url: this.widget().find('.WidgetInputBox_Url').val(),
        title: this.widget().find('.WidgetInputBox_Ttl').val(),
        description: this.widget().find('.WidgetInputBox_Desc').val()
      }
    },

    /**
     * 子类的原始数据
     * @private
     */
    _getOriginalData: function () {
      return {
        cite: this.options.cite,
        url: this.options.url,
        title: this.options.title,
        description: this.options.description
      }
    }

  });

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

      //填充文本、监听文本改变事件
      this.widget()
        .find('textarea')
        .val(this.options.text)
        .on('input blur mousedown mouseup keydown keypress keyup', function (event) {
          self.stateHandler(self.options.text, event);
        })
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
          self.widget().find('button[name="save"]').button('reset');
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
      return { text: this.widget().find('textarea').val() }
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
        .find('input')
        .val(this.options.title)
        .on('input blur mousedown mouseup keydown keypress keyup', function (event) {
          self.stateHandler(self.options.title, event);
        })
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
          self.widget().find('button[name="save"]').button('reset');
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
      return { title: this.widget().find('input').val() }
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
      var coverUrl = this.options.topicData.coverUrl;
      var description = this.options.topicData.description;
      if (title) {
        $form.find('.InputBoxTitle').val(title ? title : '');
        $form.find('.TopicThumbLink img').attr('src', coverUrl ? coverUrl : '');
        $form.find('.InputBoxDesc').val(description ? description : '');
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
          self.widget().find('button[name="publish"]').button('reset');
          self.widget().find('button[name="save"]').button('reset');
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
          coverUrl: this.widget().find('.Top .TopicThumbLink img').attr('src'),
          description: this.widget().find('.Top .InputBoxDesc').val()
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
      this.widget().delegate('.StaticMenu li>a', 'click', function (event) {
        self._createEditWidget($(event.target).data('type'), {
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
        self.__initItemListener($(li), $(li).data('type'));
      });
      var prevItem;
      this.options.itemsData.forEach(function (itemData) {
        prevItem = self._insertDisplayItem(itemData, prevItem);
      });
    },

    __initItemListener: function ($li, type) {
      console.log('__initItemListener');
      var self = this;
      //绑定插入点击响应
      $li
        .find('.INSERT')
        .click(function () {
          self._createEditWidget('MENU', {
            from: 'INSERT',
            $prevItem: $li
          });
        })
        .end()
        //绑定删除点击响应
        .find('.DELETE')
        .click(function () {
          if (!confirm('条目删除后无法找回，您确定要删除吗？')) {
            return;
          }
          $.ajax('/topic/deleteitem', {
            type: 'DELETE',
            data: {
              topicId: topicId,
              type: $li.data('type'),
              itemId: $li.data('id')
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
            .find('.EDIT')
            .click(function () {
              var url = $li.find('img').attr('src');
              var title = $li.find('.Text a').text();
              var quote = $li.find('.Quote a').attr('href');
              var description = $('<div/>').html($li.find('.Text p').html().replace(/<br>/g, '\n')).text();
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
        case 'VIDEO':
          //绑定修改点击响应
          console.log('VIDEO');
          $li
            .find('.EDIT')
            .click(function () {
              var url = $li.find('.Quote a').attr('href');
              var title = $li.find('.Text a').text();
              var description = $('<div/>').html($li.find('.Text p').html().replace(/<br>/g, '\n')).text();
              self._createEditWidget(type, {
                from: 'EDIT',
                url: url,
                title: title,
                description: description,
                $item: $li
              });
            })
            .end();
          break;
        case 'CITE':
          //绑定修改点击响应
          $li
            .find('.EDIT')
            .click(function () {
              var cite = $('<div/>').html($li.find('.Cite q').html().replace(/<br>/g, '\n')).text();
              var url = $li.find('.Quote a').attr('href');
              var title = $li.find('.Quote a').text();
              var description = $('<div/>').html($li.find('.Description').html().replace(/<br>/g, '\n')).text();
              self._createEditWidget(type, {
                from: 'EDIT',
                cite: cite,
                url: url,
                title: title,
                description: description,
                $item: $li
              });
            })
            .end();
          break;
        case 'TEXT':
          //绑定修改点击响应
          $li
            .find('.EDIT')
            .click(function () {
              var text = $('<div/>').html($li.find('p').html().replace(/<br>/g, '\n')).text();
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
            .find('.EDIT')
            .click(function () {
              var title = $li.find('p').text();
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
        console.log($editingWidget.data('type'));
        if (($editingWidget.data('type') == type
          || $editingWidget.data('type') + '_CREATE' == type)
          && self.from == from
          && (from == 'STATIC'
          || from == 'DYNAMIC' && self.$editingPrevItem.is($prevItem))) {
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
            if (!$editingWidget.is($item)) {
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
            .data('type', type)
            .insertAfter($prevItem)
            .prepend(self.widget().find('.Templates .DynamicMenu').clone())
            .delegate('li>a', 'click', function (event) {
              self._createEditWidget($(event.target).data('type'), {
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
        case 'VIDEO_CREATE':
          console.log('_createEditWidget VIDEO_CREATE');
          $editWidget.videoWidgetCreate(options);
          this.callWidgetMethod = $editWidget.videoWidgetCreate;
          break;
        case 'VIDEO':
          console.log('_createEditWidget VIDEO');
          $editWidget.videoWidget(options);
          this.callWidgetMethod = $editWidget.videoWidget;
          break;
        case 'CITE':
          console.log('_createEditWidget CITE');
          $editWidget.citeWidget(options);
          this.callWidgetMethod = $editWidget.citeWidget;
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
      this.state = 'create';
      this.from = from;
      this.$editingWidget = $editWidget;
      this.$editingPrevItem = $prevItem;
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
      $item.prepend($('.Templates .Item:first').clone())
        .find('.Item').children().first()
        .after($('.Templates .Item .' + type).clone()).end().end()
        .end()
        .children().first().next().remove().end().end()
        .end()
        .data('type', type)
        .data('id', itemId);

      switch (type) {
        case 'IMAGE':
          //填充图片信息
          var url = data.url;
          var title = data.title;
          var quote = data.quote;
          var description = data.description;
          var urlParts = quote.match(REGEXP_URL);
          $item
            .find('.IMAGE_LINK')
            .attr('href', url)
            .end()
            .find('img')
            .attr('src', url)
            .end()
            .find('.Text a')
            .text(title)
            .end()
            .find('.Quote a')
            .attr('href', quote)
            .text(urlParts ? urlParts[3] : '')
            .end()
            .find('.Text p')
            .html($('<div/>').text(description).html().replace(/\n/g, '<br>'))
            .end();
          break;
        case 'VIDEO':
          //填充图片信息
          var url = data.url;
          var title = data.title;
          var description = data.description;
          var urlParts = url.match(REGEXP_URL);
          var temp;
          var quote = !urlParts ? null : !urlParts[3] ? null : !(temp = urlParts[3].match(/^[^\.]+\.(([^\.]+)\.([^\.]+\.)*[^\.]+)$/)) ? null : !temp[1] ? null : temp[1];
          var videoType = temp[2].toUpperCase();
          var vid;

          switch (videoType) {
            case 'YOUKU':
              vid = !(temp = url) ? '' : !(temp = temp.substring(temp.length - 18, temp.length - 5)) ? '' : temp;
              break;
            case 'TUDOU':
              vid = !(temp = url) ? '#vid#' : !(temp = temp.match(/([^\/]{11})(\/|\.html)$/)) ? '#vid#' : !temp[1] ? '#vid#' : temp[1];
              break;
          }

          $item
            .find('.' + videoType)
            .attr('src', $item.find('.' + videoType).attr('src').replace('#vid#', vid))
            .removeAttr('style')
            .end()
            .find('.VIDEO_URL')
            .attr('href', url)
            .end()
            .find('.Quote a')
            .text(quote)
            .end()
            .find('.Text a')
            .text(title)
            .end()
            .find('.Text p')
            .html($('<div/>').text(description).html().replace(/\n/g, '<br>'))
            .end();
          if (!title) {
            $item.find('.Text a').hide();
          }
          if (!description) {
            $item.find('.Text p').hide();
          }
          break;
        case 'CITE':
          //填充引用信息
          var cite = data.cite;
          var url = data.url;
          var title = data.title;
          var description = data.description;
          $item
            .find('.Cite q')
            .html($('<div/>').text(cite).html().replace(/\n/g, '<br>'))
            .end()
            .find('.Quote a')
            .text(title || url)
            .end()
            .find('.Quote a')
            .attr('href', url)
            .end()
            .find('.Description')
            .html($('<div/>').text(description).html().replace(/\n/g, '<br>'))
            .end();
          if (!title && !url) {
            $item.find('.Quote').hide();
          }
          if (!description) {
            $item.find('.Description').hide();
          }
          break;
        case 'TEXT':
          //填充文本
          var text = data.text;
          $item
            .find('p')
            .html($('<div/>').text(text).html().replace(/\n/g, '<br>'))
            .end();
          break;
        case 'TITLE':
          //填充标题
          var title = data.title;
          $item
            .find('p')
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