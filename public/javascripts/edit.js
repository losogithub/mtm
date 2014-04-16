/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/3/13
 * Time: 11:26 PM
 * To change this template use File | Settings | File Templates.
 */

(function ($) {

  window.sng.controller('TagsInputCtrl', TagsInputCtrl);
  function TagsInputCtrl($scope, $http) {
    $scope.onAdded = function ($tag) {
      $http.put('/tag', angular.extend({ topicId: topicId }, $tag));
    };
    $scope.onRemoved = function ($tag) {
      $http.post('/tag', angular.extend({ topicId: topicId }, $tag));
    };
  }

  var console = window.console || {log: $.noop, error: $.noop};

  var INPUT_EVENTS = 'input blur mousedown mouseup keydown keypress keyup';

  function fillVideo($li, url, cover) {
    console.log(cover);
    var quote = shizier.utils.getQuote(url, 'VIDEO');

    //填充视频
    $li
      .find('.Player')
      .remove()
      .end()
      .find('.Cover')
      .show()
      .css('background-image', !cover ? '' : 'url(' + cover + ')')
      .end()
      .find('.Quote a')
      .text(quote ? quote : url)
      .end();
  }

  function fillWeibo($li, options) {
    $li
      .find('.Avatar img')
      .attr('src', options.user.profile_image_url)
      .end()
      .find('.AuthorUrl')
      .attr('href', 'http://weibo.com/' + options.user.profile_url)
      .end()
      .find('.ScreenName')
      .text(options.user.screen_name)
      .end()
      .find('.Verify')
      .addClass(!options.user.verified ? '' : options.user.verified_type ? 'ORG' : 'PERSONAL')
      .end()
      .find('.Text')
      .html(options.parsed_text)
      .end()
      .find('.Time')
      .attr('href', 'http://weibo.com/' + options.user.idstr + '/' + options.mid62)
      .text(options.time)
      .end()
      .find('.Forward')
      .attr('href', 'http://weibo.com/' + options.user.idstr + '/' + options.mid62 + '?type=repost')
      .end()
      .find('.Comment')
      .attr('href', 'http://weibo.com/' + options.user.idstr + '/' + options.mid62)
      .end();

    var $pic = $li.find('.Pic');
    $pic.html('');
    var $image = $templates.find('>.WeiboImage');
    if (options.pic_urls && options.pic_urls.length) {
      $pic.show();
      if (options.pic_urls.length == 4) {
        $pic.css('width', '170px');
      }
      if (options.pic_urls.length == 1) {
        if (options.pic_urls[0]) {
          $image
            .clone(true)
            .appendTo($pic)
            .attr('href', options.pic_urls[0].thumbnail_pic.replace('/thumbnail/', '/large/'))
            .find('img')
            .attr('src', options.pic_urls[0].thumbnail_pic);
        }
      } else {
        for (var i = 0; i < options.pic_urls.length; i++) {
          if (options.pic_urls[i]) {
            $image
              .clone(true)
              .appendTo($pic)
              .attr('href', options.pic_urls[i].thumbnail_pic.replace('/thumbnail/', '/large/'))
              .find('img')
              .attr('src', options.pic_urls[i].thumbnail_pic.replace('/thumbnail/', '/square/'));
          }
        }
      }
    }

    $li.find('>.Retweeted').remove();
    if (options.retweeted_status && options.retweeted_status.idstr) {
      fillWeibo($templates.find('>.Retweeted').clone(true).insertAfter($li.find('.Pic')), options.retweeted_status);
    }
  }

  $.fn.extend({
    fadeSlideDown: function (callback, widget) {
      return this
        //防止slideDown动画期间获取焦点时的滚动
        .on('scroll.slide', function () {
          $(this).scrollTop(0);
        })
        .hide()
        .css({ 'opacity': 0 })
        .animate({
          'opacity': 0.5,
          height: 'toggle'
        }, 100, function () {
          if (widget) {
            widget.autoFocus();
          }
        })
        .fadeTo(100, 1, function () {
          $(this).off('scroll.slide');
          if ($.isFunction(callback)) {
            callback.call(this);
          }
        });
    },

    hiddenSlideUp: function (callback) {
      return this
        .addClass('noTransition')
        .css('visibility', 'hidden')
        .slideUp(100, function () {
          $(this)
            .css('visibility', 'visible')
            .removeClass('noTransition');
          if ($.isFunction(callback)) {
            callback.call(this);
          }
        });
    }
  });

  function updateList($li) {
    var _id = $li.data('options')._id;
    //拖动的item是editWidget，不用重排
    if (!_id) {
      return;
    }
    //拖动的item放在了editWidget下面，用
    var prevItem = $li.prev();
    var prevItemType;
    var prevItemId;
    var options = prevItem.data('options');
    if (options) {
      prevItemType = options.type;
      prevItemId = options._id;
    }
    options = prevItem.prev().data('options');
    if (!prevItemId && options) {
      prevItemType = options.type;
      prevItemId = options._id;
    }
    //拖动改变了列表顺序，通知服务器将item插入他前一个item的后面
    $.ajax('/topic/sort', {
      type: 'PUT',
      data: {
        topicId: topicId,
        type: $li.data('options').type,
        _id: _id,
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

    _create: function () {
      console.log('_create');
      var self = this;

      this.widget()
        .data('options', this.options.options)
        .addClass('Editing')
        .prepend($templates.find('.Widget:first').clone(true))
        .find('.Widget')
        .prepend($templates.find('.Widget .' + this.type))
        .end()
        //更改保存按钮类型以实现回车提交表单的功能
        .find('button[name="save"]')
        .attr('type', 'submit')
        .end()
        //textarea自适应高度
        .find('textarea')
        .css('resize', 'none')
        .autosize()
        .end();

      this.widget().find('button').button('reset');
      this.widget().find('input').val('');

      this.__create();

      this.widget()
        //textarea赋值后触发resize事件
        .find('textarea')
        .trigger('autosize.resize')
        .end()
        .fadeSlideDown(null, this);

      this.__initFormValidation();
    },

    __create: $.noop,
    __initFormValidation: $.noop,

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
      var self = this;

      if (this.xhr) {
        console.log('abort');
        this.xhr.abort();
      }
      this.disable();
      //如果是新建的就删除dom元素，否则是修改就新建条目dom元素
      this.widget().hiddenSlideUp(function () {
        $(this)
          .find('.Widget .' + self.type)
          .prependTo($templates.find('div.Widget'))
          .end();
        $(this).remove();
      });
      if (this.options._id) {
        this.widget().removeClass('Editing');
        createItem(this.widget().prev(), this._getOriginalData());
      }
      setState('default');
    },

    _getOriginalData: function () {
      return this.options.options;
    },

    /**
     * 保存修改验证表格通过后的发送新文本到服务器
     */
    commit: function () {
      if (xhr) {
        console.log('abort');
        xhr.abort();
      }
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
          $(this)
            .find('.Widget .' + self.type)
            .prependTo($templates.find('div.Widget'))
            .end();
          $(this).remove();
        });
        createItem(self.widget().prev(), data);
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
      var data = this.getCommitData();
      var xhr;
      if (this.options._id) {
        xhr = $.ajax('/topic/item', {
          type: 'PUT',
          data: $.extend({}, data, {
            topicId: topicId
          })
        })
          .done(doneCallback)
          .fail(fail);
      } else {
        var options = this.widget().prev().data('options');
        var prevItemType = options && options.type;
        var prevItemId = options && options._id;
        xhr = $.post('/topic/item', $.extend({}, data, {
            topicId: topicId,
            prevItemType: prevItemType,
            prevItemId: prevItemId
          }))
          .done(doneCallback)
          .fail(fail);
      }
      return xhr;
    },

    preview: $.noop,

    getCommitData: function () {
      return $.extend({}, this.options.options, this._getCommitData());
    },
    _getCommitData: $.noop,

    checkState: function () {
      if (this.options.disabled) {
        return;
      }
      if (!this.options._id
        && (this.type == 'LINK'
        || this.type == 'IMAGE'
        || this.type == 'VIDEO'
        || this.type == 'WEIBO')) {
        return;
      }
      var originalData = this._getOriginalData();
      var commitData = this.getCommitData();
      for (var key in commitData) {
        if (typeof originalData[key] !== 'object'
          && originalData[key] != commitData[key]
          && (originalData[key] || commitData[key])) {
          return setState('edit');
        }
      }
      return setState('create');
    }

  });

  $.widget('shizier.edit_createWidget', $.shizier.editWidget, {

    /**
     * 子类的构造函数
     * @private
     */
    _create: function () {
      var self = this;

      this._super();

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
          if (!shizier.utils.getQuote(self.widget().find('input').val(), self.type.replace('_CREATE', ''))) {
            alertMessenger('暂不支持该网站');
            return;
          }
          self.commit();
        },
        showErrors: function (errorMap, errorList) {
          if (errorList.length) {
            alertMessenger(errorMap.url);
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

      return $.getJSON('/topic/' + this.type.toLowerCase().replace('_create', '_detail'), this.getCommitData())
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

    createPreviewWidget: function (data) {
      createWidget($.extend({}, data, {type: data.type.replace('_CREATE', '')}), this.widget().prev(), this.widget());
      setState('edit');
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
   * 定义微件：链接微件
   */
  $.widget('shizier.linkWidget', $.shizier.editWidget, {

    type: 'LINK',
    defaultImgSrc: '/images/no_img/photo_150x150.png',
    noImgSrc: '/images/no_img/default_120x120.png',
    index: -1,

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;
      var $label = self.widget().find('.checkbox');
      var $checkbox = self.widget().find(':checkbox');

      $checkbox.checkbox();
      $checkbox.on('toggle', function () {
        console.log('haha');
        if ($label.is('.checked')) {
          self.widget()
            .find('.Image img')
            .attr('src', self.defaultImgSrc)
            .end();
        } else {
          _increaseIndex(0);
        }
      });

      var _increaseIndex = function (increment) {
        $checkbox.checkbox('uncheck');

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
          .attr('src', (!self.options.srcs || !self.options.srcs.length) ? self.defaultImgSrc : self.options.srcs[self.index])
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
      var scope;
      scope = angular.element(this.widget().find('input[name="title"]').closest('.form-group')).scope();
      scope.input = this.options.title;
      scope.$apply();
      scope = angular.element(this.widget().find('textarea[name="snippet"]').closest('.form-group')).scope();
      scope.input = this.options.snippet;
      scope.$apply();
      scope = angular.element(this.widget().find('textarea[name="description"]').closest('.form-group')).scope();
      scope.input = this.options.description;
      scope.$apply();
      this.widget()
        .find('.LINK_URL')
        .attr('href', this.options.url)
        .end()
        .find('.Quote a')
        .text(this.options.url)
        .end()
        .find('input[name="title"]')
        .on(INPUT_EVENTS, function () {
          self.checkState();
        })
        .end()
        .find('textarea[name="snippet"]')
        .on(INPUT_EVENTS, function () {
          self.checkState();
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
        .find('.Thumb input.Url')
        .keypress(function (event) {
          if (event.keyCode != 13) {
            return;
          }
          self.widget().find('.Thumb button[name="customize"]').click();
          return false;
        })
        .end()
        .find('.Thumb button[name="customize"]')
        .click(function () {
          _prependSrc(shizier.utils.suffixImage(self.widget().find('.Thumb input.Url').val()));
        })
        .end()
        .find('textarea[name="description"]')
        .on(INPUT_EVENTS, function () {
          self.checkState();
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
            alertMessenger(errorMap.title || errorMap.snippet || errorMap.description);
          }
        },
        rules: {
          title: {
            maxlength: 50,
            required: false
          },
          snippet: {
            maxlength: 140,
            required: false
          },
          description: {
            maxlength: 140,
            required: false
          }
        },
        messages: {
          title: {
            maxlength: '标题太长，请缩写到50字以内。'
          },
          snippet: {
            maxlength: '摘要太长，请缩写到140字以内。'
          },
          description: {
            maxlength: '评论太长，请缩写到140字以内。'
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
        title: this.widget().find('input[name="title"]').val(),
        snippet: this.widget().find('textarea[name="snippet"]').val(),
        src: (src == this.defaultImgSrc || src == this.noImgSrc) ? '' : src,
        description: this.widget().find('textarea[name="description"]').val()
      }
    }

  });

  /*
   * 定义微件：链接创建微件
   */
  $.widget('shizier.link_createWidget', $.shizier.edit_createWidget, {

    type: 'LINK_CREATE'

  });

  /*
   * 定义微件：图片编辑微件
   */
  $.widget('shizier.imageWidget', $.shizier.editWidget, {

    type: 'IMAGE',

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      //填充图片、填充文本
      var scope;
      scope = angular.element(this.widget().find('input[name="title"]').closest('.form-group')).scope();
      scope.input = this.options.title;
      scope.$apply();
      scope = angular.element(this.widget().find('input[name="quote"]').closest('.form-group')).scope();
      scope.input = this.options.quote;
      scope.$apply();
      scope = angular.element(this.widget().find('textarea[name="description"]').closest('.form-group')).scope();
      scope.input = this.options.description;
      scope.$apply();
      this.widget()
        .find('img')
        .attr('src', this.options.url)
        .end()
        .find('input[name="title"]')
        .on(INPUT_EVENTS, function () {
          self.checkState();
        })
        .end()
        .find('input[name="quote"]')
        .on(INPUT_EVENTS, function () {
          self.checkState();
        })
        .end()
        .find('textarea[name="description"]')
        .on(INPUT_EVENTS, function () {
          self.checkState();
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
            alertMessenger(errorMap.title || errorMap.quote || errorMap.description);
          }
        },
        rules: {
          title: {
            maxlength: 50,
            required: false
          },
          quote: {
            url: true,
            required: false
          },
          description: {
            maxlength: 140,
            required: false
          }
        },
        messages: {
          title: {
            maxlength: '标题太长，请缩写到50字以内。'
          },
          quote: {
            url: 'URL格式错误。'
          },
          description: {
            maxlength: '介绍、评论太长，请缩写到140字以内。'
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
        title: this.widget().find('input[name="title"]').val(),
        quote: this.widget().find('input[name="quote"]').val(),
        description: this.widget().find('textarea[name="description"]').val()
      }
    }

  });

  /*
   * 定义微件：图片创建微件
   */
  $.widget('shizier.image_createWidget', $.shizier.edit_createWidget, {

    type: 'IMAGE_CREATE',

    preview: function () {
      this.createPreviewWidget(this.getCommitData());
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

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      fillVideo(this.widget(), this.options.url, this.options.cover);

      //填充文本
      var scope;
      scope = angular.element(this.widget().find('input[name="title"]').closest('.form-group')).scope();
      scope.input = this.options.title;
      scope.$apply();
      scope = angular.element(this.widget().find('textarea[name="description"]').closest('.form-group')).scope();
      scope.input = this.options.description;
      scope.$apply();
      this.widget()
        .find('.VIDEO_URL')
        .attr('href', this.options.url)
        .end()
        .find('input[name="title"]')
        .on(INPUT_EVENTS, function () {
          self.checkState();
        })
        .end()
        .find('textarea[name="description"]')
        .on(INPUT_EVENTS, function () {
          self.checkState();
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
            alertMessenger(errorMap.title || errorMap.description);
          }
        },
        rules: {
          title: {
            maxlength: 50,
            required: false
          },
          description: {
            maxlength: 140,
            required: false
          }
        },
        messages: {
          title: {
            maxlength: '标题太长，请缩写到50字以内。'
          },
          description: {
            maxlength: '介绍、评论太长，请缩写到140字以内。'
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
        title: this.widget().find('input[name="title"]').val(),
        description: this.widget().find('textarea[name="description"]').val()
      }
    }

  });

  /*
   * 定义微件：视频创建微件
   */
  $.widget('shizier.video_createWidget', $.shizier.edit_createWidget, {

    type: 'VIDEO_CREATE'

  });

  /*
   * 定义微件：引用微件
   */
  $.widget('shizier.citeWidget', $.shizier.editWidget, {

    type: 'CITE',

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      //填充文本
      var scope;
      scope = angular.element(this.widget().find('textarea[name="cite"]').closest('.form-group')).scope();
      scope.input = this.options.cite;
      scope.$apply();
      scope = angular.element(this.widget().find('input[name="title"]').closest('.form-group')).scope();
      scope.input = this.options.title;
      scope.$apply();
      scope = angular.element(this.widget().find('textarea[name="description"]').closest('.form-group')).scope();
      scope.input = this.options.description;
      scope.$apply();
      this.widget()
        .find('textarea[name="cite"]')
        .on(INPUT_EVENTS, function () {
          self.checkState();
        })
        .end()
        .find('input[name="url"]')
        .val(this.options.url)
        .on(INPUT_EVENTS, function () {
          self.checkState();
        })
        .end()
        .find('input[name="title"]')
        .on(INPUT_EVENTS, function () {
          self.checkState();
        })
        .end()
        .find('textarea[name="description"]')
        .on(INPUT_EVENTS, function () {
          self.checkState();
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
            alertMessenger(errorMap.cite || errorMap.url || errorMap.title || errorMap.description);
          }
        },
        rules: {
          cite: {
            required: true,
            maxlength: 140
          },
          url: {
            required: false,
            url: true
          },
          title: {
            required: false,
            maxlength: 50
          },
          description: {
            required: false,
            maxlength: 140
          }
        },
        messages: {
          cite: {
            required: "尚未输入引文。",
            maxlength: "引文太长，请缩写到140字以内。"
          },
          url: {
            url: 'URL格式错误。'
          },
          title: {
            maxlength: "网页标题太长，请缩写到50字以内。"
          },
          description: {
            maxlength: "介绍、评论太长，请缩写到140字以内。"
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
    }

  });

  /*
   * 定义微件：weibo创建微件
   */
  $.widget('shizier.weibo_createWidget', $.shizier.edit_createWidget, {

    type: 'WEIBO_CREATE'

  });

  /*
   * 定义微件：weibo微件
   */
  $.widget('shizier.weiboWidget', $.shizier.editWidget, {

    type: 'WEIBO',

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      fillWeibo(this.widget().find('.Content'), this.options);

      //填充文本
      var scope;
      scope = angular.element(this.widget().find('textarea[name="description"]').closest('.form-group')).scope();
      scope.input = this.options.description;
      scope.$apply();
      this.widget()
        .find('textarea[name="description"]')
        .on(INPUT_EVENTS, function () {
          self.checkState();
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
            alertMessenger(errorMap.description);
          }
        },
        rules: {
          description: {
            maxlength: 140,
            required: false
          }
        },
        messages: {
          description: {
            maxlength: '介绍、评论太长，请缩写到140字以内。'
          }
        }
      });
    },

    /**
     * 子类提交给服务器的数据
     * @private
     */
    _getCommitData: function () {
      return {description: this.widget().find('textarea[name="description"]').val()};
    }

  });

  /*
   * 定义微件：文本编辑微件
   */
  $.widget('shizier.textWidget', $.shizier.editWidget, {

    type: 'TEXT',

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      //填充文本、监听文本改变事件
      var scope;
      scope = angular.element(this.widget().find('textarea[name="text"]').closest('.form-group')).scope();
      scope.input = this.options.text;
      scope.$apply();
      this.widget()
        .find('textarea[name="text"]')
        .val(this.options.text)
        .on(INPUT_EVENTS, function () {
          self.checkState();
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
            alertMessenger(errorMap.text);
          }
        },
        rules: {
          text: {
            required: true,
            maxlength: 140
          }
        },
        messages: {
          text: {
            required: "尚未输入文本。",
            maxlength: "文本太长，请缩写到140字以内。"
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
    }

  });

  /*
   * 定义微件：TITLE编辑widget
   */
  $.widget('shizier.titleWidget', $.shizier.editWidget, {

    type: 'TITLE',

    /**
     * 子类的构造函数
     * @private
     */
    __create: function () {
      var self = this;

      //填充文本、监听文本改变事件
      var scope;
      scope = angular.element(this.widget().find('input[name="title"]').closest('.form-group')).scope();
      scope.input = this.options.title;
      scope.$apply();
      this.widget()
        .find('input[name="title"]')
        .on(INPUT_EVENTS, function () {
          self.checkState();
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
            alertMessenger(errorMap.title);
          }
        },
        rules: {
          title: {
            required: true,
            maxlength: 50
          }
        },
        messages: {
          title: {
            required: "尚未输入标题。",
            maxlength: "标题太长，请缩写到50字以内。"
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
    }

  });

  //数据库中该策展id
  var topicId;
  var state = 'default';
  var topState = 'default';
  var $editingWidget;

  var $band;
  var $band_asterisk;
  var $band_saved;
  var $band_error;
  var $band_loading;
  var $_topItem;
  var $_topWidget;
  var $ul;
  var $templates;

  var fail;
  var savedOnce;
  var xhr;

  function retryMessenger() {
    alertMessenger('操作失败，请重试');
  }

  function alertMessenger(msg) {
    Messenger().post({
      message: msg,
      type: 'error'
    });
    $(document).one('mousedown keydown', function () {
      Messenger().hideAll();
    });
  }

  function onStateChange() {
    $band_asterisk.hide();
    $band_saved.hide();
    if (fail) {
      $band_asterisk.show();
      $band_error.show();
      $('body').attr('onbeforeunload', '');
    } else if (state == 'edit' || topState == 'edit') {
      $band_asterisk.show();
      $('body').attr('onbeforeunload', 'return "您有尚未保存的内容";');
    } else {
      if (savedOnce) {
        $band_saved.show();
      }
      $('body').attr('onbeforeunload', '');
    }
  }

  function notifyFail() {
    fail = true;
    onStateChange();
  }

  function setTopState(newState) {
    console.log(newState);
    topState = newState;
    onStateChange();
  }

  function setState(newState) {
    console.log(newState);
    state = newState;
    onStateChange();
  }

  function _checkRemoveWidget() {
    //编辑中的微件处在已修改状态
    if (state == 'edit'
      && !confirm('您有正在编辑的内容，确定要放弃编辑中的内容吗？')) {
      return false;
    }
    //删除编辑中的微件
    if (state != 'default') {
      $editingWidget[$editingWidget.data('options').type.toLowerCase() + 'Widget']('remove');
    }
    return true;
  }

  /**
   * 创建一个编辑微件
   * @param type
   * @param options
   * @private
   */
  function createWidget(options, $prevItem, $li) {
    console.log('createWidget');

    var type = options.type;
    if (!type) {
      return;
    }

    if (topState == 'edit'
      && !confirm('您有正在编辑的内容，确定要放弃编辑中的内容吗？')) {
      return;
    }
    if (topState != 'default') {
      __remove();
    }

    var oldState = state;

    if (!_checkRemoveWidget()) {
      return;
    }

    //编辑中的微件和目标微件:类型相同、来源相同，删了可以直接返回了
    if (oldState == 'create'
      && $editingWidget.data('options').type == type
      && !$li
      && !$editingWidget.data('options')._id
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
    if ($prevItem.length) {
      $prevItem.after($widget);
    } else {
      $ul.prepend($widget);
    }

    //根据类型选择微件，并保存调用微件方法的函数
    setState('create');
    $editingWidget = $widget;
    $widget[type.toLowerCase() + 'Widget']($.extend({}, options, {options: options}));
    console.log('createWidget ' + type);
  }

  /**
   * 创建条目
   */
  function createItem($prevItem, options) {
    console.log('createItem');

    var type = options.type;
    var $item = $templates.find('>ul>li').clone();
    //如果指定了前趋条目就插入其后面，否则插入最前
    if ($prevItem && $prevItem[0]) {
      $prevItem.after($item);
    } else {
      $ul.prepend($item);
    }

    //填充新内容，然后删除旧内容，顺序很重要！！！防止抖动
    $item
      .data('options', options)
      .prepend($templates.find('.Item:first').clone())
      .find('.Item')
      .prepend($templates.find('.Item .' + type).clone())
      .end();

    switch (type) {
      case 'LINK':
        //填充链接信息
        var url = options.url;
        var title = options.title;
        var snippet = options.snippet;
        var src = options.src;
        var description = options.description;

        $item
          .find('.LINK_URL')
          .attr('href', url)
          .end()
          .find('.Fav')
          .attr('src', shizier.utils.getFav(url))
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
        var url = options.url;
        var title = options.title;
        var quote = options.quote;
        var quoteDomain = shizier.utils.getQuote(quote);
        var description = options.description;
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
        var url = options.url;
        var vid = options.vid;
        var cover = options.cover;
        var title = options.title;
        var description = options.description;

        fillVideo($item, url, cover);

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
        var cite = options.cite;
        var url = options.url;
        var title = options.title;
        var description = options.description;
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
      case 'WEIBO':
        //填充视频信息
        var description = options.description;

        fillWeibo($item, options);

        $item
          .find('.Description')
          .html($('<div/>').text(description).html().replace(/\n/g, '<br>'))
          .end();
        if (!description) {
          $item.find('.Description').hide();
        }
        break;
      case 'TEXT':
        //填充文本
        var text = options.text;
        $item
          .find('.Content')
          .html($('<div/>').text(text).html().replace(/\n/g, '<br>'))
          .end();
        break;
      case 'TITLE':
        //填充标题
        var title = options.title;
        $item
          .find('.Content')
          .text(title)
          .end();
        break;
    }

    $item.fadeSlideDown();

    return $item;
  }

  var $cover;
  var $title;

  function _init() {
    $._messengerDefaults = {
      extraClasses: 'messenger-fixed messenger-on-bottom messenger-on-right',
      theme: 'flat'
    }

    topicId = location.pathname.match(/^\/topic\/([0-9a-f]{24})\/edit$/)[1];
    $band = $('.Band');
    $band_asterisk = $band.find('#_asterisk');
    $band_saved = $band.find('#_saved');
    $band_error = $band.find('#_error');
    $band_loading = $band.find('#_loading');
    $cover = $('.HeadThumb');
    $title = $('.HeadTtl');
    $_topItem = $('#_topItem');
    $_topWidget = $('#_topWidget');
    $ul = $('.WidgetItemList');
    $templates = $('.TEMPLATES');
  }

  function _initListListener() {
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
        $li[$editingWidget.data('options').type.toLowerCase() + 'Widget']('remove');
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
            type: $li.data('options').type,
            _id: $li.data('options')._id
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
        var data = $li.data('options');
        createWidget(data, $li.prev(), $li);
      })
  }

  /**
   * 监听按钮点击事件
   * @private
   */
  function _initBand() {
    $(document)
      .ajaxStart(function () {
        $band_saved.hide();
        $band_loading.show();
      })
      .ajaxStop(function () {
        onStateChange();
        $band_loading.hide();
      });

    var $done = $band.find('a[name="done"]');
    if ($done.attr('href') == '/works'
      && ~document.referrer.indexOf('/works?')) {
      $done.attr('href', document.referrer);
    }

    var $publish = $band.find('button[name="publish"]');
    $publish.click(function () {
      if (topState == 'edit'
        && !confirm('您有正在编辑的内容，确定要放弃编辑中的内容吗？')) {
        return;
      }
      if (topState != 'default') {
        __remove();
      }
      if (!_checkRemoveWidget()) {
        return;
      }
      console.log($title.text());
      if (!$title.text()) {
        if ($_topItem.is(':visible')) {
          $_topWidget.finish();
          $_topItem.finish().find('button[name="edit"]').click();
        }
        return alertMessenger('填写标题后才能发布');
      }

      $publish.button('loading');
      $.ajax('/topic/publish', {
        type: 'PUT',
        data: {
          topicId: topicId
        }
      })
        .done(function () {
          window.location = '/topic/' + topicId;
        })
        .fail(function (jqXHR, textStatus) {
          $publish.button('reset');//成功的话跳转可能要几秒时间，所以只有失败才reset
          console.error(jqXHR.responseText);
          console.error(textStatus);
          if (textStatus != 'abort') {
            retryMessenger();
          }
        });
    });
  }

  var oldCover;

  function __remove() {
    if (xhr) {
      console.log('abort');
      xhr.abort();
    }
    $cover.attr('src', oldCover);
    $_topItem.after($_topWidget);
    $_topWidget.hiddenSlideUp();
    $_topItem.fadeSlideDown();
    setTopState('default');
  }

  /**
   * 初始化策展标题，策展描述
   * @private
   */
  function _initTop() {
    var defaultImgSrc = '';//'/images/no_img/photo_95x95.png';
    var noImgSrc = '/images/no_img/default_120x120.png';
    var $titleInput = $_topWidget.find('input[name="title"]');
    var $description = $_topWidget.find('textarea[name="description"]');
    var title = $title.text();
    var coverUrl = $cover.attr('src');
    var description = $_topItem.find('.HeadDesc').text();

    var checkState = function () {
      if ($_topWidget.is(':hidden')) {
        return;
      }
      if (($cover.attr('src') == coverUrl || ($cover.attr('src') == defaultImgSrc && !coverUrl))
        && $titleInput.val() == title
        && $description.val() == description) {
        setTopState('create');
      } else {
        setTopState('edit');
      }
    };
    $titleInput.add($description).on(INPUT_EVENTS, checkState);

    $_topWidget
      .find('button[name="save"]')
      .attr('type', 'submit')
      .end()
      .find('textarea')
      .css('resize', 'none')
      .autosize();

    $_topItem.find('button[name="edit"]').click(function () {
      if (!_checkRemoveWidget()) {
        return;
      }
      title = $title.first().text();
      coverUrl = $cover.attr('src');
      description = $_topItem.find('.HeadDesc').text();

      $_topWidget.after($_topItem).show();

      $titleInput.val(title);
      $cover.attr('src', coverUrl || defaultImgSrc);
      $description.val(description);

      $_topItem.hiddenSlideUp();
      $_topWidget
        .find('textarea')
        .trigger('autosize.resize')
        .end()
        .fadeSlideDown();

      $titleInput.focus();
      //移动光标到输入框末尾
      moveSelection2End($titleInput[0]);

      oldCover = coverUrl || defaultImgSrc;

      setTopState('create');
    });
    if (!title && !$ul.children().length) {
      $_topItem.find('button[name="edit"]').click();
    }
    $_topWidget.find('button[name="cancel"]')
      .click(function () {
        if (topState == 'edit'
          && !confirm('您编辑的内容将被丢弃，确定要放弃吗？')) {
          return;
        }
        __remove();
      });

    var commit = function () {
      var coverUrl = $cover.attr('src');
      var $button = $_topWidget.find('button[name="save"]');
      $button.button('loading');

      xhr = $.ajax('/topic/save', {
        type: 'PUT',
        data: {
          topicId: topicId,
          title: $titleInput.val(),
          coverUrl: (coverUrl == noImgSrc || coverUrl == defaultImgSrc) ? '' : coverUrl,
          description: $description.val()
        }
      })
        .done(function (data) {
          savedOnce = true;
          $title.text(data.title);
          oldCover = data.coverUrl || defaultImgSrc;
          $_topItem.find('.HeadDesc').text(data.description || '');
          __remove();
        })
        .fail(function (jqXHR, textStatus) {
          console.error(jqXHR.responseText);
          console.error(textStatus);
          if (textStatus != 'abort') {
            retryMessenger();
          }
        })
        .always(function () {
          $button.button('reset');
        });
    }

    $_topWidget.validate({
      submitHandler: function () {
        commit();
      },
      showErrors: function (errorMap, errorList) {
        if (errorList.length) {
          alertMessenger(errorMap.title || errorMap.description);
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
          maxlength: 140
        }
      },
      messages: {
        title: {
          required: "请输入5～50字的策展标题。",
          minlength: "策展标题太短，请控制在5～50字之间。",
          maxlength: "策展标题太长，请控制在5～50字之间。"
        },
        description: {
          maxlength: "策展描述太长，请缩写到140字以内。"
        }
      }
    });

    //封面设置
    var $input = $_topWidget.find('input[name="url"]');
    var $preview = $_topWidget.find('button[name="preview"]');
    var $reset = $_topWidget.find('button[name="reset"]');
    $input.keypress(function (event) {
      if (event.keyCode != 13) {
        return;
      }
      $preview.click();
      return false;
    });
    $preview.click(function () {
      var newCover = shizier.utils.suffixImage($input.val());
      $cover.attr('src', newCover || defaultImgSrc);
      checkState();
    });
    $reset.click(function () {
      $cover.attr('src', coverUrl || defaultImgSrc);
      checkState();
    });
  }

  /**
   * 启用列表排序微件
   */
  function _initSort() {
    $ul
      //防止拖动开始时高度减小导致的抖动
      .mousedown(function (e) {
        $(this).css('min-height', $(this).outerHeight());
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
        helper: "clone",//加这个是为了解决拖动后添加条目util的index问题
        scrollSensitivity: 100,
        scrollSpeed: 10,
        axis: 'y',
        containment: 'body',

        start: function () {
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
          $(this)
            .removeClass('WidgetItemList-Sorting')
            .off('mousemove');
        },

        //列表顺序改变后的回调函数
        update: function (event, data) {
          updateList(data.item);
        }
      });
  }

  /**
   * 初始化条目创建菜单的点击响应
   * @private
   */
  function _initMenu() {
    $('.Contents').on('click', '.Menu li>button', function () {
      var $li = $(this).closest('.WidgetItemList>li');
      createWidget({type: $(this).data('type')}, $li);
    });
  }

  $(function ($) {
    $.validator.setDefaults({
      debug: false,
      ignore: "",
      onkeyup: false,
      onfocusout: false
    });
    _init();
    _initListListener();
    _initBand();
    _initTop();
    _initMenu();
    _initSort();
  });

})(jQuery);