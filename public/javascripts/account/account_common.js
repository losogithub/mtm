if (typeof nj == "undefined") var nj = {};
if (typeof nj.account == "undefined") nj.account = {};
(function($){
	var bEnglish = $('html').attr("lang") == "en_US";
	nj.account.validate = function(){
	}
	nj.account.validate.prototype = {
		rules : {
			passwd : {
				required : {
					rule   : true
				},
				length   : {
					rule   : [6, 20]
				},
				format   : {
					rule   : true
				},
				equalTo    : {
					rule   : "#_change_passwd"
				},
				security   : {
					rule   : true
				}
			}
		},
		passwordStrength : {
			weak   : (bEnglish) ? "Low"   : "低",
			mid    : (bEnglish) ? "Medium" : "中",
			strong : (bEnglish) ? "High" : "高"
		},
		registerForm : {
			url     : (bEnglish) ? '<p class="MdMsgUserPage01">My Page URL : http://mtm.com/<span class="_userNameOutput">username</span></p>' :
									'<p class="MdMsgUserPage01">网址: http://mtm.com/<span class="_userNameOutput">用户名</span></p>',
			caution : (bEnglish) ? '<p class="MdMsgError01">Username (cannot be modified)</p>' :
									'<p class="MdMsgError01">用户名不能更改。</p>'
		},
		resend : {
			send : (bEnglish) ? 'We have sent your confirmation email to your registered email address.' :
								'我们已经给你的邮箱发了一封激活邮件。',
			error: (bEnglish) ? 'Temporary error. Please try again later.' :
								'临时错误。<br>请稍等。'
		},
		// key入力毎に、マイページURLを更新する
        // this one works 9.25  taozan
		setKeyupEvent : function(){
			var self = this;
		    $("input#_userName").keyup(function(){
	            var _msgArea = $(this).closest(".MdInputTxt01").next();
	            if(_msgArea.children("P.MdMsgUserPage01").length == 0){
	                var _html = [];
	                _html.push(self.registerForm.url);
	                _html.push(self.registerForm.caution);
	                _msgArea.html(_html.join(""));
	            }
				// NJUSER-3360 html->textへ変更
		        $("span._userNameOutput").text($(this).val());  // tao not understand 9.25
		    });
		},
		// textboxにfocusがあたった場合、activeにする
		setFocusEvent : function(){
			var self = this;
		    $("input:text, input:password").focus(function(){
		        var id = this.id || this.name;
			// ユーザ名のみマイページURLを表示する
		        if(id == "_userName"){
		            var _msgArea = $(this).closest(".MdInputTxt01").next();
		            if(_msgArea.children("P.MdMsgUserPage01").length == 0){
		                var _html = [];
		                _html.push(self.registerForm.url);
		                _html.push(self.registerForm.caution);
		                _msgArea.html(_html.join(""));
		            }
		        }
		    });
		},
		// 同意チェックボックス押下時に、送信ボタンの有効・無効を切り替える
		setClickEvent : function(){
		    $("input#rules:checkbox").click(function(){
		        if($(this).attr('checked') == true){
		            $("button[name='signup']").attr("disabled", "");
		        }else{
		            $("button[name='signup']").attr("disabled", "disabled");
		        }
		    });
		},
		setSubmitEvent : function(){
			$("#_registForm").submit(function(){
				// 利用規約
				if($("input#rules").length && $("input#rules").attr("checked") === false){
					return false;
				}
				if(!$("#_registForm").valid()){
					//$("#_captcha").val("");
					$("input#rules:checkbox:checked").attr("checked", "");
					$("button[name='signup']").attr("disabled", "disabled");
				}
				// パスワードがエラーの場合、クリアする
                // where is _change_passwd attribute in signup.html ? 9.25
				if($("#_change_passwd").length && !$("#_change_passwd").valid()){
					$("#_change_passwd").val("");
					$("#_passwd").val("");
				}
				// ダブルクリック防止
				$("input#rules:checkbox").attr("checked", false); // if it is false, then you can not click again.
	            $("button[name='signup']").attr("disabled", "disabled");
			});
		},
		setPasswdCheckConfirm : function(errClass){
			var rules = this.rules;
			var errorClass = errClass || "MdErr01";
			$("#_passwd").njPasswdCheck({
				security  : rules.passwd.security.rule,
				required  : rules.passwd.required.rule,
				range     : rules.passwd.length.rule,
				messages  : {
					high   : '<span class="mdSting01Txt01">' + this.passwordStrength.strong + '</span>',
					middle : '<span class="mdSting01Txt01">' + this.passwordStrength.mid  +'</span>',
					low    : '<span class="mdSting01Txt01">' + this.passwordStrength.weak + '</span>'
				},
				showError : function(bError, sMessage){
					if(sMessage){
						var target = $(this).closest("td");
						target.children("." + errorClass).hide();
						var outarea = target.children(".mdSting01Txt01");
						if(outarea.length){
							outarea.html($(sMessage).html()).show();
						}else{
							// エラー要素がある場合、スペースを追加しない
							if(!target.children("." + errorClass).length){
								target.append(" ");
							}
							target.append(sMessage).show();
						}
					}else if(bError){
						var target = $(this).closest("td");
						target.children(".mdSting01Txt01").hide();
					}
				}
			});
			$("#_passwd_confirm").njPasswdCheck({
				security  : rules.passwd.security.rule,
				required  : rules.passwd.required.rule,
				range     : rules.passwd.length.rule,
				confirm   : "#_passwd",
				messages  : {
					high   : '<span class="mdSting01Txt01">' + this.passwordStrength.strong + '</span>',
					middle : '<span class="mdSting01Txt01">' + this.passwordStrength.mid  + '</span>',
					low    : '<span class="mdSting01Txt01">' + this.passwordStrength.weak + '</span>'
				},
				showError : function(bError, sMessage){
					if(sMessage){
						var target = $(this).closest("td");
						target.children("." + errorClass).hide();
						var outarea = target.children(".mdSting01Txt01");
						if(outarea.length){
							outarea.html($(sMessage).html()).show();
						}else{
							// エラー要素がある場合、スペースを追加しない
							if(!target.children("." + errorClass).length){
								target.append(" ");
							}
							target.append(sMessage).show();
						}
					}else if(bError){
						var target = $(this).closest("td");
						target.children(".mdSting01Txt01").hide();
					}
				}
			});
		},
		setUserUrl : function(){
			var userName = $("#_userName");
			if(userName.val()){
	            var _msgArea = userName.closest(".MdInputTxt01").next();
				// エラーがなく、マイページURLがない場合
	            if(_msgArea.children("P.MdMsgError01").length == 0 && _msgArea.children("P.MdMsgUserPage01").length == 0){
	                var _html = [];
	                _html.push(this.registerForm.url);
	                _html.push(this.registerForm.caution);
	                _msgArea.html(_html.join(""));
					// NJUSER-3360 html->textへ変更
					$("span._userNameOutput").text(userName.val());
	            }
			}
		}
	}
})(jQuery);

