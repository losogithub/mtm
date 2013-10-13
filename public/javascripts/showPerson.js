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
})

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
)