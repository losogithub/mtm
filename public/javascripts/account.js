window.shizier = window.shizier || {};
shizier.account = shizier.account || {};
(function ($) {
  shizier.account.validate = function () {
  }
  shizier.account.validate.prototype = {
    rules: {
      required: true,
      range: [6, 20],
      format: true,
      security: true
    },
    resend: {
      send: '我们已经给你的邮箱发了一封激活邮件。',
      error: '临时错误。<br>请稍等。'
    },
    setPasswdCheckConfirm: function () {
      var rules = this.rules;
      $("#_passwd").shizierPasswdCheck(rules);
      $("#_passwd_confirm").shizierPasswdCheck($.extend(rules, {
        confirm: '#_passwd'
      }));
    }
  }
})(jQuery);

/**
 * /account
 **/
(function ($) {
  shizier.account.initAccountInfoChangeForm = function () {
    this.setPasswdCheckConfirm();
  }
  $.extend(shizier.account.initAccountInfoChangeForm.prototype, shizier.account.validate.prototype);
})(jQuery);
/**
 * /accountVerify
 **/
(function ($) {
  shizier.account.initMailChangeForm = function () {
    this.setPasswdCheck();
  }
  $.extend(shizier.account.initMailChangeForm.prototype, shizier.account.validate.prototype, {
    setPasswdCheck: function () {
      $("#_passwd").shizierPasswdCheck({
        required: this.required,
        showError: function (bError, sMessage) {
          if (!bError) {
            $(this).next().html('');
          }
        }
      });
    }
  });
})(jQuery);

/**
 * /resetPassword
 **/
(function ($) {
  shizier.account.initPasswdResetForm = function () {
    this.setPasswdCheckConfirm();
  }
  $.extend(shizier.account.initPasswdResetForm.prototype, shizier.account.validate.prototype);
})(jQuery);
/**
 * /signup
 **/
(function ($) {
  shizier.account.initRegistForm = function () {
    this.setPasswdCheck();
  };
  $.extend(shizier.account.initRegistForm.prototype, shizier.account.validate.prototype, {
    setPasswdCheck: function () {
      $("#_passwd").shizierPasswdCheck(this.rules);
    }
  });
})(jQuery);