/**
 *  private personal information change
 *  including set a new-password, birhtday, gender.
 **/
(function($){
	nj.account.initAccountInfoChangeForm = function(){
		this.setPasswdCheckConfirm("mdSting01Err02");
		this.setFocusEvent();
		this.setSubmitEvent();
	}
	$.extend(nj.account.initAccountInfoChangeForm.prototype, nj.account.validate.prototype, {
		setSubmitEvent : function(){
			$("#_registForm").submit(function(){
				// submit時パスワードがエラーの場合、クリアする
				if($("#_passwd_confirm").length && !$("#_passwd_confirm").valid()){
					$("#_change_passwd_confirm").focus();
				}
			});
		}
	});
})(jQuery);
/**
 * メールアドレス変更画面
 * https://ssl.naver.jp/accountVerify
 * https://ssl.naver.jp/verifyAccountMail(通常, openid)
 * 
 **/
(function($){
	nj.account.initMailChangeForm = function(){
		this.setPasswdCheck();
		this.setFocusEvent();
	}
	$.extend(nj.account.initMailChangeForm.prototype, nj.account.validate.prototype, {
		setPasswdCheck : function(){
			$("#_passwd").njPasswdCheck({
				required  : this.rules.passwd.required.rule,
				showError : function(bError, sMessage){
					if(!bError){
						var target = $(this).closest("td");
						target.children(".MdErr01").remove();
						target.children(".mdSting01Txt01").remove();
					}
				}
			});
		}
	});
})(jQuery);

