(function(){
    var nTimer;
    nj.getPackage("nj.matome.common.notifyMonitor",
		  {options:{interval:60},
		   init:function(options,bExec){ //e.g. {interval: 60}, true
		       var that=this;
		       options=options||{};
		       $.extend(true,this.options,options); // this is a deep copy + merge. copy options to this.options.
		       if(nTimer){clearInterval(nTimer);} // what does nTimer assigned to ?
		       bExec&&that._interval();
		       nTimer=setInterval(
			   function(){that._interval();}
			   ,this.options.interval*1000);
		   },
		   _interval:function(){
		       $.rest("GET",
			      {url:nj.common.getAPI("GNB_NOTIFY_COUNT"), //todo what is nj.common.getAPI. it is defined in nj.common_...js
			       success:function(o){
				   if(o&&o.result){$.njObserver.notify("matome.common.notify.monitor",o.result.count);
						  }},
			       error:$.noop,triggerErrorHandler:true});
		   }});
})();

$.widget("matome.notifyBadge",{options:{max:0,label:"${num}",maxLabel:"${max}+"},update:function(n){ //${num} is passed as an argument.
    var options=this.option(),s;
    if(n==0){this.element.hide(); }
    else{
	if(n>options.max){
	    n=options.maxLabel.replace("${max}",options.max);
	}
	s=options.label.replace("${num}",n);
	this.element.html(s);
	this.element.show();
    }
}});

(function(){
    var NOTIFY_GET_INTERVAL=60,
    NONE_IMAGE="/img/Gone";
    nj.getPackage("nj.matome.navigate.gnb",
		  {init:function(){
		      var that=this;
		      this._$base=$(".MdHeadUtil01");
		      this._$notifyBadge=this._$base.find(".mdHeadUtil01Count"); //notificaton count. i.e. unread message.
		      this._$gnbProfileImage=this._$base.find(".mdHeadUtil01Thumb");
		      $(".mdHeadUtil01Open").gnbToggleMenu({menu:".mdHeadUtil01Sub"});
		      if(this._$notifyBadge.length){
			  this._$notifyBadge.notifyBadge({max:999,label:'<span class="mdHeadUtil01CountInner">${num}</span>'}); //todo: here pass a variable ${num}, how to use it ? 10.3.2013
			  nj.matome.common.notifyMonitor.init({interval:NOTIFY_GET_INTERVAL},true);
			  $.njObserver("matome.common.notify.monitor",function(e,n){if(n!==false){that._$notifyBadge.notifyBadge("update",n); });  // what is njObserver
		      }
		      $.njObserver("matome.navigate.gnb.changeProfileImage",function(e,s){that._changeProfileImage(s); });
		  },
		   _changeProfileImage:function(sUrl){this._$gnbProfileImage.attr("src",sUrl||NONE_IMAGE).bind("error",function(){errorImage(this,"user20x20");
																 });
						     }});
})();

(function(){
    var CUSTOM_CLICK_NAME="click.matome.gnbToggleMenu",
    CUSTOM_SCROLL_NAME="scroll.matome.gnbToggleMenu";
    $.widget("matome.gnbToggleMenu",
	     {options:{menu:""},
	      _create:function()
	      {
		  var that=this;
		  this._$menu=$(this.option("menu"));
		  this._$doc=$(window);
		  this._$body=$(document.body);
		  this.element.mousedown(function(){if(!that.isVisible()){
		      that._$menu.show();
		      that._$body.bind(CUSTOM_CLICK_NAME,$.proxy(that._onDocumentClick,that));
		      that._$doc.one(CUSTOM_SCROLL_NAME,$.proxy(that.hide,that));
		  }else{that.hide();
		       }});
	      },
	      _onDocumentClick:function(e){
		  var $el=$(e.target);
		  if(this.isVisible()&&!this._$menu.has(e.target).length&&!$el.is(this.element)){
		      this.hide();
		  }},
	      isVisible:function(){return this._$menu.is(":visible"); },
	      hide:function(){
		  this._$menu.hide();
		  this._$body.unbind(CUSTOM_CLICK_NAME);
		  this._$doc.unbind(CUSTOM_SCROLL_NAME);
	      }});
})();

nj.common.setAPI({GNB_NOTIFY_COUNT:"/api/notify/count"});


/* @release 1380010682 */