(function ($) {
  $.fn.shizierPasswdCheck = function (options) {
    if (!this.length) {
      return;
    }
    var defaults = {
      // 必須項目かどうか
      required: false,
      // パスワード長
      range: [],
      // 強度表示を行うかどうか
      security: false,

      // 1文字ずつ変換を行う場合の文字コード(●)
      replacement: "%u25CF",
      // 最後の1文字を●に変換するまでの間隔
      duration: 1000,
      showError: null,
      confirm: null,
      interval: 100
    };
    var messages = {
      required: null,
      range: "密码太短",
      format: '含有非法字符',
      high: '<span class="SafetyHigh"><i class="icon-ok"></i> 高</span>',
      middle: '<span class="SafetyMiddle"><i class="icon-ok"></i> 中</span>',
      low: '<span class="SafetyLow"><i class="icon-ok"></i> 低</span>',
      confirm: '两次输入不一致',
      valid: "ok"
    };

    this.options = $.extend(defaults, options);
    this.messages = $.extend(messages, options.messages);

    var self = this;

    // イベントを設定(input時、blur時にパスワードチェックを行う)
    $(this).on('input blur', function () {
      self.checkPassword($(this).val());
    });

    this.checkPassword = function (sPass) {

      var self = this;
      var sPasswd = getStr(sPass);
      // 必須チェックがある場合
      if (self.options.required) {
        if (!sPasswd) {
          self.showError(true, self.messages.required);
          self.middleChar = null;
          return;
        }
      }
      // formatチェックがある場合
      if (self.options.format) {
        if (!/^[0-9a-zA-Z~!@#$%^&*()_+|{}:"<>?'-=`]+$/i.test(sPasswd)) {
          self.showError(true, self.messages.format);
          self.middleChar = null;
          return;
        }
      }
      // rangeチェックがある場合
      if (self.options.range) {
        if (sPasswd.length < self.options.range[0] || self.options.range[1] < sPasswd.length) {
          self.showError(true, self.messages.range);
          self.middleChar = null;
          return;
        }
      }
      // confirmチェックがある場合
      if (self.options.confirm) {

        if (sPasswd) {
          if (sPasswd != $(self.options.confirm).val()) {
            self.showError(true, self.messages.confirm);
            self.middleChar = null;
            return;
          }
        }
        if ($(self).val()) {
          console.log($(self).val());
          if ($(self).val() != $(self.options.confirm).val()) {
            self.showError(true, self.message.confirm);
          }
        }
      }

      // securityチェックがある場合
      if (self.options.security) {
        // いったん中判定となったものは、弱判定を行わない
        var re = new RegExp("^" + escapeRegExp(self.middleChar));
        if (this.middleChar && !sPasswd.match(re)) {
          this.middleChar = null;
        }
        var weak = checkWeak(sPasswd);
        if (!this.middleChar && weak) {
          self.showError(false, self.messages.low);
          return;
        }
        var strong = checkStrong(sPasswd);
        if (strong) {
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
    this.showError = function (bError, sMessage) {
      self.options.showError ? self.options.showError.call(self, bError, sMessage) : self.defaultShowError(sMessage);
    }
    this.defaultShowError = function (sMessage) {
      $(this).next().html(sMessage);
    }
    var escapeRegExp = function (str) {
      if (!str) return str;
      return str.replace(new RegExp("(#|;|&|,|\\.|\\+|\\*|~|'|:|\"|!|\\^|\\$|\\[|\\]|\\(|\\)|=|>|\\||\\/|\\\\)", "g"), "\\$1");
    }
    var getStr = function (oValue) {
      var sValue = "";
      if (oValue === null) {
        sValue = "";
      } else if (typeof oValue == "undefined") {
        sValue = "";
      } else if (typeof oValue == "number") {
        sValue = oValue.toString();
      } else {
        sValue = oValue;
      }
      return sValue;
    }
    /**
     * @description パスワード強度が弱かチェックする
     **/
    checkWeak = function (sPasswd) {
      // すべて数字のみ
      if (sPasswd.match(/^\d*$/)) {
        return true;
      }
      // すべてアルファベットのみ
      if (sPasswd.match(/^[a-zA-Z]*$/)) {
        return true;
      }
      // 6文字のみ
      var minlen = self.options.range[0] || 6;
      if (sPasswd.length == minlen) {
        return true;
      }
      // ある値が3回以上入力される場合
      if (sPasswd.match(/(.)\1{2,}/)) {
        return true;
      }
      // パスワード全体が2個または3個の文字で構成された場合
      var judge = [];
      var len = sPasswd ? sPasswd.length : 0;
      for (var i = 0; i < len; i++) {
        if ($.inArray(sPasswd.charAt(i), judge) == -1) {
          judge.push(sPasswd.charAt(i));
        }
      }
      if (judge.length <= 3) {
        return true;
      }
      // 連続的な文字が2回以上重複入力される場合
      var match = sPasswd.match(/(.)\1{1,2}/g);
      var key = [];
      var len = match ? match.length : 0;
      for (var i = 0; i < len; i++) {
        if ($.inArray(match[i], key) != -1) {
          return true;
        }
        key.push(match[i]);
      }
      return false;
    }
    /**
     * @description パスワード強度が強かチェックする
     **/
    checkStrong = function (sPasswd) {
      // 8文字以上で、大/小文字、特殊文字、数字が混用されている
      if (sPasswd.length >= 8 &&
        sPasswd.match(/[a-zA-Z]/) &&
        sPasswd.match(/[0-9]/) &&
        sPasswd.match(/[~!@#$%^&*()_+|{}:"<>?'-=`]/)
        ) {
        return true;
      }
      return false;
    }
    return this;
  }
})(jQuery);