/**
 * パスワード変更画面
 **/
(function($){
	nj.account.initPasswdResetForm = function(){
		this.setPasswdCheckConfirm("MdErr01");
		this.setFocusEvent();
	}
	$.extend(nj.account.initPasswdResetForm.prototype, nj.account.validate.prototype, {});
})(jQuery);
/**
 * パスワード再設定画面
 **/
(function($){
	nj.account.initPasswdResetMailForm = function(){
		this.setFocusEvent();
	}
	$.extend(nj.account.initPasswdResetMailForm.prototype, nj.account.validate.prototype, {});
})(jQuery);
/**
 * @description ログイン画面
 * https://ssl.naver.jp/login
 **/
(function($){
	nj.account.initLoginForm = function(){
		this.setPlaceHolderEvent();
		this.setFocusEvent();
		// ロード時に、メールアドレス枠にフォーカスを合わせる
		this.setFocus();
	};
	$.extend(nj.account.initLoginForm.prototype, nj.account.validate.prototype, {

		setPlaceHolderEvent : function(){

			// 設定前のパスワードを保持する
			var email  = $("#_email");
			var passwd = $("input:password");

			// passwd入力前の値を保持
			this.beforePasswd = passwd.val();
			
			// inputの値により、placeholderクラスの設定を行う
			var inputCheck = function(target){
			};
			// サーバ側で出力した値がある場合、placeholderを外す
			$("input:text, input:password").each(function(i, elm){
				inputCheck($(elm));
			});
			// 入力があたった場合、placeholderクラスを外す
			$("input:text, input:password").bind('keyup keydown change blur', function(){inputCheck($(this));});

			// ieの場合、オートコンプリートで入力された場合イベントが発生しないので追加
			if($.browser.msie){
				var self = this;
            	passwd.bind("propertychange", function(event){
					if($(this).val() && self.beforePasswd != $(this).val()){
						self.beforePasswd = $(this).val();
					}else if(!$(this).val()){
						self.beforePasswd = $(this).val();
					}
				});
			}else{
				// オートコンプリートで入力した場合に、placeholderが消えないのでタイマーで監視する
				setInterval(function(){
					inputCheck(email);
					inputCheck(passwd);
				}, 300);
			}
		},
		setFocus : function(){
			if(!$("#_email").val()){
				$("#_email").focus();
			}
		}
	});
})(jQuery);
/**
 * 登録画面
 * https://ssl.naver.jp/join
 **/
