/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 4/24/14
 * Time: 10:06 AM
 * To change this template use File | Settings | File Templates.
 */
var shizier_postMessageListener;
(function () {

  var clean = function () {
    if (shizier_postMessageListener) {
      if (window.removeEventListener) {
        window.removeEventListener('message', shizier_postMessageListener, false);
      } else {
        window.detachEvent("onmessage", shizier_postMessageListener);
      }
    }

    var oldIframe = document.getElementById('_shizier_overlay');
    if (oldIframe) {
      oldIframe.parentNode.removeChild(oldIframe);
    }
  }

  var main = function () {

    clean();

    var css = '#_shizier_overlay{width:100%;height:100%;position:fixed;top:0;left:0;border:none;z-index:999999;}';
    var style = document.createElement('STYLE');
    style.id = '_shizier_style';
    style.type = 'text/css';
    if (style.styleSheet){
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
    document.getElementsByTagName('head')[0].appendChild(style);

    var iframe = document.createElement('IFRAME');
    iframe.id = '_shizier_overlay';
    iframe.src = 'http://shizier.com/bookmarklet';
//    iframe.src = 'http://localhost:3000/bookmarklet';

    iframe.allowTransparency = 'true';
    iframe.style.visibility = 'hidden';
    document.getElementsByTagName('body')[0].appendChild(iframe);

    var selection = document.getSelection ? document.getSelection() : document.selection.createRange().text;

    var description;
    var metas = document.getElementsByTagName('meta');
    for (var i in metas) {
      if (metas[i].name && metas[i].name.toLowerCase() == 'description') {
        description = metas[i].content;
      }
    }

    shizier_postMessageListener = function (event) {
      if (event.data == 'show') {
        iframe.style.visibility = 'visible';
        var imgs = document.getElementsByTagName('img');

        var images = [];
        for (var i = 0; i < imgs.length; i++) {//imgs是类似数组的对象，只能这样遍历
          var top = 0;
          var left = 0;
          for (var temp = imgs[i]; temp; temp = temp.offsetParent) {
            top += temp.offsetTop;
            left += temp.offsetLeft;
          }
          var product
            = (Math.max(Math.min(top + imgs[i].offsetHeight, window.pageYOffset + window.outerHeight), window.pageYOffset)
            - Math.max(Math.min(top, window.pageYOffset + window.outerHeight), window.pageYOffset))
            * (Math.max(Math.min(left + imgs[i].offsetWidth, window.pageXOffset + window.outerWidth), window.pageXOffset)
            - Math.max(Math.min(left, window.pageXOffset + window.outerWidth), window.pageXOffset));
          if (product < 100) {
            continue;
          }
          images.push({
            src: imgs[i].src,
            title: imgs[i].alt || imgs[i].title || document.title,
            product: product
          })
        }
        images.sort(function (a, b) {
          return b.product - a.product;
        });
        iframe.contentWindow.postMessage({
          url: location.href,
          title: document.title,
          snippet: description,
          cite: selection.toString(),
          images: images
        }, '*');
      } else if (event.data == 'close') {
        clean();
      }
    };
    if (window.addEventListener) {
      window.addEventListener('message', shizier_postMessageListener, false);
    } else {
      window.attachEvent("onmessage", shizier_postMessageListener);
    }
  };

  if (!document.readyState || /loaded|complete/.test(document.readyState)) {
    main();
  } else {
    window.onload = function() {
      main();
    }
  }
})();