/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/3/13
 * Time: 11:26 PM
 * To change this template use File | Settings | File Templates.
 */

(function ($) {

  var console = window.console || {log: $.noop, error: $.noop};
  var REGEXP_URL = /^(https?|ftp):\/\/(([\w\-]+\.)+[\w\-]+)(\/|\?|$)/i;
  var REGEXP_URL_NO_PROTOCOL = /^(([\w\-]+\.)+[\w\-]+)(\/|\?|$)/i;

  function fillVideo($li, url) {
    var urlParts = url.match(REGEXP_URL);
    var temp;
    var quote = !urlParts ? null : !urlParts[2] ? null : !(temp = urlParts[2].match(/youku\.com|tudou\.com$/i)) ? null : temp[0];
    var videoType = !quote ? null : !(temp = quote.match(/([^\.]+)\./)) ? null : !temp[1] ? null : temp[1].toUpperCase();
    var vid;

    switch (videoType) {
      case 'YOUKU':
        //http://v.youku.com/v_show/id_XNjEyOTU3NjE2.html?f=20383529&ev=1
        vid = !(temp = url) ? null : !(temp = temp.match(/id_([\w\-]{13})\.html\/?(\?|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'TUDOU':
        //http://www.tudou.com/listplay/pKzzr-WLvwk/snBiS0Y74PQ.html
        //http://www.tudou.com/programs/view/TtwcrB0saxg
        vid = !(temp = url) ? null : !(temp = temp.match(/([\w\-]{11})(\.html)?\/?(\?|$)/)) ? null : !temp[1] ? null : temp[1];
        break;
    }

    //填充视频
    if (vid) {
      $li
        .find('.' + videoType)
        .attr('src', !(temp = $li.find('.' + videoType).attr('src')) ? '' : temp.replace('#vid#', vid))
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

  var updateList = function ($li) {
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
    });
  }

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

  /*
   * 定义微件：编辑widget的base对象
   */
  $.widget('mtm.editWidget', {

    type: undefined,

    options: {
      id: undefined,
      from: ''
    },

    _create: function () {
      console.log('_create');
      var self = this;

      this.widget()
        .data('type', this.type)
        .data('id', this.options.id)
        .scroll(function () {
          self.widget().scrollTop(0);
        })
        .find('>div')
        .prepend($templates.find('.Widget:first').clone())
        .end()
        .find('.Widget')
        .prepend($templates.find('.Widget .' + this.type).clone())
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
        //textarea赋值后触发resize事件
        .find('textarea')
        .trigger('autosize.resize')
        .end()
        .fadeSlideDown(function () {
          self.widget()
            .find('textarea')
            .addClass('HeightAnimation')
            .end();
        });

      this.autoFocus();

      this.__initFormValidation();
    },

    __create: $.noop,
    __initFormValidation: $.noop,

    stateHandler: function (defaultValue, event) {
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
      if (this.widget().find('form').data('submitType') == 'save') {
        this.widget().find('button[name="save"]').button('loading');
        this.widget().find('button[name="preview"]').attr('disabled', 'disabled');
        this.save();
      } else {
        this.widget().find('button[name="preview"]').button('loading');
        this.preview();
      }
    },

    save: function () {
      var self = this;
      //ajax完成后将微件改为条目
      var doneCallback = function (data) {
        if (self.options.disabled) {
          return;
        }
        self.widget().hiddenSlideUp(function () {
          $(this).remove();
        });
        createItem(self.widget().prev(), self.type.replace('_CREATE', ''), data.itemId, data);
        setState('default');
      }

      //如果是修改则传itemId，否则是新建则传prevId
      var data = this._getCommitData();
      var id = this.widget().data('id');
      if (id) {
        $.ajax('/topic/item', {
          type: 'PUT',
          data: $.extend({
            topicId: topicId,
            itemId: id,
            type: self.type
          }, data)
        }).done(doneCallback);
      } else {
        var prevItemType = this.widget().prev().data('type');
        var prevItemId = this.widget().prev().data('id');
        $.post('/topic/item', $.extend({
            topicId: topicId,
            prevItemType: prevItemType,
            prevItemId: prevItemId,
            type: self.type
          }, data))
          .done(doneCallback);
      }
    },

    preview: $.noop,
    _getCommitData: $.noop

  });

  $.widget('mtm.edit_createWidget', $.mtm.editWidget, {

    createPreviewWidget: function (data) {
      var type = this.type.replace('_CREATE', '');
      createWidget(type, $.extend({
        from: this.options.from,
        type: type,
        $prevItem: this.widget().prev(),
        $li: this.widget()
      }, data));
      setState('edit');
    }

  })

  /*
   * 定义微件：动态菜单
   */
  $.widget('mtm.menuWidget', $.mtm.editWidget, {

    type: 'MENU',

    __create: function () {
      var self = this;
      this.widget()
        .on('click', 'li>a', function (event) {
          createWidget($(event.target).data('type'), {
            from: 'DYNAMIC',
            $prevItem: self.widget().prev()
          });
        });
    }

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
        .find('input[name="title"]')
        .val(this.options.title)
        .on('input blur mousedown mouseup keydown keypress keyup', this.options.from != 'EDIT' ? $.noop : function (event) {
          self.stateHandler(self.options.title, event);
        })
        .end()
        .find('input[name="quote"]')
        .val(this.options.quote)
        .on('input blur mousedown mouseup keydown keypress keyup', this.options.from != 'EDIT' ? $.noop : function (event) {
          self.stateHandler(self.options.quote, event);
        })
        .end()
        .find('textarea[name="description"]')
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
          var $quote = self.widget().find('input[name="quote"]');
          var quote = $quote.val();
          console.log('quote=' + quote);
          var urlParts = quote.match(REGEXP_URL_NO_PROTOCOL);
          if (urlParts) {
            console.log(urlParts[0]);
            $quote.val('http://' + quote);
          }
        })
        .validate({
          submitHandler: function (form) {
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
  $.widget('mtm.image_createWidget', $.mtm.edit_createWidget, {

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
        url: this.widget().find('input').val()
      }
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

      fillVideo(this.widget(), this.options.url);

      //填充文本
      this.widget()
        .find('.VIDEO_URL')
        .attr('href', this.options.url)
        .end()
        .find('input[name="title"]')
        .val(this.options.title)
        .on('input blur mousedown mouseup keydown keypress keyup', this.options.from != 'EDIT' ? $.noop : function (event) {
          self.stateHandler(self.options.title, event);
        })
        .end()
        .find('textarea[name="description"]')
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
          submitHandler: function (form) {
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
  $.widget('mtm.video_createWidget', $.mtm.edit_createWidget, {

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
      var url = this.widget().find('input').val();

      var callback = function (data) {
        if (self.options.disabled) {
          return;
        }
        self.createPreviewWidget(data);
      }
      $.getJSON('/topic/video_title', { url: url }, callback);
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
        .find('textarea[name="cite"]')
        .val(this.options.cite)
        .on('input blur mousedown mouseup keydown keypress keyup', function (event) {
          self.stateHandler(self.options.cite, event);
        })
        .end()
        .find('input[name="url"]')
        .val(this.options.url)
        .on('input blur mousedown mouseup keydown keypress keyup', function (event) {
          self.stateHandler(self.options.url, event);
        })
        .end()
        .find('input[name="title"]')
        .val(this.options.title)
        .on('input blur mousedown mouseup keydown keypress keyup', function (event) {
          self.stateHandler(self.options.title, event);
        })
        .end()
        .find('textarea[name="description"]')
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
          var $url = self.widget().find('input[name="url"]');
          var url = $url.val();
          var urlParts = url.match(REGEXP_URL_NO_PROTOCOL);
          if (urlParts) {
            $url.val('http://' + url);
          }
        })
        .validate({
          submitHandler: function (form) {
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
        submitHandler: function (form) {
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
        submitHandler: function (form) {
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
  var from;
  var editingWidgetName;
  var $editingWidget;
  var $editingPrevItem;

  var $form;
  var $band;
  var $ul;
  var $templates;

  var setState = function (newState) {
    console.log(newState);
    state = newState;
  }

  /**
   * 创建一个编辑微件
   * @param type
   * @param options
   * @private
   */
  var createWidget = function (type, options) {
    console.log('createWidget');

    if (!type) {
      return;
    }

    var newFrom = options.from;
    var $prevItem = options.$prevItem;
    var $li = options.$li;

    //编辑页面不在默认状态
    if (state != 'default') {
      console.log('state != default');

      //编辑中的微件和目标微件:类型相同、来源相同，只需给输入框焦点
      console.log($editingWidget.data('type'));
      if ($editingWidget.data('type') == type
        && from == newFrom
        && (newFrom == 'STATIC'
        || newFrom == 'INSERT' && $editingPrevItem.is($prevItem))) {
        console.log('重置焦点');

        if (editingWidgetName) {
          $editingWidget[editingWidgetName]('autoFocus');
        }
        //todo 优化：是否要移动光标？
        return;
      }

      //编辑中的微件处在已修改状态
      if (state == 'edit'
        && !confirm('您有正在编辑的内容，确定要放弃然后添加其他类型的条目吗？')) {
        return;
      }

      //删除编辑中的微件
      if (editingWidgetName) {
        $editingWidget[editingWidgetName]('remove');
      }
    }

    if ($li) {
      $li.hiddenSlideUp(function () {
        $(this).remove();
      });
    }

    //如果是修改就用原条目新建微件，否则是插入就复制新的li元素
    var $editWidget = $templates.find('>ul>li').clone();
    //如果是动态插入就插入前趋条目的后面，否则是静态插入就插入最前面
    if ($prevItem && $prevItem.length) {
      $prevItem.after($editWidget);
    } else {
      $ul.prepend($editWidget);
    }

    //根据类型选择微件，并保存调用微件方法的函数
    console.log('_createEditWidget ' + type);
    editingWidgetName = type.toLowerCase() + 'Widget';
    $editWidget[editingWidgetName](options);

    console.log('create');
    state = 'create';
    from = newFrom;
    $editingWidget = $editWidget;
    $editingPrevItem = $prevItem;
  }

  /**
   * 创建条目
   * @param type
   * @param data
   * @private
   */
  var createItem = function ($prevItem, type, id, data) {
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
      .data('type', type)
      .data('id', id)
      .find('>div')
      .prepend($templates.find('.Item:first').clone())
      .end()
      .find('.Item')
      .prepend($templates.find('.Item .' + type).clone())
      .end();

    switch (type) {
      case 'IMAGE':
        //填充图片信息
        var url = data.url;
        var title = data.title;
        var quote = data.quote;
        var description = data.description;
        var urlParts = !quote ? null : quote.match(REGEXP_URL);
        $item
          .find('.IMAGE_LINK')
          .attr('href', url)
          .end()
          .find('img')
          .attr('src', url)
          .end()
          .find('.Title a')
          .text(title)
          .end()
          .find('.Quote a')
          .attr('href', quote)
          .text(urlParts ? urlParts[2] : '')
          .end()
          .find('.Description')
          .html($('<div/>').text(description).html().replace(/\n/g, '<br>'))
          .end();
        break;
      case 'VIDEO':
        //填充视频信息
        var url = data.url;
        var title = data.title;
        var description = data.description;

        fillVideo($item, url);

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

  var __init = function () {
    $ul = $('.WidgetItemList');
    $templates = $('.TEMPLATES');
  }

  var __initListListener = function () {
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
          .submit();
      })
      //监听保存按钮点击事件
      .on('click', 'button[name="save"]', function () {
        var $li = $(this).closest('li');
        $li.find('form')
          .data('submitType', 'save')
          .submit();
      })
      //监听放弃按钮点击事件
      .on('click', '[name="cancel"]', function () {
        if (state == 'edit'
          && !confirm('您编辑的内容将被丢弃，确定要放弃吗？')) {
          return;
        }

        var $li = $(this).closest('li');
        $li[editingWidgetName]('remove');
      })
      //绑定插入点击响应
      .on('click', '.INSERT', function () {
        createWidget('MENU', {
          from: 'INSERT',
          $prevItem: $(this).closest('li')
        });
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
        });
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
          case 'IMAGE':
            data = {
              url: $li.find('img').attr('src'),
              title: $li.find('.Title a').text(),
              quote: $li.find('.Quote a').attr('href'),
              description: $('<div/>').html($li.find('.Description').html().replace(/<br>/g, '\n')).text()
            }
            break;
          case 'VIDEO':
            data = {
              url: $li.find('.Quote a').attr('href'),
              title: $li.find('.Title a').text(),
              description: $('<div/>').html($li.find('.Description').html().replace(/<br>/g, '\n')).text()
            }
            break;
          case 'CITE':
            data = {
              cite: $('<div/>').html($li.find('.Cite q').html().replace(/<br>/g, '\n')).text(),
              url: $li.find('.Quote a').attr('href'),
              title: $li.find('.Quote a').text() || $li.find('.Quote span:last').text(),
              description: $('<div/>').html($li.find('.Description').html().replace(/<br>/g, '\n')).text()
            }
            break;
          case 'TEXT':
            data = {
              text: $('<div/>').html($li.find('p').html().replace(/<br>/g, '\n')).text()
            }
            break;
          case 'TITLE':
            data = {
              title: $li.find('p').text()
            }
            break;
        }
        createWidget(type, $.extend({
          id: $li.data('id'),
          from: 'EDIT',
          $prevItem: $li.prev(),
          $li: $li
        }, data));
      })
  }

  /**
   * 初始化总结标题，总结描述
   * @private
   */
  var __initTop = function (topicData) {
    $form = $('.Edit_Top form');

    if (topicData) {
      var title = topicData.title;
      var coverUrl = topicData.coverUrl;
      var description = topicData.description;
      $form.find('input[name="title"]').val(title ? title : '');
      $form.find('.Edit_Top_Thumb img').attr('src', coverUrl ? coverUrl : '');
      $form.find('textarea[name="description"]').val(description ? description : '');
    }

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

    var $Button = $form.find('.Edit_Top_OptionBtn');
    var $options = $form.find('fieldset:last');

    //开关可选项目的动画
    $Button.click(function () {
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
      $Button
        .find('i')
        .toggleClass('icon-caret-down icon-caret-up')
        .end()
        .show();
      $options.toggle();
    } else {
      $Button.fadeIn('slow');
    }

    var $thumb = $('.Edit_Top_Thumb');
    var $extra = $('.Edit_Top_Thumb_Extra');
    var $input = $extra.find('input');
    var $save = $extra.find('button[name="save"]');
    var $cancel = $extra.find('button[name="cancel"]');
    $thumb.click(function () {
      $extra.toggle('fast');
    });
    $cancel.click(function () {
      $extra.css('visibility', 'hidden')
        .hide('fast', function () {
          $extra.css('visibility', 'visible');
        })
    });
    $save.click(function () {
      $thumb.find('img').attr('src', $input.val());
      $cancel.click();
    });
  }

  var ___commit = function () {
    var submitType = $form.data('submitType');
    $band.find('button[name="' + submitType + '"]').button('loading');

    $.ajax('/topic/save', {
      type: 'PUT',
      data: {
        topicId: topicId,
        title: $form.find('input[name="title"]').val(),
        coverUrl: $form.find('.Edit_Top_Thumb img').attr('src'),
        description: $form.find('textarea[name="description"]').val(),
        publish: submitType == 'publish' ? 1 : undefined
      }
    })
      .done(function () {
        if (submitType == 'saveDraft') {
          window.location = '/works';
        } else {
          window.location = '/topic/' + topicId;
        }
      });
  }

  /**
   * 总结菜单栏固定窗口顶部、监听按钮点击事件
   * @private
   */
  var __initBand = function () {
    $band = $('.Band');

    var headPosition = $band.offset().top;
    $(window).scroll(function () {
      if ($(this).scrollTop() >= headPosition) {
        $band.addClass('Band-Fixed');
      } else {
        $band.removeClass('Band-Fixed');
      }
    });

    $band.on('click', 'button', function (event) {
      var $target = $(event.target);
      var name = $target.attr('name');
      $form
        .data('submitType', name)
        .submit();
    });
  }

  /**
   * 启用列表排序微件
   */
  var __initSort = function () {
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
          $(this).disableSelection()
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
  var __initMenu = function () {
    $('.StaticMenu').on('click', 'li>a', function (event) {
      createWidget($(event.target).data('type'), {
        from: 'STATIC'
      });
    });
  }

  /**
   * 对于已经存在的总结，往条目列表填充服务器返回的数据
   * @private
   */
  var __initItems = function (itemsData) {
    if (!itemsData) {
      return;
    }
    var prevItem;
    itemsData.forEach(function (itemData) {
      prevItem = createItem(prevItem, itemData.type, itemData.itemId, itemData);
    });
  }

  /**
   * main function
   * @param data
   */
  var _doIfGetIdDone = function (data) {
    console.log('doIfGetIdDone');
    data = data || {};

    if (data.redirect) {
      window.location.replace(data.redirect);
      if (typeof window.history.pushState == "function") {
        window.history.replaceState({}, document.title, window.location.href);
      }
      return;
    }

    if (data.topicId) {
      topicId = data.topicId;
      window.location.replace(window.location.pathname + "#" + topicId);
      if (typeof window.history.pushState == "function") {
        window.history.replaceState({}, document.title, window.location.href);
      }
    }

    $(function ($) {
      $.validator.setDefaults({
        debug: false,
        ignore: "",
        onkeyup: false,
        onfocusout: false
      });
      __init();
      __initListListener();
      __initTop(data.topicData);
      __initBand();
      __initMenu();
      __initSort();
      __initItems(data.itemsData);
    });
  };

  /**
   * 入口函数，必须要从服务器验证或获取topicId才能编辑总结
   */
  (function getTopicId() {
    console.log('getTopicId');

    if (location.pathname != '/topic/create') {
      topicId = location.pathname.match(/^\/topic\/([0-9a-f]{24})\/edit$/)[1];
      console.log('topicId=' + topicId);

      _doIfGetIdDone();
    } else {
      console.log('/topic/create');

      (function createTopic() {
        //#后面有16进制数字就验证id并获取items，否则获取新id
        var jqXHR;
        if (location.hash
          && !isNaN(parseInt(location.hash.substr(1), 16))) {
          topicId = location.hash.substr(1);
          jqXHR = $.getJSON('/topic/contents', {
            topicId: topicId
          });
        } else {
          jqXHR = $.ajax('/topic/create', {
            type: 'POST',
            dataType: 'json'
          });
        }
        jqXHR
          .done(_doIfGetIdDone)
          .fail(function (jqXHR) {
            if (jqXHR.status == 500
              && confirm('初始化总结失败：\n重试请按“确定”，忽略请按“取消”。')) {
              createTopic();
            }
          });
      })();
    }
  })();

})(jQuery);