(function($){
	nj.account.initRegistForm = function(){
		this.setPasswdCheck();
		this.setKeyupEvent();
		this.setUserUrl();
		this.setFocusEvent();
		this.setClickEvent();
		this.setValidateBlur();
		this.setSubmitEvent();
	};
	$.extend(nj.account.initRegistForm.prototype, nj.account.validate.prototype, {
		setPasswdCheck : function(){
				var rules = this.rules;
    			$("#_passwd").njPasswdCheck({
        			security  : rules.passwd.security.rule,
					required  : rules.passwd.required.rule,
					range     : rules.passwd.length.rule,
			        messages  : {
			            high   : '<p class="MdMsgCheck01 mdMsgCheck01High"><span class="mdMsgCheck01Ico"></span>' + this.passwordStrength.strong + '</p>',
			            middle : '<p class="MdMsgCheck01 mdMsgCheck01Medium"><span class="mdMsgCheck01Ico"></span>' + this.passwordStrength.mid + '</p>',
			            low    : '<p class="MdMsgCheck01 mdMsgCheck01Low"><span class="mdMsgCheck01Ico"></span>' + this.passwordStrength.weak + '</p>'
			        },
			        showError : function(bError, sMessage){
			        	$(this).closest(".MdInputTxt01").next().html(sMessage);
			        }
			});
		},

		// textboxにfocusがあたった場合、activeにする
		setFocusEvent : function(){
			var self = this;
		    $("input:text").focus(function(){
		        var id = this.id || this.name;
                console.log('id: %s', id);
				// ユーザ名のみマイページURLを表示する
		        if(id == "_userName"){
		            var _msgArea = $(this).closest(".MdInputTxt01").next();
		            if(_msgArea.children("P.MdMsgUserPage01").length == 0){
		                var _html = [];
		                _html.push(self.registerForm.url);
		                _html.push(self.registerForm.caution);
		                _msgArea.html(_html.join(""));
		            }
		        }
		    });
		},
		setClickEvent : function(){
		    // focusが外れた場合、非activeにする
		    $("input#rules:checkbox").click(function(){
		        if($(this).attr('checked') == true){
		            $("button[name='signup']").attr("disabled", "");
		        }else{
		            $("button[name='signup']").attr("disabled", "disabled");
		        }
		    });
		},
		setValidateBlur : function(){
			// パスワードのチェック結果をクリアする
			$("#_change_passwd").blur(function(){
				if($(this).val() === "") {
					$(this).closest(".MdInputTxt01").next("div").find(".MdMsgCheck01").hide();
				}
			});
		}
	});
})(jQuery);

