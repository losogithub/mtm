/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/18/13
 * Time: 1:01 PM
 * To change this template use File | Settings | File Templates.
 */

//click on add FV
$(
  function($){
    $('.HeadFVBtn')
      .click(function(){
        console.log("click on add fav");
        var topicId = $(this).data('favorite').topicId;
        console.log(topicId);
        var className = $(this).attr('class');
        var toLike = true;
        if ( className.split(' ').indexOf('ExSelected') > -1){ toLike = false;}
        console.log(toLike);

        $.ajax({
          type: 'POST',
          url: '/topic/favorite',
          xhrFields: { withCredentials: true },
          data: {topicId: topicId, toLike: toLike},
          success: function(data){
            console.log("login dialog: %s", data.loginDialog);
            console.log(typeof data.loginDialog);
            if(!data.loginDialog){
              console.log("toLike type: ")
              console.log(typeof  data.toLike);
              console.log(data.toLike);
              if(data.toLike == "true"){
                $('a[class="HeadFVBtn"]').addClass('ExSelected');
              } else {
                $('.HeadFVBtn').removeClass('ExSelected');
              }
              //$('.HeadFVCountNum').text(data.FVCount);
              $('.HeadFVIco').next().text(data.FVCount);
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


  //: post topicId and toLike again
  var topicId = $('.HeadFVBtn').data('favorite').topicId;
  console.log(topicId);


  var className = $('.HeadFVBtn').attr('class');

  var toLike = true;
  if ( className.split(' ').indexOf('ExSelected') > -1){ toLike = false;} //usually shallbe true.
  console.log(toLike);

  //using an ajax send to server to check for login.
  //what is wrong ? why not send ???????????? 10.18 23:39 2013
  $.ajax({
    type: 'POST',
    url: '/topic/loginDialogCheck',
    xhrFields: { withCredentials: true },
    data: {userName: username, password: password, rememberMe : rememberMe, topicId: topicId, toLike: toLike},
    success: function(data){

      console.log("POST return, topic/loginDialogCheck");
      console.log(typeof data.correct);
      if(!data.correct){
        $('#errMsg').attr('style', 'display: true');
        $('#errMsg').text('用户名或则密码不正确。');
        return false;
      }
      else {
        //remove dialog
        //todo: toLike is not correct
        var toLike = data.toLike;
        console.log("type tolike: %s", typeof toLike);

        $('#simplemodal-placeholder').remove();
        $('#simplemodal-overlay').remove();
        $('#simplemodal-container').remove();

        if(data.toLike == "true"){
          $('a[class="HeadFVBtn"]').addClass('ExSelected');
        } else {
          $('.HeadFVBtn').removeClass('ExSelected');
        }
        //$('.HeadFVCountNum').text( '<span class="HeadFVIco"></span>' + data.FVCount);
        $('.HeadFVIco').next().text(data.FVCount);
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

