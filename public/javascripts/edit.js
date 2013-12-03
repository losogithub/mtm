/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/3/13
 * Time: 11:26 PM
 * To change this template use File | Settings | File Templates.
 */

(function ($) {

  var console = window.console || {log: $.noop, error: $.noop};

  var INPUT_EVENTS = 'input blur mousedown mouseup keydown keypress keyup';

  function fillVideo($li, url, vid) {
    var quote = shizier.utils.getVideoQuote(url);
    var temp;
    var videoType = !quote ? null : !(temp = quote.match(/([^\.]+)\./)) ? null : !temp[1] ? null : temp[1].toUpperCase();

    //填充视频
    if (vid) {
      $li
        .find('.' + videoType)
        .attr('src', !(temp = $li.find('.' + videoType).attr('src')) ? '' : temp.replace('#vid#', vid))
        .attr('flashvars', !(temp = $li.find('.' + videoType).attr('flashvars')) ? '' : temp.replace('#vid#', vid))
        .css('display', 'block')
        .end()
        .find('.Thumb')
        .hide()
        .end();
    }

    $li
      .find('.Quote a')
      .text(quote ? quote : url)
      .end();
  }

  $.fn.extend({
    fadeSlideDown: function (callback) {
      return this
        .hide()
        .css({ 'opacity': 0 })
        .animate({
          opacity: 0.5,
          height: 'toggle'
        }, 100)
        .fadeTo(100, 1, callback);
    },

    hiddenSlideUp: function (callback) {
      return this
        .css('visibility', 'hidden')
        .slideUp(100, function () {
          $(this).css('visibility', 'visible');
          if ($.isFunction(callback)) {
            callback.call(this);
          }
        });
    }
  });

  function updateList($li) {
    //拖动的item是editWidget，不用重排
    var itemId = $li.data('id');
    if (!itemId) {
      return;
    }
    //拖动的item放在了editWidget下面，用
    var prevItem = $li.prev();
    var prevItemType = prevItem.data('type');
    var prevItemId = prevItem.data('id');
    if (!prevItemId) {
      prevItemType = prevItem.prev().data('type');
      prevItemId = prevItem.prev().data('id');
    }
    //拖动改变了列表顺序，通知服务器将item插入他前一个item的后面
    $.ajax('/topic/sort', {
      type: 'PUT',
      data: {
        topicId: topicId,
        type: $li.data('type'),
        itemId: itemId,
        prevItemType: prevItemType,
        prevItemId: prevItemId
      }
    })
      .done(function () {
        savedOnce = true;
      })
      .fail(notifyFail);
  }

  /**
   * 移动光标到末尾
   * @param textArea
   */
  function moveSelection2End(textArea) {
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

  /*
   * 定义微件：编辑widget的base对象
   */
  $.widget('shizier.editWidget', {

    type: undefined,
    xhr: undefined,

    options: {
      id: undefined
    },

    _create: function () {
      console.log('_create');
      var self = this;

      this.widget()
        .addClass(this.type)
        .data('type', this.type)
        .data('id', this.options.id)
        //防止slideDown动画期间获取焦点时的滚动
        .scroll(function () {
          self.widget().scrollTop(0);
        })
        .find('>div')
        .prepend($templates.find('.Widget:first').clone())
        .end()
        .find('.Widget')
        .prepend($templates.find('.Widget .' + this.type).clone())
        .end()
        //更改保存按钮类型以实现回车提交表单的功能
        .find('button[name="save"]')
        .attr('type', 'submit')
        .end()
        //textarea自适应高度
        .find('textarea')
        .css('resize', 'none')
        .autosize({
          append: '\n'
        })
        .end()
        .find('form')
        .submit(function () {
          var $url = self.widget().find('input[name="url"], input.Url');
          if (!$url.length) {
            return;
          }
          var url = $url.val();
          if (url) {
            url = url.trim().replace('。', '.');
          }
          if (url && !shizier.utils.REGEXP_PROTOCOL.test(url)) {
            url = 'http://' + url;
          }
          $url.val(url);
        })
        .end();

      this.__create();

      this.widget()
        //textarea赋值后触发resize事件
        .find('textarea')
        .trigger('autosize.resize')
        .end()
        .fadeSlideDown();

      this.autoFocus();//！！！必须在resize后面设置焦点，因为获取焦点后输入框具有了高度动画属性，否则会导致抖动！！！

      this.__initFormValidation();
    },

    __create: $.noop,
    __initFormValidation: $.noop,

    stateHandler: function (defaultValue, event) {
      if (this.options.disabled) {
        return;
      }
      if (event.target.value == defaultValue) {
        setState('create');
      } else {
        setState('edit');
      }
    },

    autoFocus: function () {
      this.widget()
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

      if (this.xhr) {
        console.log('abort');
        this.xhr.abort();
      }
      this.disable();
      //如果是新建的就删除dom元素，否则是修改就新建条目dom元素
      var id = this.widget().data('id');
      this.widget().hiddenSlideUp(function () {
        $(this).remove();
      });
      if (id) {
        var data = $.extend({
          $li: this.widget(),
          itemId: id,
          type: this.type
        }, this._getOriginalData());
        createItem(this.widget().prev(), this.type, id, data);
      }
      setState('default');
    },

    _getOriginalData: $.noop,

    /**
     * 保存修改验证表格通过后的发送新文本到服务器
     */
    commit: function () {
      var self = this;
      if (this.widget().find('form').data('submitType') == 'preview') {
        this.widget().find('button[name="preview"]').button('loading');
        this.xhr = this.preview();
      } else {
        this.widget().find('button[name="save"]').button('loading');
        this.widget().find('button[name="preview"]')
          .button('reset');
        setTimeout(function () {
          self.widget().find('button[name="preview"]')
            .addClass('disabled')
            .attr('disabled', 'disabled');
        }, 0);
        this.xhr = this.save();
      }
    },

    save: function () {
      var self = this;
      //ajax完成后将微件改为条目
      var doneCallback = function (data) {
        if (self.options.disabled) {
          return;
        }
        savedOnce = true;
        self.disable();
        self.widget().hiddenSlideUp(function () {
          $(this).remove();
        });
        createItem(self.widget().prev(), self.type.replace('_CREATE', ''), data.itemId, data);
        setState('default');
      };
      var fail = function (jqXHR, textStatus) {
        console.error(jqXHR.responseText);
        console.error(textStatus);
        if (textStatus != 'abort') {
          retryMessenger();
        }
        self.widget().find('button[name="save"]').button('reset');
        self.widget().find('button[name="preview"]').button('reset');
      };

      //如果是修改则传itemId，否则是新建则传prevId
      var data = this._getCommitData();
      var id = this.widget().data('id');
      var xhr;
      if (id) {
        xhr = $.ajax('/topic/item', {
          type: 'PUT',
          data: $.extend({
            topicId: topicId,
            itemId: id,
            type: self.type
          }, data)
        }).done(doneCallback)
          .fail(fail);
      } else {
        var prevItemType = this.widget().prev().data('type');
        var prevItemId = this.widget().prev().data('id');
        xhr = $.post('/topic/item', $.extend({
            topicId: topicId,
            prevItemType: prevItemType,
            prevItemId: prevItemId,
            type: self.type
          }, data))
          .done(doneCallback)
          .fail(fail);
      }
      return xhr;
    },

    preview: $.noop,
    _getCommitData: $.noop

  });

  $.widget('shizier.edit_createWidget', $.shizier.editWidget, {

    createPreviewWidget: function (data) {
      var type = this.type.replace('_CREATE', '');
      createWidget(type, $.extend({
        type: type,
        $li: this.widget()
      }, data));
      setState('edit');
    }

  });

  /*
   * 定义微件：链接微件
   */
  $.widget('shizier.linkWidget', $.shizier.editWidget, {

    type: 'LINK',
    noImgSrc: '/images/no_img/photo_150x150.png',
    index: -1,

    options: {
      url: '',
      title: '',
      snippet: '',
      srcs: null,
      src: null,
      description: ''
    },

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      var _increaseIndex = function (increment) {
        var $noImg = self.widget()
          .find('.Thumb input[type="checkbox"]');
        $noImg.removeAttr('checked');

        if (self.options.srcs && self.options.srcs.length > 1) {
          if (self.index + increment >= self.options.srcs.length) {
            self.index = 0;
          } else if (self.index + increment < 0) {
            self.index = self.options.srcs.length - 1;
          } else {
            self.index += increment;
          }
          self.widget()
            .find('.Thumb .btn-group .btn:first')
            .removeAttr('disabled')
            .end()
            .find('.Thumb .btn-group .btn:last')
            .removeAttr('disabled')
            .end();
        } else {
          self.widget()
            .find('.Thumb .btn-group .btn:first')
            .attr('disabled', 'disabled')
            .end()
            .find('.Thumb .btn-group .btn:last')
            .attr('disabled', 'disabled')
            .end();
        }

        self.widget()
          .find('.Image img')
          .attr('src', !(self.options.srcs && self.options.srcs.length) ? self.noImgSrc : self.options.srcs[self.index])
          .end()
          .find('.Image .Loading')
          .show()
          .end()
          .find('span[name="pagination"]')
          .text((self.index + 1) + '/' + (!self.options.srcs ? '0' : self.options.srcs.length))
          .end();
      }

      var _prependSrc = function (src) {
        if (!src) {
          return;
        }
        self.index = -1;
        if (self.options.srcs) {
          for (var i = 0; i < self.options.srcs.length; i++) {
            if (src == self.options.srcs[i]) {
              self.index = i;
              break;
            }
          }
        }
        if (self.index == -1) {
          self.options.srcs = [src].concat(!self.options.srcs ? [] : self.options.srcs);
          self.index = 0;
        }
        _increaseIndex(0);
      }

      if (this.options.src) {
        _prependSrc(this.options.src);
      } else if (this.options.srcs && this.options.srcs.length) {
        this.index = 0;
      }
      _increaseIndex(0);

      //填充文本
      this.widget()
        .find('.LINK_URL')
        .attr('href', this.options.url)
        .end()
        .find('.Quote a')
        .text(this.options.url)
        .end()
        .find('input[name="title"]')
        .val(this.options.title)
        .on(INPUT_EVENTS, !this.options.id ? $.noop : function (event) {
          self.stateHandler(self.options.title, event);
        })
        .end()
        .find('textarea[name="snippet"]')
        .val(this.options.snippet)
        .on(INPUT_EVENTS, !this.options.id ? $.noop : function (event) {
          self.stateHandler(self.options.snippet, event);
        })
        .end()
        .find('.Image img')
        .on('abort error load', function () {
          self.widget()
            .find('.Image .Loading')
            .hide()
            .end();
        })
        .end()
        .find('.Thumb .btn-group .btn:first')
        .click(function () {
          _increaseIndex(-1);
        })
        .end()
        .find('.Thumb .btn-group .btn:last')
        .click(function () {
          _increaseIndex(1);
        })
        .end()
        .find('.Thumb input[type="checkbox"]')
        .click(function () {
          if ($(this).is(':checked')) {
            self.widget()
              .find('.Image img')
              .attr('src', self.noImgSrc)
              .end();
          } else {
            _increaseIndex(0);
          }
        })
        .end()
        .find('.Thumb button[name="customize"]')
        .click(function () {
          _prependSrc(shizier.utils.suffixImage(self.widget().find('.Thumb input[type="text"]').val()));
        })
        .end()
        .find('textarea[name="description"]')
        .val(this.options.description)
        .on(INPUT_EVENTS, !this.options.id ? $.noop : function (event) {
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
          submitHandler: function () {
            self.commit();
          },
          showErrors: function (errorMap, errorList) {
            if (errorList.length) {
              alert(errorMap.title || errorMap.summary || errorMap.description);
            }
          },
          rules: {
            title: {
              maxlength: 100,
              required: false
            },
            snippet: {
              maxlength: 200,
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
            snippet: {
              maxlength: '摘要太长，请缩写到200字以内。'
            },
            description: {
              maxlength: '评论太长，请缩写到300字以内。'
            }
          }
        });
    },

    /**
     * 子类提交给服务器的数据
     * @private
     */
    _getCommitData: function () {
      var src = this.widget().find('.Image img').attr('src');
      return {
        url: this.options.url,
        title: this.widget().find('input[name="title"]').val(),
        snippet: this.widget().find('textarea[name="snippet"]').val(),
        src: src == this.noImgSrc ? undefined : src,
        description: this.widget().find('textarea[name="description"]').val()
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
        snippet: this.options.snippet,
        src: this.options.src,
        description: this.options.description
      }
    }

  });

  /*
   * 定义微件：链接创建微件
   */
  $.widget('shizier.link_createWidget', $.shizier.edit_createWidget, {

    type: 'LINK_CREATE',

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      //监听文本改变事件
      this.widget()
        .find('input')
        .on(INPUT_EVENTS, function () {
          var $preview = self.widget().find('button[name="preview"]');
          if (this.value) {
            $preview.removeAttr('disabled');
          } else {
            $preview.attr('disabled', 'disabled');
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
        submitHandler: function () {
          self.commit();
        },
        showErrors: function (errorMap, errorList) {
          if (errorList.length) {
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

    preview: function () {
      var self = this;

      var callback = function (data) {
        if (self.options.disabled) {
          return;
        }
        self.createPreviewWidget(data);
      };
      return $.getJSON('/topic/link_detail', this._getCommitData(), callback)
        .done(function (data) {
          if (self.options.disabled) {
            return;
          }
          self.createPreviewWidget(data);
        })
        .fail(function (jqXHR, textStatus) {
          console.error(jqXHR.responseText);
          console.error(textStatus);
          if (textStatus != 'abort') {
            retryMessenger();
          }
          self.widget().find('button[name="preview"]').button('reset');
        });
    },

    /**
     * 子类提交给服务器的数据
     * @private
     */
    _getCommitData: function () {
      return {
        url: this.widget().find('input').val()
      }
    }

  });

  /*
   * 定义微件：图片编辑微件
   */
  $.widget('shizier.imageWidget', $.shizier.editWidget, {

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
        .find('input[name="title"]')
        .val(this.options.title)
        .on(INPUT_EVENTS, !this.options.id ? $.noop : function (event) {
          self.stateHandler(self.options.title, event);
        })
        .end()
        .find('input[name="quote"]')
        .val(this.options.quote)
        .on(INPUT_EVENTS, !this.options.id ? $.noop : function (event) {
          self.stateHandler(self.options.quote, event);
        })
        .end()
        .find('textarea[name="description"]')
        .val(this.options.description)
        .on(INPUT_EVENTS, !this.options.id ? $.noop : function (event) {
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
          submitHandler: function () {
            self.commit();
          },
          showErrors: function (errorMap, errorList) {
            if (errorList.length) {
              alert(errorMap.title || errorMap.quote || errorMap.description);
            }
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
      return {
        url: this.options.url,
        title: this.widget().find('input[name="title"]').val(),
        quote: this.widget().find('input[name="quote"]').val(),
        description: this.widget().find('textarea[name="description"]').val()
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
  $.widget('shizier.image_createWidget', $.shizier.edit_createWidget, {

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
        .on(INPUT_EVENTS, function () {
          var $preview = self.widget().find('button[name="preview"]');
          if (this.value) {
            $preview.removeAttr('disabled');
          } else {
            $preview.attr('disabled', 'disabled');
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
        submitHandler: function () {
          self.commit();
        },
        showErrors: function (errorMap, errorList) {
          if (errorList.length) {
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

    preview: function () {
      this.createPreviewWidget(this._getCommitData());
    },

    /**
     * 子类提交给服务器的数据
     * @private
     */
    _getCommitData: function () {
      return {
        url: shizier.utils.suffixImage(this.widget().find('input').val())
      }
    }

  });

  /*
   * 定义微件：视频微件
   */
  $.widget('shizier.videoWidget', $.shizier.editWidget, {

    type: 'VIDEO',

    options: {
      url: '',
      vid: '',
      title: '',
      description: ''
    },

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      fillVideo(this.widget(), this.options.url, this.options.vid);

      //填充文本
      this.widget()
        .find('.VIDEO_URL')
        .attr('href', this.options.url)
        .end()
        .find('input[name="title"]')
        .val(this.options.title)
        .on(INPUT_EVENTS, !this.options.id ? $.noop : function (event) {
          self.stateHandler(self.options.title, event);
        })
        .end()
        .find('textarea[name="description"]')
        .val(this.options.description)
        .on(INPUT_EVENTS, !this.options.id ? $.noop : function (event) {
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
          submitHandler: function () {
            self.commit();
          },
          showErrors: function (errorMap, errorList) {
            if (errorList.length) {
              alert(errorMap.title || errorMap.description);
            }
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
        title: this.widget().find('input[name="title"]').val(),
        description: this.widget().find('textarea[name="description"]').val()
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
  $.widget('shizier.video_createWidget', $.shizier.edit_createWidget, {

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
        .on(INPUT_EVENTS, function () {
          var $preview = self.widget().find('button[name="preview"]');
          if (this.value) {
            $preview.removeAttr('disabled');
          } else {
            $preview.attr('disabled', 'disabled');
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
          submitHandler: function () {
            self.commit();
          },
          showErrors: function (errorMap, errorList) {
            if (errorList.length) {
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

    preview: function () {
      var self = this;

      var callback = function (data) {
        if (self.options.disabled) {
          return;
        }
        self.createPreviewWidget(data);
      };

      return $.getJSON('/topic/video_detail', this._getCommitData(), callback)
        .done(function (data) {
          if (self.options.disabled) {
            return;
          }
          self.createPreviewWidget(data);
        })
        .fail(function (jqXHR, textStatus) {
          console.error(jqXHR.responseText);
          console.error(textStatus);
          if (textStatus != 'abort') {
            retryMessenger();
          }
          self.widget().find('button[name="preview"]').button('reset');
        });
    },

    /**
     * 子类提交给服务器的数据
     * @private
     */
    _getCommitData: function () {
      return {
        url: this.widget().find('input').val()
      }
    }

  });

  /*
   * 定义微件：引用微件
   */
  $.widget('shizier.citeWidget', $.shizier.editWidget, {

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
        .find('textarea[name="cite"]')
        .val(this.options.cite)
        .on(INPUT_EVENTS, function (event) {
          self.stateHandler(self.options.cite, event);
        })
        .end()
        .find('input[name="url"]')
        .val(this.options.url)
        .on(INPUT_EVENTS, function (event) {
          self.stateHandler(self.options.url, event);
        })
        .end()
        .find('input[name="title"]')
        .val(this.options.title)
        .on(INPUT_EVENTS, function (event) {
          self.stateHandler(self.options.title, event);
        })
        .end()
        .find('textarea[name="description"]')
        .val(this.options.description)
        .on(INPUT_EVENTS, function (event) {
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
          submitHandler: function () {
            self.commit();
          },
          showErrors: function (errorMap, errorList) {
            if (errorList.length) {
              alert(errorMap.cite || errorMap.url || errorMap.title || errorMap.description);
            }
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
        cite: this.widget().find('textarea[name="cite"]').val(),
        url: this.widget().find('input[name="url"]').val(),
        title: this.widget().find('input[name="title"]').val(),
        description: this.widget().find('textarea[name="description"]').val()
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
  $.widget('shizier.textWidget', $.shizier.editWidget, {

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
        .on(INPUT_EVENTS, function (event) {
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
        submitHandler: function () {
          self.commit();
        },
        showErrors: function (errorMap, errorList) {
          if (errorList.length) {
            alert(errorMap.text);
          }
        },
        rules: {
          text: {
            required: true,
            maxlength: 2000
          }
        },
        messages: {
          text: {
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
  $.widget('shizier.titleWidget', $.shizier.editWidget, {

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
        .on(INPUT_EVENTS, function (event) {
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
        submitHandler: function () {
          self.commit();
        },
        showErrors: function (errorMap, errorList) {
          if (errorList.length) {
            alert(errorMap.title);
          }
        },
        rules: {
          title: {
            required: true,
            maxlength: 100
          }
        },
        messages: {
          title: {
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

  //数据库中该总结id
  var topicId;
  var state = 'default';
  var $editingWidget;

  var $band;
  var $band_asterisk;
  var $band_saved;
  var $band_error;
  var $band_loading;
  var $form;
  var $saveSet;
  var $save;
  var $cancel;
  var $switch;
  var $options;
  var $ul;
  var $templates;
  var $title;
  var $cover;
  var $description;

  var titleModified;
  var coverModified;
  var descriptionModified;
  var topModified;
  var title;
  var coverUrl;
  var description;
  var fail;
  var savedOnce;
  var xhr;

  function retryMessenger() {
    Messenger().post({
      message: '操作失败，请重试',
      type: 'error'
    });
  }

  function onStateChange() {
    $band_asterisk.hide();
    $band_saved.hide();
    if (fail) {
      $band_asterisk.show();
      $band_error.show();
      $('body').attr('onbeforeunload', '');
    } else if (state != 'default' || topModified) {
      $band_asterisk.show();
      $('body').attr('onbeforeunload', 'return "您有尚未保存的内容";');
    } else {
      if (savedOnce) {
        $band_saved.show();
      }
      $('body').attr('onbeforeunload', '');
    }
  }

  function onTopStateChange() {
    topModified = titleModified || coverModified || descriptionModified;
    if (topModified) {
      $saveSet.show();
    } else {
      $saveSet.hide();
    }
    onStateChange();
  }

  function onTopChange() {
    title = $title.val();
    coverUrl = $form.find('button[name="cover"] img').attr('src');
    description = $description.val();
    titleModified = coverModified = descriptionModified = false;
    onTopStateChange();
  }

  function notifyFail() {
    fail = true;
    onStateChange();
  }

  function setState(newState) {
    console.log(newState);
    state = newState;
    onStateChange();
  }

  /**
   * 创建一个编辑微件
   * @param type
   * @param options
   * @private
   */
  function createWidget(type, options) {
    console.log('createWidget');

    if (!type) {
      return;
    }

    var $prevItem = options.$prevItem;
    var $li = options.$li;

    //编辑中的微件处在已修改状态
    if (state == 'edit'
      && !confirm('您有正在编辑的内容，确定要放弃然后添加其他类型的条目吗？')) {
      return;
    }

    var oldState = state;

    //删除编辑中的微件
    if (state != 'default') {
      $editingWidget[$editingWidget.data('type').toLowerCase() + 'Widget']('remove');
    }

    //编辑中的微件和目标微件:类型相同、来源相同，删了可以直接返回了
    if (oldState == 'create'
      && $editingWidget.data('type') == type
      && $prevItem
      && !$editingWidget.data('id')
      && ($prevItem.is($editingWidget.prev())
      || (!$prevItem.length && !$editingWidget.prev().length))) {

      return;
    }

    if ($li) {
      $li.hiddenSlideUp(function () {
        $(this).remove();
      });
    }

    var $widget = $templates.find('>ul>li').clone();
    //如果是动态插入就插入前趋条目的后面，否则是静态插入就插入最前面
    if ($prevItem && $prevItem.length) {
      $prevItem.after($widget);
    } else if ($li && $li.length && $li.prev().length) {
      $li.prev().after($widget);
    } else {
      $ul.prepend($widget);
    }

    //根据类型选择微件，并保存调用微件方法的函数
    setState('create');
    $editingWidget = $widget;
    $widget[type.toLowerCase() + 'Widget'](options);
    console.log('createWidget ' + type);
  }

  /**
   * 创建条目
   */
  function createItem($prevItem, type, id, data) {
    console.log('createItem');

    var $item = $templates.find('>ul>li').clone();
    //如果指定了前趋条目就插入其后面，否则插入最前
    if ($prevItem && $prevItem[0]) {
      $prevItem.after($item);
    } else {
      $ul.prepend($item);
    }

    //填充新内容，然后删除旧内容，顺序很重要！！！防止抖动
    $item
      .addClass(type)
      .data('type', type)
      .data('id', id)
      .find('>div')
      .prepend($templates.find('.Item:first').clone())
      .end()
      .find('.Item')
      .prepend($templates.find('.Item .' + type).clone())
      .end();

    switch (type) {
      case 'LINK':
        //填充链接信息
        var url = data.url;
        var title = data.title;
        var snippet = data.snippet;
        var src = data.src;
        var description = data.description;

        $item
          .find('.LINK_URL')
          .attr('href', url)
          .end()
          .find('.Title a')
          .text(title)
          .end()
          .find('.Quote a')
          .text(url)
          .end()
          .find('.Snippet')
          .html($('<div/>').text(snippet).html().replace(/\n/g, '<br>'))
          .end()
          .find('.Thumb')
          .find('a')
          .attr('title', title)
          .attr('href', src)
          .find('img')
          .attr('src', src)
          .end()
          .end()
          .end()
          .find('.Description')
          .html($('<div/>').text(description).html().replace(/\n/g, '<br>'))
          .end();
        if (!snippet) {
          $item.find('.Snippet').hide();
        }
        if (!src) {
          $item.find('.Thumb').hide();
        }
        if (!description) {
          $item.find('.Description').hide();
        }
        break;
      case 'IMAGE':
        //填充图片信息
        var url = data.url;
        var title = data.title;
        var quote = data.quote;
        var quoteDomain = shizier.utils.getImageQuoteDomain(quote);
        var description = data.description;
        $item
          .find('.IMAGE_LINK')
          .attr('href', url)
          .end()
          .find('.Image')
          .find('a')
          .attr('title', (title || '') + (title && description ? ' -- ' : '') + (description || ''))
          .find('img')
          .attr('src', url)
          .end()
          .end()
          .end()
          .find('.Title')
          .text(title)
          .end()
          .find('.Quote a')
          .attr('href', quote)
          .text(quoteDomain || '')
          .end()
          .find('.Description')
          .html($('<div/>').text(description).html().replace(/\n/g, '<br>'))
          .end();
        if (!quote) {
          $item.find('.Quote').hide();
        }
        break;
      case 'VIDEO':
        //填充视频信息
        var url = data.url;
        var vid = data.vid;
        var title = data.title;
        var description = data.description;

        fillVideo($item, url, vid);

        $item
          .find('.VIDEO_URL')
          .attr('href', url)
          .end()
          .find('.Title a')
          .text(title)
          .end()
          .find('.Description')
          .html($('<div/>').text(description).html().replace(/\n/g, '<br>'))
          .end();
        if (!title) {
          $item.find('.Title').hide();
        }
        if (!description) {
          $item.find('.Description').hide();
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
          .text(!url ? '' : !title ? url : title)
          .end()
          .find('.Quote span:last')
          .text(url ? '' : title)
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

    $item.fadeSlideDown();

    return $item;
  }

  function __init() {
    $._messengerDefaults = {
      extraClasses: 'messenger-fixed messenger-on-top'
    }
    topicId = location.pathname.match(/^\/topic\/([0-9a-f]{24})\/edit$/)[1];
    $band = $('.Band');
    $band_asterisk = $band.find('#_asterisk');
    $band_saved = $band.find('#_saved');
    $band_error = $band.find('#_error');
    $band_loading = $band.find('#_loading');
    $form = $('.Edit_Top form');
    $title = $form.find('input[name="title"]');
    $cover = $form.find('button[name="cover"] img');
    $description = $form.find('textarea[name="description"]');
    $saveSet = $form.find('#_saveSet');
    $save = $saveSet.find('button[name="save"]');
    $cancel = $saveSet.find('button[name="cancel"]');
    $switch = $form.find('button[name="options"]');
    $options = $form.find('fieldset:last');
    $ul = $('.WidgetItemList');
    $templates = $('.TEMPLATES');
    $('.fancybox:visible').fancybox(shizier.fancyboxOptions);
  }

  function __initListListener() {
    console.log('__initListListener');
    $ul
      .on('click', '.SortUtil i', function () {
        var $this = $(this);
        var $li = $this.closest('li');
        if ($this.is($li.find('.SortUtil>div:first>i:first'))) {
          $li.prependTo($ul);
          updateList($li);
        } else if ($this.is($li.find('.SortUtil>div:first>i:last'))) {
          $li.after($li.prev());
          updateList($li);
        } else if ($this.is($li.find('.SortUtil>div:last>i:first'))) {
          $li.before($li.next());
          updateList($li);
        } else if ($this.is($li.find('.SortUtil>div:last>i:last'))) {
          $li.appendTo($ul);
          updateList($li);
        }
      })
      //监听预览按钮点击事件
      .on('click', 'button[name="preview"]', function () {
        var $li = $(this).closest('li');
        $li.find('form')
          .data('submitType', 'preview')
          .submit()
          .data('submitType', null);
      })
      //监听放弃按钮点击事件
      .on('click', '[name="cancel"]', function () {
        if (state == 'edit'
          && !confirm('您编辑的内容将被丢弃，确定要放弃吗？')) {
          return;
        }

        var $li = $(this).closest('li');
        $li[$editingWidget.data('type').toLowerCase() + 'Widget']('remove');
      })
      //绑定删除点击响应
      .on('click', '.DELETE', function () {
        var $li = $(this).closest('li');
        if (!confirm('条目删除后无法找回，您确定要删除吗？')) {
          return;
        }
        $.ajax('/topic/item', {
          type: 'DELETE',
          data: {
            topicId: topicId,
            type: $li.data('type'),
            itemId: $li.data('id')
          }
        })
          .done(function () {
            savedOnce = true;
          })
          .fail(notifyFail);
        $li.hiddenSlideUp(function () {
          $(this).remove();
        })
      })
      //绑定修改点击响应
      .on('click', '.EDIT', function () {
        var $li = $(this).closest('li');
        var type = $li.data('type');
        var data;
        switch (type) {
          case 'LINK':
            data = {
              url: $li.find('.Quote a').attr('href'),
              title: $li.find('.Title a').text(),
              snippet: $('<div/>').html($li.find('.Snippet').html().replace(/<br>/g, '\n')).text(),
              src: $li.find('.Thumb img').attr('src'),
              description: $('<div/>').html($li.find('.Description').html().replace(/<br>/g, '\n')).text()
            };
            break;
          case 'IMAGE':
            data = {
              url: $li.find('img').attr('src'),
              title: $li.find('.Title').text(),
              quote: $li.find('.Quote a').attr('href'),
              description: $('<div/>').html($li.find('.Description').html().replace(/<br>/g, '\n')).text()
            };
            break;
          case 'VIDEO':
            data = {
              url: $li.find('.Quote a').attr('href'),
              title: $li.find('.Title a').text(),
              description: $('<div/>').html($li.find('.Description').html().replace(/<br>/g, '\n')).text()
            };
            break;
          case 'CITE':
            data = {
              cite: $('<div/>').html($li.find('.Cite q').html().replace(/<br>/g, '\n')).text(),
              url: $li.find('.Quote a').attr('href'),
              title: $li.find('.Quote a').text() || $li.find('.Quote span:last').text(),
              description: $('<div/>').html($li.find('.Description').html().replace(/<br>/g, '\n')).text()
            };
            break;
          case 'TEXT':
            data = {
              text: $('<div/>').html($li.find('p').html().replace(/<br>/g, '\n')).text()
            };
            break;
          case 'TITLE':
            data = {
              title: $li.find('p').text()
            };
            break;
        }
        createWidget(type, $.extend({
          id: $li.data('id'),
          $li: $li
        }, data));
      })
  }

  /**
   * 总结菜单栏固定窗口顶部、监听按钮点击事件
   * @private
   */
  function __initBand() {
    $(document)
      .ajaxStart(function () {
        $band_saved.hide();
        $band_loading.show();
      })
      .ajaxStop(function () {
        onStateChange();
        $band_loading.hide();
      });

    $(window).scroll(function () {
      if ($(this).scrollTop() >= 48) {
        $band.addClass('Band-Fixed').removeAttr('style');
      } else {
        $band.removeClass('Band-Fixed').css('top', 48 - $(this).scrollTop());
      }
    });

    $band.add($form).on('click',
      'button[name="publish"], button[name="save"]',
      function (event) {
        var $target = $(event.target);
        var name = $target.attr('name');
        $form
          .data('submitType', name)
          .submit();
      });
  }

  function ___commit() {
    var submitType = $form.data('submitType');
    if (submitType == 'publish'
      && !confirm('发布后将无法退回草稿状态，您确定要发布吗？')) {
      return;
    }

    var coverUrl = $form.find('button[name="cover"] img').attr('src');
    var $button = $band.add($form).find('button[name="' + submitType + '"]');
    $button.button('loading');

    xhr = $.ajax('/topic/save', {
      type: 'PUT',
      data: {
        topicId: topicId,
        title: $form.find('input[name="title"]').val(),
        coverUrl: coverUrl == '/images/no_img/image_95x95.png' ? undefined : coverUrl,
        description: $form.find('textarea[name="description"]').val(),
        publish: submitType == 'publish' ? 1 : undefined
      }
    })
      .done(function () {
        savedOnce = true;
        onTopChange();
        if (submitType == 'publish') {
          window.location = '/topic/' + topicId;
        } else {
          if ($options.is(':visible')) {
            $switch.click();
          }
        }
      })
      .fail(function (jqXHR, textStatus) {
        console.error(jqXHR.responseText);
        console.error(textStatus);
        if (textStatus != 'abort') {
          retryMessenger();
        }
        $button.button('reset');
      });
    if (submitType == 'publish') {
      xhr = null;
    }
  }

  /**
   * 初始化总结标题，总结描述
   * @private
   */
  function __initTop() {
    $form.validate({
      submitHandler: function () {
        ___commit();
      },
      showErrors: function (errorMap, errorList) {
        if (errorList.length) {
          alert(errorMap.title || errorMap.description);
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

    //开关可选项目的动画
    $switch.click(function () {
      if ($(this).find('i').is('.icon-caret-down')) {
        $options.fadeSlideDown();
      } else {
        $options.hiddenSlideUp();
      }
      $(this).find('i').toggleClass('icon-caret-down icon-caret-up');
    });

    $options
      .show()
      .find('textarea').autosize({
        append: '\n'
      })
      .end()
      .hide();

    if (/showOption=true/.test(location.search)) {
      $switch
        .find('i')
        .toggleClass('icon-caret-down icon-caret-up');
      $options.toggle();
    }

    var $thumb = $('button[name="cover"]');
    var $extra = $('.Edit_Top_Thumb_Extra');
    var $input = $extra.find('input');
    var $preview = $extra.find('button[name="preview"]');
    var $reset = $extra.find('button[name="reset"]');
    var autoHide = false;
    var hide = function () {
      $extra.css('visibility', 'hidden')
        .hide('fast', function () {
          $extra.removeAttr('style');
        })
    };
    $thumb.click(function () {
      autoHide = false;
      if ($extra.is(':visible')) {
        hide();
      } else {
        $extra
          .css({ 'opacity': 0 })
          .animate({
            opacity: 0.5,
            width: 'toggle'
          }, 100)
          .fadeTo(100, 1, function () {
            $extra.css('opacity', 'inherit');
          });
        $input.focus();
      }
    });
    $cover.on('load', function () {
      if ($cover.attr('src') != '/images/no_img/image_95x95.png'
        && autoHide) {
        hide();
      }
    });

    $reset.click(function () {
      hide();
      $cover.attr('src', coverUrl);
      coverModified = $cover.attr('src') != coverUrl;
      onTopStateChange();
    });
    $preview.click(function () {
      autoHide = true;
      $cover.attr('src', shizier.utils.suffixImage($input.val()));
      coverModified = $cover.attr('src') != coverUrl;
      onTopStateChange();
      if (!$input.val()) {
        hide();
      }
    });

    $title.on(INPUT_EVENTS, function () {
      titleModified = $title.val() != title;
      onTopStateChange();
    });

    $description.on(INPUT_EVENTS, function () {
      descriptionModified = $description.val() != description;
      onTopStateChange();
    });

    $cancel.click(function () {
      $save.button('reset');
      if (xhr) {
        xhr.abort();
      }
      $title.val(title);
      $cover.attr('src', coverUrl);
      $description.val(description);
      titleModified = $title.val() != title;
      coverModified = $cover.attr('src') != coverUrl;
      descriptionModified = $description.val() != description;
      if ($options.is(':visible')) {
        $switch.click();
      }
      onTopStateChange();
    })
    onTopChange();
  }

  /**
   * 启用列表排序微件
   */
  function __initSort() {
    $ul
      //防止拖动开始时高度减小导致的抖动
      .mousedown(function (e) {
        $(this).css('min-height', $(this).height());
      })
      .mouseup(function () {
        $(this).removeAttr('style');
      })
      //启用sortable微件
      .sortable({

        //sortable微件的标准参数
        placeholder: 'WidgetDragPlaceholder',
        opacity: 0.4,
        cursor: 'move',
        handle: '.MoveUtil',
        scrollSensitivity: 100,
        scrollSpeed: 10,
        axis: 'y',
        containment: 'body',

        start: function () {
          console.log('start');
          $(this)
            .addClass('WidgetItemList-Sorting')
            .mousemove(function (e) {
              var marginTop = e.clientY;
              var marginBottom = $(window).height() - e.clientY;
              var margin = Math.min(marginTop > 0 ? marginTop : 0, marginBottom > 0 ? marginBottom : 0);
              var scrollSensitivity = 100;
              if (margin < scrollSensitivity) {
                $(this).sortable('option', 'scrollSpeed', 50 * (1 - margin * margin / (scrollSensitivity * scrollSensitivity)));
              }
            })
            .sortable('refreshPositions');//因为item缩小了，所以要清除缓存大小
        },

        stop: function () {
          console.log('stop');
          $(this)
            .removeClass('WidgetItemList-Sorting')
            .unbind('mousemove');
        },

        //列表顺序改变后的回调函数
        update: function (event, data) {
          console.log('sort');
          updateList(data.item);
        }
      });
  }

  /**
   * 初始化条目创建菜单的点击响应
   * @private
   */
  function __initMenu() {
    $('.Contents').on('click', '.Menu li>button', function () {
      var $li = $(this).closest('.WidgetItemList>li');
      createWidget($(this).data('type'), {
        $prevItem: $li
      });
    });
  }

  /**
   * 入口函数，必须要从服务器验证或获取topicId才能编辑总结
   */
  (function getTopicId() {
    console.log('getTopicId');

    $(function ($) {
      $.validator.setDefaults({
        debug: false,
        ignore: "",
        onkeyup: false,
        onfocusout: false
      });
      __init();
      __initListListener();
      __initBand();
      __initTop();
      __initMenu();
      __initSort();
    });
  })();

})
  (jQuery);