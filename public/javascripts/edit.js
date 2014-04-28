/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/3/13
 * Time: 11:26 PM
 * To change this template use File | Settings | File Templates.
 */

(function ($) {

  $.validator.setDefaults({
    debug: false,
    ignore: "",
    onkeyup: false,
    onfocusout: false
  });

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

  function _commonListCtrl($scope, $sce, $timeout) {
    $scope.SuffixImage = function (url) {
      return shizier.utils.suffixImage(url);
    }
    $scope.onFavError = function (item) {
      var temp = 'http://www.google.com/s2/favicons?domain=' + item.url;
      if (temp != item.fav) {
        item.fav = temp;
      }
    };
    $scope.playVideo = function (item) {
      item.playing = true;
      $timeout(function () {
        item.show = true;
      });
      item.width = $('.WidgetItemList-Main .Content.VIDEO').width();
      item.height = item.width * 4 / 5;
    };
    $scope.getVideoSrc = function (item) {
      return $sce.trustAsResourceUrl(shizier.getVideoSrc(item.quote, item.vid).src);
    };
    $scope.getVideoVars = function (item) {
      return shizier.getVideoSrc(item.quote, item.vid).vars;
    };
    $scope.getHtml = function (text) {
      return $sce.trustAsHtml(text && shizier.utils.escape(text).replace(/\n/g, "<br>") || '');
    };
    $scope.getWeiboHtml = function (text) {
      return $sce.trustAsHtml(text);
    };
    $scope.cancelEdit = function (force) {
      if(!force
        && $scope.editingScope
        && $scope.editingScope.form.$dirty
        && !confirm('您编辑的内容将被丢弃，确定要放弃吗？')) {
        return true;
      }
      if ($scope.editingScope
        && !$scope.editingScope.item._id) {
        $scope.items.splice($scope.items.indexOf($scope.editingScope.item), 1);
      }
      if ($scope.xhr) {
        $scope.xhr.abort();
      }
      $scope.editingId = undefined;
      $scope.editingScope = null;
    };
    $scope.editItem = function (_id) {
      if ($scope.cancelEdit()) {
        return;
      }
      $scope.editingId = _id;
    };
    $scope.createItem = function (item, type) {
      if ($scope.editingScope
        && $scope.editingScope.$index == $scope.items.indexOf(item) + 1
        && $scope.editingScope.item.type == type
        && !$scope.editingScope.item._id
        && !$scope.editingScope.form.$dirty) {
        $scope.cancelEdit();
        return;
      }
      if ($scope.cancelEdit()) {
        return;
      }
      $scope.items.splice($scope.items.indexOf(item) + 1, 0, { type: type });
    }
    $scope.setEditingScope = function (scope) {
      $scope.editingScope = scope;
    };
  }

  window.sng.controller('TopicCtrl', TopicCtrl);
  function TopicCtrl($scope, $sce, $timeout, $element) {
    _commonListCtrl($scope, $sce, $timeout);
    $scope.init = function () {
      if (!$scope.topic.title) {
        $scope.editTitle();
      }
      $(document).ajaxStart(function() {
        $scope.XHRing = true;
        $timeout(function () {
          $scope.$apply();
        })
      });
      $(document).ajaxStop(function() {
        $scope.XHRing = false;
        $scope.xhr = null;
        $timeout(function () {
          $scope.$apply();
        })
      });
      var $done = $element.find('a[name="done"]');
      if ($done.attr('href') == '/works'
        && ~document.referrer.indexOf('/works?')) {
        $done.attr('href', document.referrer);
      }
    };
    $scope.setFail = function () {
      $scope.fail = true;
    };
    $scope.setXHR = function (xhr) {
      $scope.xhr = xhr;
    };
    $scope.isXHR = function () {
      return $scope.XHRing;
    };
    $scope.isDirty = function () {
      var dirty = ($scope.coverScope && $scope.coverScope.form.$dirty)
        || ($scope.titleScope && $scope.titleScope.form.$dirty)
        || ($scope.editingScope && $scope.editingScope.form.$dirty);
      if (dirty) {
        $('body').attr('onbeforeunload', 'return "您有尚未保存的内容";');
      } else {
        $('body').attr('onbeforeunload', '');
      }
      return dirty;
    };
    $scope.cancelEdit = function (force) {
      if(!force
        && $scope.coverScope
        && $scope.coverScope.form.$dirty
        && !confirm('您编辑的内容将被丢弃，确定要放弃吗？')) {
        return true;
      }
      if(!force
        && $scope.titleScope
        && $scope.titleScope.form.$dirty
        && !confirm('您编辑的内容将被丢弃，确定要放弃吗？')) {
        return true;
      }
      if(!force
        && $scope.editingScope
        && $scope.editingScope.form.$dirty
        && !confirm('您编辑的内容将被丢弃，确定要放弃吗？')) {
        return true;
      }
      if ($scope.editingScope
        && !$scope.editingScope.item._id) {
        $scope.items.splice($scope.items.indexOf($scope.editingScope.item), 1);
      }
      if ($scope.xhr) {
        $scope.xhr.abort();
      }
      $scope.coverEditing = false;
      $scope.coverScope = null;
      $scope.titleEditing = false;
      $scope.titleScope = null;
      $scope.editingId = undefined;
      $scope.editingScope = null;
    };
    $scope.publishTopic = function () {
      if ($scope.cancelEdit()) {
        return;
      }
      if (!$scope.topic.title) {
        $scope.editTitle();
        return alertMessenger('填写标题后才能发布');
      }

      $scope.publishingTopic = true;
      $.ajax('/topic/publish', {
        type: 'PUT',
        data: {
          topicId: $scope.topic._id
        }
      })
        .done(function () {
          window.location = '/topic/' + $scope.topic._id;
        })
        .fail(function (jqXHR, textStatus) {
          $scope.publishingTopic = false;//成功的话跳转可能要几秒时间，所以只有失败才reset
          if (jqXHR.status != 401 && textStatus != 'abort') {
            retryMessenger();
          }
        });
    };
    $scope.collectItem = function (item) {
      $scope.xhr = $.post('/item', {
        type: item.type,
        _id: item._id
      })
        .done(function (data) {
          Messenger().post({
            message: '已成功采集'
          });
          $scope.$broadcast('addCollectionItem', data);
        })
        .fail(function (jqXHR, textStatus) {
          if (jqXHR.status != 401 && textStatus != 'abort') {
            Messenger().post({
              message: '采集失败，请重试',
              type: 'error'
            });
          }
        })
        .always(function () {
          $(document).one('mousedown keydown', function () {
            Messenger().hideAll();
          });
        });
    };
    $scope.deleteItem = function (item) {
      if (!confirm('条目删除后无法找回，您确定要删除吗？')) {
        return;
      }
      $scope.items.splice($scope.items.indexOf(item), 1);
      $.ajax('/topic/item', {
        type: 'DELETE',
        data: {
          topicId: $scope.topic._id,
          type: item.type,
          _id: item._id
        }
      })
        .fail(function () {
          $scope.fail = true;
          $scope.$apply();
        });
    };
    $scope.saveItem = function (item, data) {
      if (item._id) {
        $.extend(item, data);
        $scope.cancelEdit(true);
        $.ajax('/topic/item', {
          type: 'PUT',
          data: $.extend({ topicId: $scope.topic._id }, item)
        })
          .fail(function () {
            $scope.fail = true;
            $scope.$apply();
          });
      } else {
        var index = $scope.items.indexOf(item);
        if (index > 0) {
          var prevItemType = $scope.items[index - 1].type;
          var prevItemId = $scope.items[index - 1]._id;
        }
        $scope.savingItem = true;
        $scope.xhr = $.post('/topic/item', $.extend({
            topicId: $scope.topic._id,
            prevItemType: prevItemType,
            prevItemId: prevItemId
          },item , data))
          .done(function (data) {
            $.extend(item, data);
            $scope.cancelEdit(true);
          })
          .fail(function (jqXHR, textStatus) {
            if (jqXHR.status != 401 && textStatus != 'abort') {
              retryMessenger();
            }
          })
          .always(function () {
            $scope.savingItem = false;
            $timeout(function () {
              $scope.$apply();
            });
          });
      }
    };

    function _updateList(index, moved) {
      var type = $scope.items[index].type;
      var _id = $scope.items[index]._id;
      //拖动的item是editWidget，不用重排
      if (!_id) {
        return;
      }
      var prevItemType;
      var prevItemId;
      if (index > 0) {
        prevItemType = $scope.items[index - 1].type;
        prevItemId = $scope.items[index - 1]._id;
      }
      //拖动的item放在了editWidget下面
      if (!prevItemId && (index > 1)) {//todo
        prevItemType = $scope.items[index - 2].type;
        prevItemId = $scope.items[index - 2]._id;
      }
      var url;
      if (moved) {
        $scope.collectionScope.cancelEdit(true);
        $scope.cancelEdit(true);
        $scope.items[index]._id = null;
      } else {
        $.ajax('/topic/sort', {
          type: 'PUT',
          data: {
            topicId: $scope.topic._id,
            type: type,
            _id: _id,
            prevItemType: prevItemType,
            prevItemId: prevItemId
          }
        }).fail(function () {
            $scope.fail = true;
            $scope.$apply();
          });
      }
    }
    $($element).find('.WidgetItemList-Main')
      //防止拖动开始时高度减小导致的抖动
      .mousedown(function () {
        $(this).css('min-height', $(this).outerHeight());
      });
    $(document).mouseup(function () {
      $($element).find('.WidgetItemList-Main').removeAttr('style');
      });
    $scope.sortableOptions = {
      //sortable微件的标准参数
      opacity: 0.4,
      cursor: 'move',
      handle: '.MoveUtil',
      helper: "clone",//加这个是为了解决拖动后添加条目util的index问题
      scrollSensitivity: 100,
      scrollSpeed: 50,
      axis: 'y',
      containment: 'body',

      start: function () {
        $($element).find('.WidgetItemList-Main')
          .addClass('WidgetItemList-Sorting')
          .sortable('refreshPositions');//因为item缩小了，所以要清除缓存大小
      },

      update: function (e, ui) {
        if (ui.item.sortable.moved) {
          _updateList(ui.item.sortable.dropindex, true);
        }
      },

      stop: function (e, ui) {
        $($element).find('.WidgetItemList-Main')
          .removeClass('WidgetItemList-Sorting');
        if (ui.item.sortable.dropindex !== undefined
          && !ui.item.sortable.moved) {//这一个条件是多余的，只是为了规避升级sortable后的风险
          _updateList(ui.item.sortable.dropindex);
        }
      }
    };
    $scope.sortItemTop = function (index) {
      $scope.items.splice(0, 0, $scope.items.splice(index, 1)[0]);
      _updateList(0);
    };
    $scope.sortItemUp = function (index) {
      $scope.items.splice(index - 1, 0, $scope.items.splice(index, 1)[0]);
      _updateList(index - 1);
    };
    $scope.sortItemDown = function (index) {
      $scope.items.splice(index + 1, 0, $scope.items.splice(index, 1)[0]);
      _updateList(index + 1);
    };
    $scope.sortItemBottom = function (index) {
      $scope.items.splice($scope.items.length - 1, 0, $scope.items.splice(index, 1)[0]);
      _updateList($scope.items.length - 1);
    };
    $scope.editCover = function () {
      if ($scope.cancelEdit()) {
        return;
      }
      $scope.coverEditing = true;
    };
    $scope.setCoverScope = function (scope) {
      $scope.coverScope = scope;
    };
    $scope.editTitle = function () {
      if ($scope.cancelEdit()) {
        return;
      }
      $scope.titleEditing = true;
    };
    $scope.setTitleScope = function (scope) {
      $scope.titleScope = scope;
    };
    $scope.$on('setCollectionScope', function (e, scope) {
      $scope.collectionScope = scope;
    });
  };

  window.sng.controller('CoverCtrl', CoverCtrl);
  function CoverCtrl($scope, $element, $timeout) {
    function _saveCover() {
      $.extend($scope.topic, {cover_url: shizier.utils.suffixImage($scope.cover_url)});
      $scope.$parent.cancelEdit(true);
      $.ajax('/topic/cover', {
        type: 'PUT',
        data: {
          _id: $scope.topic._id,
          cover_url: shizier.utils.suffixImage($scope.cover_url)
        }
      })
        .fail(function () {
          $scope.setFail();
          $scope.$apply();
        });
    };
    $scope.init = function () {
      $scope.$parent.setCoverScope($scope);
      //移动光标到输入框末尾
      $timeout(function () {
        $($element).find('.AUTO_FOCUS').focus();
        moveSelection2End($element.find('.AUTO_FOCUS')[0]);
      });
      $($element)
        .on('submit', function () {
          if ($scope.url) {
            $scope.url = $scope.url.trim().replace('。', '.');
            if (!shizier.utils.REGEXP_PROTOCOL.test($scope.url)) {
              $scope.url = 'http://' + $scope.url;
            }
          }
          $scope.$apply();
        })
        .validate({
          submitHandler: function () {
            _saveCover();
          },
          showErrors: function (errorMap, errorList) {
            if (errorList.length) {
              alertMessenger(errorMap.url);
            }
          },
          rules: {
            url: {
              url: true
            }
          },
          messages: {
            url: {
              url: "URL格式错误。"
            }
          }
        });
    };
  };

  window.sng.controller('TopicTitleCtrl', TopicTitleCtrl);
  function TopicTitleCtrl($scope, $element, $timeout) {
    function _saveTitle() {
      $.extend($scope.topic, {
        title: $scope.title,
        description: $scope.description
      });
      $scope.cancelEdit(true);
      $.ajax('/topic/title', {
        type: 'PUT',
        data: {
          _id: $scope.topic._id,
          title: $scope.title,
          description: $scope.description
        }
      })
        .fail(function () {
          $scope.setFail();
          $scope.$apply();
        });
    };
    $scope.init = function () {
      $scope.$parent.setTitleScope($scope);
      //移动光标到输入框末尾
      $timeout(function () {
        $($element).find('.AUTO_FOCUS').focus();
        moveSelection2End($element.find('.AUTO_FOCUS')[0]);
      })
      $($element)
        .validate({
          submitHandler: function () {
            _saveTitle();
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
    };
  };

  window.sng.controller('CollectionCtrl', CollectionCtrl);
  function CollectionCtrl($scope, $sce, $timeout, $element) {
    _commonListCtrl($scope, $sce, $timeout);
    $scope.$emit('setCollectionScope', $scope);
    $scope.$on('addCollectionItem', function (e, item) {
      $scope.items.splice(0, 0, item);
    });
    $scope.setType = function (type) {
      $scope.type = type;
      $scope.typeFilter = type == 'ALL' ? null : {type: type};
    }
    $scope.playVideo = function (item) {
      item.playing = true;
      $timeout(function () {
        item.show = true;
      });
      item.width = $('.WidgetItemList-Sub .Content').width();
      item.height = item.width * 5 / 6;
    };
    $scope.deleteItem = function (item) {
      if (!confirm('条目删除后无法找回，您确定要删除吗？')) {
        return;
      }
      $scope.items.splice($scope.items.indexOf(item), 1);
      $.ajax('/item', {
        type: 'DELETE',
        data: {
          type: item.type,
          _id: item._id
        }})
        .fail(function () {
          $scope.$parent.fail = true;
          $scope.$apply();
        });
    };
    $scope.saveItem = function (item, data) {
      $.extend(item, data);
      $scope.cancelEdit(true);
      $.ajax('/item', {
        type: 'PUT',
        data: item
      })
        .fail(function () {
          $scope.$parent.fail = true;
          $scope.$apply();
        });
    };
  };

  window.sng.controller('SortableCtrl', SortableCtrl);
  function SortableCtrl($scope, $element) {
    $scope.item2 = [$.extend({}, $scope.item)];
    var $ul = $($element);
    $ul
      //防止拖动开始时高度减小导致的抖动
      .mousedown(function () {
        $(this).css('min-height', $(this).outerHeight());
      });
    $(document).mouseup(function () {
      $ul.removeAttr('style');
    });
    $(window).on('scroll', function () {
      $ul.sortable('refreshPositions');//因为滚动后位置变了，所以要清除缓存大小
    });
    $scope.sortableOptions = {
      appendTo: '.WidgetItemList-Main',
      opacity: 0.4,
      cancel: 'input,textarea',
      cursor: 'move',
      cursorAt: { top: 30 },
      helper: 'clone',
      scrollSensitivity: 100,
      scrollSpeed: 50,
      containment: 'body',
      connectWith: '.WidgetItemList-Main',

      start: function () {
        $ul
          .addClass('WidgetItemList-Sorting')
          .sortable('refreshPositions');//因为item缩小了，所以要清除缓存大小
      },

      //列表顺序改变后的回调函数
      stop: function () {
        $ul
          .removeClass('WidgetItemList-Sorting');
        $scope.item2 = [$.extend({}, $scope.item)];
      }
    };
  }
  
  function _commonCtrl($scope, $element, $timeout) {
    $scope._init = function () {
      $scope.$parent.setEditingScope($scope);
      $timeout(function () {
        $($element).find('.AUTO_FOCUS').focus();
        moveSelection2End($element.find('.AUTO_FOCUS')[0]);
      });

      $($element).find('button.COLLECT').data('item', {
        type: $scope.item.type,
        _id: $scope.item._id
      });
      $($element).closest('form').on('submit', function () {
        if ($scope.url) {
          $scope.url = $scope.url.trim().replace('。', '.');
          if (!shizier.utils.REGEXP_PROTOCOL.test($scope.url)) {
            $scope.url = 'http://' + $scope.url;
          }
        }
        if ($scope.quote) {
          $scope.quote = $scope.quote.trim().replace('。', '.');
          if (!shizier.utils.REGEXP_PROTOCOL.test($scope.quote)) {
            $scope.quote = 'http://' + $scope.quote;
          }
        }
        $scope.$apply();
      });
    }
  }

  window.sng.controller('LinkCreateCtrl', CreateCtrl);
  window.sng.controller('ImageCreateCtrl', CreateCtrl);
  window.sng.controller('VideoCreateCtrl', CreateCtrl);
  window.sng.controller('WeiboCreateCtrl', CreateCtrl);
  function CreateCtrl($scope, $element, $timeout) {
    _commonCtrl($scope, $element, $timeout);
    $scope.init = function () {
      $scope._init();
      $($element).closest('form').validate({
        submitHandler: function () {
          if (!shizier.utils.getQuote($scope.url, $scope.item.type.replace('_CREATE', ''))) {
            alertMessenger('暂不支持该网站');
            return;
          }
          $scope.$parent.saveItem($scope.item, {
            url: $scope.item.type == 'IMAGE_CREATE' ? shizier.utils.suffixImage($scope.url) : $scope.url
          });
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
    };
  };

  window.sng.controller('LinkCtrl', LinkCtrl);
  function LinkCtrl($scope, $element, $timeout) {
    _commonCtrl($scope, $element, $timeout);
    $scope.defaultImgSrc = '/images/no_img/photo_150x150.png';
    $scope.noImgSrc = '/images/no_img/default_120x120.png';
    $scope.titleMaxLength = 50;
    $scope.snippetMaxLength = 140;
    $scope.descriptionMaxLength = 140;
    $scope.init = function () {
      $scope._init();
      $($element).closest('form').validate({
        submitHandler: function () {
          $scope.$parent.saveItem($scope.item, {
            title: $scope.title,
            snippet: $scope.snippet,
            src: shizier.utils.suffixImage($scope.src),
            description: $scope.description
          });
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
    };
    $scope.startLoading = function () {
      $scope.loading = true;
    };
    $scope.stopLoading = function () {
      $scope.loading = false;
    };
  };

  window.sng.controller('ImageCtrl', ImageCtrl);
  function ImageCtrl($scope, $element, $timeout) {
    _commonCtrl($scope, $element, $timeout);
    $scope.titleMaxLength = 50;
    $scope.descriptionMaxLength = 140;
    $scope.init = function () {
    $scope._init();
      $($element).closest('form').validate({
        submitHandler: function () {
          $scope.$parent.saveItem($scope.item, {
            title: $scope.title,
            snippet: $scope.snippet,
            description: $scope.description
          });
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
    };
  };

  window.sng.controller('VideoCtrl', VideoCtrl);
  function VideoCtrl($scope, $element, $timeout) {
    _commonCtrl($scope, $element, $timeout);
    $scope.titleMaxLength = 50;
    $scope.descriptionMaxLength = 140;
    $scope.init = function () {
    $scope._init();
      $($element).closest('form').validate({
        submitHandler: function () {
          $scope.$parent.saveItem($scope.item, {
            title: $scope.title,
            description: $scope.description
          });
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
    };
  };

  window.sng.controller('CiteCtrl', CiteCtrl);
  function CiteCtrl($scope, $element, $timeout) {
    _commonCtrl($scope, $element, $timeout);
    $scope.citeMaxLength = 140;
    $scope.titleMaxLength = 50;
    $scope.descriptionMaxLength = 140;
    $scope.init = function () {
    $scope._init();
      $($element).closest('form').validate({
        submitHandler: function () {
          $scope.$parent.saveItem($scope.item, {
            cite: $scope.cite,
            url: $scope.url,
            title: $scope.title,
            description: $scope.description
          });
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
    };
  };

  window.sng.controller('WeiboCtrl', WeiboCtrl);
  function WeiboCtrl($scope, $element, $timeout) {
    _commonCtrl($scope, $element, $timeout);
    $scope.descriptionMaxLength = 140;
    $scope.init = function () {
    $scope._init();
      $($element).closest('form').validate({
        submitHandler: function () {
          $scope.$parent.saveItem($scope.item, {
            description: $scope.description
          });
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
    };
  };

  window.sng.controller('TextCtrl', TextCtrl);
  function TextCtrl($scope, $element, $timeout) {
    _commonCtrl($scope, $element, $timeout);
    $scope.textMaxLength = 140;
    $scope.init = function () {
    $scope._init();
      $($element).closest('form').validate({
        submitHandler: function () {
          $scope.$parent.saveItem($scope.item, {
            text: $scope.text
          });
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
    };
  };

  window.sng.controller('TitleCtrl', TitleCtrl);
  function TitleCtrl($scope, $element, $timeout) {
    _commonCtrl($scope, $element, $timeout);
    $scope.titleMaxLength = 50;
    $scope.init = function () {
    $scope._init();
      $($element).closest('form').validate({
        submitHandler: function () {
          $scope.$parent.saveItem($scope.item, {
            title: $scope.title
          });
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
    };
  };

//监听body高度变化
  $(function () {
    var attachEvent = document.attachEvent;

    if (!attachEvent) {
      var requestFrame = (function(){
        var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
          function(fn){ return window.setTimeout(fn, 20); };
        return function(fn){ return raf(fn); };
      })();

      var cancelFrame = (function(){
        var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame ||
          window.clearTimeout;
        return function(id){ return cancel(id); };
      })();

      function resetTriggers(element){
        var triggers = element.__resizeTriggers__,
          expand = triggers.firstElementChild,
          contract = triggers.lastElementChild,
          expandChild = expand.firstElementChild;
        contract.scrollLeft = contract.scrollWidth;
        contract.scrollTop = contract.scrollHeight;
        expandChild.style.width = expand.offsetWidth + 1 + 'px';
        expandChild.style.height = expand.offsetHeight + 1 + 'px';
        expand.scrollLeft = expand.scrollWidth;
        expand.scrollTop = expand.scrollHeight;
      };

      function checkTriggers(element){
        return element.offsetWidth != element.__resizeLast__.width ||
          element.offsetHeight != element.__resizeLast__.height;
      }

      function scrollListener(e){
        var element = this;
        resetTriggers(this);
        if (this.__resizeRAF__) cancelFrame(this.__resizeRAF__);
        this.__resizeRAF__ = requestFrame(function(){
          if (checkTriggers(element)) {
            element.__resizeLast__.width = element.offsetWidth;
            element.__resizeLast__.height = element.offsetHeight;
            element.__resizeListeners__.forEach(function(fn){
              fn.call(element, e);
            });
          }
        });
      };
    }

    window.addResizeListener = function(element, fn){
      if (attachEvent) element.attachEvent('onresize', fn);
      else {
        if (!element.__resizeTriggers__) {
          if (getComputedStyle(element).position == 'static') element.style.position = 'relative';
          element.__resizeLast__ = {};
          element.__resizeListeners__ = [];
          (element.__resizeTriggers__ = document.createElement('div')).className = 'resize-triggers';
          element.__resizeTriggers__.innerHTML = '<div class="expand-trigger"><div></div></div>' +
            '<div class="contract-trigger"></div>';
          element.appendChild(element.__resizeTriggers__);
          resetTriggers(element);
          element.addEventListener('scroll', scrollListener, true);
        }
        element.__resizeListeners__.push(fn);
      }
    };

    window.removeResizeListener = function(element, fn){
      if (attachEvent) element.detachEvent('onresize', fn);
      else {
        element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
        if (!element.__resizeListeners__.length) {
          element.removeEventListener('scroll', scrollListener);
          element.__resizeTriggers__ = !element.removeChild(element.__resizeTriggers__);
        }
      }
    }
  });

  $(function () {
    var $window = $(window);
    var $header = $('.Header');
    var $band = $('.Band');
    var $main = $('.Main');
    var $cat = $('.Categories');
    var $scroll = $('.Collection .Scrollable');
    var $footer = $('.Footer');

    $band.affix({
      offset: {
        top: function () {
          return (this.top = $header.outerHeight(true))
        }
      }
    });
    $('.Collection').affix({
      offset: {
        top: function () {
          return (this.top = $header.outerHeight(true))
        }
      }
    });

    function updateSortableHeight() {
      $scroll.css('height',
        Math.min(
          $main.height() - $cat.height() - 20,
          $footer.offset().top - $band.offset().top - $band.height() - $cat.height() - 60,
          $window.height() + $window.scrollTop() - $band.height() - $band.offset().top - $cat.height() - 60
        ));
    }

    updateSortableHeight();
    addResizeListener(document.getElementsByTagName('body')[0], updateSortableHeight);
    $window.on('scroll resize', updateSortableHeight)
  });

})(jQuery);