(function($) {
		$.fn.njPasswdCheck = function(options){
		if(!this.length){
			return;
		}
		var defaults = {
			// 必須項目かどうか
			required : false,
			// パスワード長
			range : [],
			// 強度表示を行うかどうか
			security: false,
			
			// 1文字ずつ変換を行う場合の文字コード(●)
			replacement : "%u25CF",
			// 最後の1文字を●に変換するまでの間隔
			duration : 1000,
			showError: null,
			confirm : null,
			interval : 100
		};
		var messages = {
			required : null,
			range	 : null,
			format   : null,
			low		 : "低",
			middle	 : "中",
			high	 : "高",
			valid	  : "ok"
		};
		var attr = [
			"id",
			"class",
			"tabindex",
			"value",
			"maxlength",
			"name",
			"size"
		];
		
		this.options  = $.extend(defaults, options);
		this.messages = $.extend(messages, options.messages);
		this.attrs = {};
		this.browser = $.browser;

		var self = this;

		// イベントを設定(input時、blur時にパスワードチェックを行う)
		$(this).on('input blur', function() {
			self.checkPassword($(this).val());
		});

		this.checkPassword = function(sPass){

			var self = this;
			var sPasswd = getStr(sPass);
			// 必須チェックがある場合
			if(self.options.required){
				if(!sPasswd){
					self.showError(true, self.messages.required);
					self.middleChar = null;
					return;
				}
			}
			// formatチェックがある場合
			if(self.options.format){
				if(!/^[0-9a-zA-Z~\!\@\#\$\%\^\&\*\(\)_\+\|\{\}\:\"<>\?\'\-\=`]+$/i.test(sPasswd)){
					self.showError(true, self.messages.format);
					self.middleChar = null;
					return;
				}
			}
			// rangeチェックがある場合
			if(self.options.range){
				if(sPasswd.length < self.options.range[0] || self.options.range[1] < sPasswd.length){
					self.showError(true, self.messages.range);
					self.middleChar = null;
					return;
				}
			}
			// confirmチェックがある場合
			if(self.options.confirm){

				if(sPasswd){
					if(sPasswd != $(self.options.confirm).val()){
						self.showError(true, self.messages.confirm);
						self.middleChar = null;
						return;
					}
				}
				if($(self).val()) {
					console.log($(self).val());
					if($(self).val() != $(self.options.confirm).val()){
						self.showError(true, self.message.confirm);
					}
				}
			}
			
			// securityチェックがある場合
			if(self.options.security){
				// いったん中判定となったものは、弱判定を行わない
				var re = new RegExp("^" + escapeRegExp(self.middleChar));
				if(this.middleChar && !sPasswd.match(re)){
					this.middleChar = null;
				}
				var weak = checkWeak(sPasswd);
				if(!this.middleChar && weak){
					self.showError(false, self.messages.low);
					return;
				}
				var strong = checkStrong(sPasswd);
				if(strong){
					self.showError(false, self.messages.high);
					return;
				}
				self.showError(false, self.messages.middle);
				// 中の場合、パスワードの長さを保持する
				self.middleChar = sPasswd;
				return;
			}
			self.showError(false, self.messages.valid);			
		}
		this.showError = function(bError, sMessage){
			self.options.showError ? self.options.showError.call($("#" + $(self).attr('id')), bError, sMessage) : self.defaultShowError(sMessage);
		}
		this.defaultShowError = function(sMessage){
			var $target = $("#_passwd");
			// 既にラベルがある場合
			if($target.next().attr('for') == "_passwd"){
				$target.next().html(sMessage||"");
			}else{
				var label = $("<label />").attr({"for": "_passwd"}).html(sMessage||"");
				$target.after(label);
			}			
		}
		escapeRegExp = function(str){
			if(!str) return str;
			return str.replace(new RegExp("(#|;|&|,|\\.|\\+|\\*|~|'|:|\"|!|\\^|\\$|\\[|\\]|\\(|\\)|=|>|\\||\\/|\\\\)","g"),"\\$1");
		}
		getStr = function(oValue){
			var sValue = "";
			if(oValue === null){
				sValue = "";
			}else if(typeof oValue == "undefined"){
				sValue = "";
			}else if(typeof oValue == "number"){
				sValue = oValue.toString();
			}else{
				sValue = oValue;
			}
			return sValue;	  
		}
		/**
		 * @description パスワード強度が弱かチェックする
		 **/
		checkWeak = function(sPasswd){
			// すべて数字のみ
			if(sPasswd.match(/^\d*$/)){
				return true;
			}
			// すべてアルファベットのみ
			if(sPasswd.match(/^[a-zA-Z]*$/)){
				return true;
			}
			// 6文字のみ
			var minlen = self.options.range[0] || 6;
			if(sPasswd.length == minlen){
				return true;
			}
			// ある値が3回以上入力される場合
			if(sPasswd.match(/(.)\1{2,}/)){
				return true;
			}
			// パスワード全体が2個または3個の文字で構成された場合
			var judge = [];
			var len = sPasswd ? sPasswd.length : 0;
			for(var i = 0;i < len; i++){
				if($.inArray(sPasswd.charAt(i), judge) == -1){
					judge.push(sPasswd.charAt(i));
				}
			}
			if(judge.length <= 3){
				return true;
			}
			// 連続的な文字が2回以上重複入力される場合
			var match = sPasswd.match(/(.)\1{1,2}/g);
			var key = [];
			var len = match ? match.length : 0;
			for(var i = 0; i < len; i++){
				if($.inArray(match[i], key) != -1){
					return true;
				}
				key.push(match[i]);
			}
			return false;
		}
		/**
		 * @description パスワード強度が強かチェックする
		 **/
		checkStrong = function(sPasswd){
			// 8文字以上で、大/小文字、特殊文字、数字が混用されている
			if(sPasswd.length >= 8 &&
				sPasswd.match(/[a-zA-Z]/) &&
				sPasswd.match(/[0-9]/) &&
				sPasswd.match(/[~,!,@,#,$,%,^,&,*,(,),_,+,|,|,{,},:,\,",<,>,?,',-,=]/)
			){
				return true;
			}
			return false;
		}		
		return this;
	}
})(jQuery);