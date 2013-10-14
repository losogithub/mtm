/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/13/13
 * Time: 9:08 AM
 * To change this template use File | Settings | File Templates.
 */

$(function ($) {
  $(".mdHeadUtil01Open")
    .click(function () {
      console.log("click on  open button");
      var $menu = $('.mdHeadUtil01Sub').toggle();

      $(document).one("click", function () {
        $menu.hide();
      });

      return false;
    })
});

$(function($){
   $(".mdSelectBox02Label01")
     .click(function(){
       var $menu = $(".mdSelectBox02Option01").slideToggle(50);
       $(document).one("click", function () {
         $menu.hide();
       });
       return false;
     })
});

$(
  function($){
    $('.mdSelectBox02Option01 > li')
      .click(function(){
        var ord = $(this).data('value');
        var urlBase = $('li.mdMypageMTMList01TabLi > a').attr('href');
        if (urlBase.indexOf('?') !== -1 ){
          urlBase = urlBase.split('?')[0] + '?type=P';
        } else
        { urlBase = urlBase + '?type=J'; }
        urlBase = urlBase  + '&order='  + ord;
        console.log(urlBase);
        window.location = urlBase;
         return false;
      })
  }
);

$(
  function($){
    $('.mdMySubProf01FV > a.MdFVBtn02')
      .click(function(){
        var url = $(this).data('favorite').url ;// Object {url: "http://localhost:3000/u/benben"
        var className = $(this).attr('class');
        var toLike = true;
        if ( className.split(' ').indexOf('ExSelected') > -1){ toLike = false;}
        $.ajax({
          type: 'POST',
          url: '/u',
          xhrFields: { withCredentials: true },
          data: {url: url, toLike: toLike},
          success: function(data){
            console.log("login dialog: %s", data.loginDialog);
            console.log(typeof data.loginDialog);
            if(!data.loginDialog){
              if(toLike){
                $('.mdMySubProf01FV > a.MdFVBtn02').addClass('ExSelected');
              } else {
                $('.mdMySubProf01FV > a.MdFVBtn02').removeClass('ExSelected');
              }
              $('.mdFVCount01Num').text(data.favourite);
            }
            else {
              console.log("need login");
              console.log(data);
              //now how to load the data into html
              //and on the dialog.

              //first append data to current html
              //note: according to the window size;
              var winHeight = $(window).height();
              var winWidth = $(window).width();
              //console.log(winHeight);
              //console.log($(data.loginHtml));
              $(data.loginHtml)
                .appendTo("body");
              var osty = "opacity: 0.5; position: fixed; left: 0px; top: 0px; z-index: 1001;" + "height:" +  winHeight + "px; width: " + winWidth + "px;" ;
              var csty = "position: fixed; z-index: 1002; height: 326px; width: 399px; " +
                "left: " + (winWidth - 380)/2 + "px; top: " + (winHeight - 340)/2 + "px; ";
              $('#simplemodal-overlay').attr('style', osty);
              $('#simplemodal-container').attr('style', csty);
              //ok, display no problem


            }

          },
          err: function(xhr, textStatus, error){
            alert('failed');
          }
        });
      })
  }
)

//loginDialog close
var closeLoginDialog = function(){
  $('#simplemodal-placeholder').remove();
  $('#simplemodal-overlay').remove();
  $('#simplemodal-container').remove();
}

var loginCheck = function(){

  var username = document.getElementById('uName').value;
  var password = document.getElementById('uPas').value;
  var rememberMe = false;
  if($('#idSaveCheck').is(":checked")){
    rememberMe = true;
  }
  console.log("loginCheck");
  console.log(username);
  console.log(password);
  console.log(rememberMe);
  //primary check: i.e. non empty.
  //either empty
  if( !username || !password){
    $('#errMsg').attr('style', 'display: true');
    $('#errMsg').text('用户名和密码不能为空。');
    console.log("用户名和密码不能为空。");
    return false;
  }


  //using an ajax send to server to check for login.
  $.ajax({
    type: 'POST',
    url: '/loginDialogCheck',
    xhrFields: { withCredentials: true },
    data: {userName: username, password: password, rememberMe : rememberMe},
    success: function(data){

      if(!data.correct){
        $('#errMsg').attr('style', 'display: true');
        $('#errMsg').text('用户名或则密码不正确。');
        return false;
      }
      //todo: correct situation.
      else {
        //remove dialog
        var toLike = true;
        var likeStar = $('.mdMySubProf01FV > a.MdFVBtn02');
        if ( likeStar.attr('class').split(' ').indexOf('ExSelected') > -1)
        {
          toLike = false;
        }

        $('#simplemodal-placeholder').remove();
        $('#simplemodal-overlay').remove();
        $('#simplemodal-container').remove();
        if(toLike){
          likeStar.addClass('ExSelected');
        } else {
          likeStar.removeClass('ExSelected');
        }
        $('.mdFVCount01Num').text(data.favourite);

        //one more thing: right head part from un-login to login
        //not to do now.
        /*
        var headRightContent = '<nav><ul class="MdHeadUtil01 mdHeadUtil01Login" data-na="NA:gnbLogin"><li class="mdHeadUtil01Li"><a href="/works" ><img width="20" height="20"  class="mdHeadUtil01Thumb" src="" ">uername</a><span class="MdHeadSeparator01">|</span></li><li class="mdHeadUtil01Li"><a href="/notifications" >通知</a><span class="mdHeadUtil01Count" style="display:none;"><span class="mdHeadUtil01CountInner">0</span></span><span class="MdHeadSeparator01">|</span></li><li class="mdHeadUtil01Li"><a href="/topic/create" >创建总结</a><span class="MdHeadSeparator01">|</span></li><li class="mdHeadUtil01Li"><button class="mdHeadUtil01Open" >更多</button><ul class="mdHeadUtil01Sub" style="display:none;"><li class="mdHeadUtil01SubLi"><a href="/settings" >设置</a></li><li class="mdHeadUtil01SubLi"><a href="/faq?serviceNo=4" >帮助</a></li><li class="mdHeadUtil01SubLi mdHeadUtil01SubLiLast"><a href="/logout" >登出</a><span class="mdHeadUtil01SubPointer"></span></li></ul></li></ul></nav>';
        $('.lyHeadNav > nav').replaceWith(headRightContent);
        $('.MdHeadUtil01 .mdHeadUtil01Login  > li > a[href="/works"]').text(data.userName);
          */
        return false;
      }

    },
    err: function(xhr, textStatus, error){
      alert("failed");
    }

  });


  return false;
}