/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/3/13
 * Time: 11:26 PM
 * To change this template use File | Settings | File Templates.
 */

(function ($) {

  var $window;
  var $editArea;
  var $main;
  var $scrollable;
  var marginBottom = 200;

  function _setMouseMoveListener() {
    $window.mousemove(function (event) {
      if (event.clientY < 100) {
        $editArea.scrollTop($editArea.scrollTop() - (100 - event.clientY))
      }
      if (event.clientY > $window.height() - 100) {
        $editArea.scrollTop(Math.min(
          $editArea.scrollTop() + (100 - ($window.height() - event.clientY)),
          $main.height() + 20 + marginBottom - $editArea.height()
        ));
      }
    });
  }

  $(function () {

    $editArea = $('.EditArea');
    $main = $('.Main');
    $window = $(window);
    marginBottom = $window.height() - 41 - 65 - 40;
    $main.css('margin-bottom', marginBottom);
    $window.on('resize', function () {
      marginBottom = $window.height() - 41 - 65 - 40;
      $main.css('margin-bottom', marginBottom);
      $editArea.scrollTop(Math.min(
        $editArea.scrollTop(),
        $main.height() + 20 + marginBottom - $editArea.height()
      ));
      $('.EditArea').perfectScrollbar('update');
    });

    $editArea.perfectScrollbar({
      suppressScrollX: true
    });
    $scrollable = $('.Scrollable');
    $scrollable.perfectScrollbar({
      suppressScrollX: true
    });
    var $searchImage = $('#_searchImage');
    $searchImage.on('shown.bs.modal', function () {
      $('.AutoFocus').focus();
    });
    $searchImage.find('.modal-body').perfectScrollbar({
      suppressScrollX: true,
      includePadding: false
    });

    var $toTop = $('.ToTop');
    var $toBottom = $('.ToBottom');
    $toTop.click(function () {
      $toTop.blur();
      $editArea.animate({scrollTop: 0}, 250);
    });
    $toBottom.click(function () {
      $toBottom.blur();
      $editArea.animate({scrollTop: $main.height() + 20 + marginBottom - $editArea.height()}, 250);
    });
  });

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
      $scope.items.splice($scope.items.indexOf(item) + 1, 0, { type: type });
      if ($scope.cancelEdit()) {
        return;
      }
    };
    $scope.$on('setEditingScope', function (e, scope) {
      $scope.editingScope = scope;
    });
  }

  window.sng.controller('TopicCtrl', TopicCtrl);
  function TopicCtrl($scope, $sce, $timeout, $element) {
    _commonListCtrl($scope, $sce, $timeout);
    $scope.init = function () {
      if (!$scope.topic.title && !$scope.topic.items.length) {
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
    $scope.$on('setXhr', function (e, xhr) {
      $scope.xhr = xhr;
    });
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
          }, item , data))
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
      var prevItemId;
      if (index > 0) {
        prevItemId = $scope.items[index - 1]._id;
      }
      //拖动的item放在了editWidget下面
      if (!prevItemId && (index > 1)) {//todo
        prevItemId = $scope.items[index - 2]._id;
      }
      var url;
      if (moved) {
        url = '/topic/insert';
      } else {
        url = '/topic/sort';
      }
      $.ajax(url, {
        type: 'PUT',
        data: {
          topicId: $scope.topic._id,
          type: type,
          _id: _id,
          prevItemId: prevItemId
        }
      }).fail(function () {
          $scope.fail = true;
          $scope.$apply();
        });
    }
    $($element).find('.WidgetItemList-Main')
      //防止拖动开始时高度减小导致的抖动
      .mousedown(function () {
        $(this).css('min-height', $(this).outerHeight());
      });
    $(document).mouseup(function () {
      $($element).find('.WidgetItemList-Main').removeAttr('style');
      });
    var $ul = $($element).find('.WidgetItemList-Main');
    $($element).find('.EditArea').on('scroll', function () {
      $ul.sortable('refreshPositions');//因为滚动后位置变了，所以要清除缓存大小
    });
    $scope.sortableOptions = {
      //sortable微件的标准参数
      axis: 'y',
      cursor: 'move',
      cursorAt: { top: 30 },
      handle: '.MoveUtil',
      helper: "clone",//加这个是为了解决拖动后添加条目util的index问题
      opacity: 0.4,
      revert: 100,
      scroll: false,

      start: function () {
        $($element).find('.WidgetItemList-Main')
          .addClass('WidgetItemList-Sorting')
          .sortable('refreshPositions');//因为item缩小了，所以要清除缓存大小
        _setMouseMoveListener();
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
        $window.off('mousemove');
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
    $scope.onCreateCite = function () {
      alertMessenger('使用侧边栏上的采集工具，体验更便捷的引文采集');
      $scope.setCollectionCategory('BOOKMARKLET');
    };
    $scope.setCollectionCategory = function (type) {
      $scope.$broadcast('setCollectionCategory', type);
    };
    $scope.$on('setCollectionScope', function (e, scope) {
      $scope.collectionScope = scope;
    });
    $scope.$on('appendItem', function (e, item) {
      $scope.items.splice($scope.items.length, 0, item);
      _updateList($scope.items.length - 1, true);
      $editArea.scrollTop($main.height() + 20 + marginBottom - $editArea.height());
    });
  };

  window.sng.controller('CoverCtrl', CoverCtrl);
  function CoverCtrl($scope, $element, $timeout) {
    function _saveCover() {
      var xhr = $.ajax('/topic/cover', {
        type: 'PUT',
        data: {
          _id: $scope.topic._id,
          cover_url: $scope.cover_url
        }
      })
        .done(function (data) {
          $.extend($scope.$parent.topic, {cover_url: data.cover_url});
          $scope.$parent.cancelEdit(true);
          $scope.$apply();
        })
        .fail(function () {
          retryMessenger();
        });
      $scope.$emit('setXhr', xhr);
    }
    $scope.init = function () {
      $scope.$parent.setCoverScope($scope);
      //移动光标到输入框末尾
      $timeout(function () {
        $($element).find('.AUTO_FOCUS').focus();
        moveSelection2End($element.find('.AUTO_FOCUS')[0]);
      });
      $($element).find('form[name="form"]')
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
    var $searchImage = $('#_searchImage');
    $scope.showSearchImage = function () {
      $searchImage.one('hide.bs.modal', function () {
        $timeout(function () {
          $($element).find('.AUTO_FOCUS').focus();
          moveSelection2End($element.find('.AUTO_FOCUS')[0]);
        });
      });
      $searchImage.modal();
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
  function CollectionCtrl($scope, $sce, $timeout) {
    _commonListCtrl($scope, $sce, $timeout);
    $scope.$emit('setCollectionScope', $scope);
    $scope.$on('addCollectionItem', function (e, item) {
      $scope.items.splice(0, 0, item);
      $scrollable.scrollTop(0);
    });
    $scope.$on('setCollectionCategory', function (e, type) {
      $scope.type = type;
    });
    $scope.init = function (items) {
      $scope.items = items;
      if (items.length) {
        $scope.type = 'ALL';
      } else {
        $scope.type = 'BOOKMARKLET';
      }
    };
//    $(window).focus(function () {
//      $scope.refresh();
//    })
//    $scope.refresh = function () {
//      if ($scope.loadXhr) {
//        $scope.loadXhr.abort();
//        $scope.loadXhr = null;
//        return;
//      }
//      $scope.loadXhr = $.getJSON('/item/collection')
//        .done(function (data) {
//          $scope.items = data;
//        })
//        .always(function () {
//          $scope.loadXhr = null;
//          $scope.$apply();
//        });
//    };
    $scope.setType = function (type) {
      $scope.type = type;
//      $scope.typeFilter = type == 'ALL' ? null : {type: type};
    };
    $scope.playVideo = function (item) {
      item.playing = true;
      $timeout(function () {
        item.show = true;
      });
      item.width = $('.WidgetItemList-Sub .Content').width();
      item.height = item.width * 5 / 6;
    };
    $scope.appendItem = function (item) {
      $scope.items.splice($scope.items.indexOf(item), 1);
      $scope.$emit('appendItem', item);
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
    $scope.item2 = [$scope.item];
    var $ul = $($element);
    $ul
      //防止拖动开始时高度减小导致的抖动
      .mousedown(function () {
        $(this).css('min-height', $(this).outerHeight());
      });
    $(document).mouseup(function () {
      $ul.removeAttr('style');
    });
    $('.CollectionItems').add('.EditArea').on('scroll', function () {
      if ($ul.is(':visible')) {
        $ul.sortable('refreshPositions');//因为滚动后位置变了，所以要清除缓存大小
      }
    });
    $scope.sortableOptions = {
      appendTo: '.WidgetItemList-Main',
      connectWith: '.WidgetItemList-Main',
      cursor: 'move',
      cursorAt: { top: 30 },
      helper: 'clone',
      opacity: 0.4,
      scroll: false,

      start: function () {
        $ul
          .addClass('WidgetItemList-Sorting')
          .sortable('refreshPositions');//因为item缩小了，所以要清除缓存大小
        _setMouseMoveListener();
      },

      //列表顺序改变后的回调函数
      stop: function () {
        $ul
          .removeClass('WidgetItemList-Sorting');
        if (!$scope.item2.length) {
          $scope.$parent.items.splice($scope.$parent.items.indexOf($scope.item), 1);
        }
        $window.off('mousemove');
      }
    };
  }

  function _commonCtrl($scope, $element, $timeout) {
    $scope._init = function () {
      $scope.$emit('setEditingScope', $scope);
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

  window.sng.controller('ImageCtrl', ImageCtrl);
  function ImageCtrl($scope, $element, $timeout) {
    _commonCtrl($scope, $element, $timeout);
    $scope.titleMaxLength = 50;
    $scope.descriptionMaxLength = 140;
    $scope.init = function () {
      $scope._init();
      if (!$scope.item.url) {
        $scope.showSearchImage();
      }
      $($element).closest('form').validate({
        submitHandler: function () {
          $scope.$parent.saveItem($scope.item, {
            title: $scope.title,
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
    var $searchImage = $('#_searchImage');
    $scope.showSearchImage = function () {
      $searchImage.one('hide.bs.modal', function () {
        if (!$scope.editingScope.item.url) {
          $timeout(function () {
            $scope.cancelEdit(true);
          });
        } else {
          $timeout(function () {
            $($element).find('.AUTO_FOCUS').focus();
            moveSelection2End($element.find('.AUTO_FOCUS')[0]);
          });
        }
      });
      $searchImage.modal();
    };
  };

  window.sng.controller('SearchImageCtrl', SearchImageCtrl);
  function SearchImageCtrl($scope, $element) {
    $scope.images = [];
    var xhr;
    $scope.submit = function () {
      if (xhr) {
        xhr.abort();
      }
      xhr = $.get('/search_image', {
        keyword: $scope.searchImageKeyword
      })
        .done(function (data) {
          $scope.images = data.images;
          $scope.$apply();
          $('#_searchImage .modal-body').scrollTop(0);
        })
        .fail(function () {

        });
    };
    $scope.selectImage = function (image) {
      if ($scope.editingScope) {
        $.extend($scope.editingScope.item, {
          url: image.url,
          quote: image.quote,
          quoteDomain: shizier.utils.getQuote(image.quote)
        });
        $scope.editingScope.title = image.title;
      } else {
        $scope.$parent.cover_url = $scope.$parent.searchedCoverUrl = image.url;
      }
      $($element).modal('hide');
    };
    $scope.onError = function (image) {
      $scope.images.splice($scope.images.indexOf(image), 1);
    };
  };

  window.sng.controller('SearchedImageCtrl', SearchedImageCtrl);
  function SearchedImageCtrl($scope, $element) {
    $scope.onLoad = function (image) {
      var $img = $($element);
      if ($img.width() * $img.height() < 80000) {
        $scope.images.splice($scope.images.indexOf(image), 1);
      }
    };
  }

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

  window.sng.controller('LinkCreateCtrl', CreateCtrl);
  function CreateCtrl($scope, $element, $timeout) {
    _commonCtrl($scope, $element, $timeout);
    $scope.init = function () {
      $scope._init();
      $($element).closest('form').validate({
        submitHandler: function () {
          $scope.$parent.saveItem($scope.item, {
            url: $scope.url
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

})(jQuery);