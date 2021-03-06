/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 9/22/13
 * Time: 3:26 PM
 * To change this template use File | Settings | File Templates.
 */

var mailer = require('nodemailer');
var config = require('../config');

var transport = mailer.createTransport('SMTP', config.mail_opts);

var SITE_ROOT_URL = 'http://' + config.hostname;

/**
 * Send an email
 * @param {Object} data 邮件对象
 */
var sendMail = function (data) {

  /*
    if (config.debug) {
        console.log('******************** 在测试环境下，不会真的发送邮件*******************');
        for (var k in data) {
            console.log('%s: %s', k, data[k]);
        }
        return;
    }*/
    // 遍历邮件数组，发送每一封邮件，如果有发送失败的，就再压入数组，同时触发mailEvent事件
    // the function said doesn't be implememted. 9.21.2013 taozan

    transport.sendMail(data, function (err) {
        if (err) {
          // 写为日志
          console.log(err);
        }
    });

};

/**
 * 发送激活通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} token 重置用的token字符串
 * @param {String} name 接收人的用户名
 * @param {String} email 接受人的邮件地址
 */
exports.sendActiveMail = function (who, token, name, email) {
  var from = config.mail_opts.auth.user;
  var to = who;
  var subject = config.name + ' 帐号激活';
  var url = SITE_ROOT_URL + '/activeAccount?key=' + token + '&email=' + email;
  var html = '<p>您好：<p/>' +
      '<p>我们收到您在' + config.name + '的注册信息，请点击下面的链接来激活帐户：</p>' +
      '<a href="' + url + '">' + url + '</a>' +
      '<p>若您没有在' + config.name + '填写过注册信息，说明有人滥用了您的电子邮箱，请删除此邮件，我们对给您造成的打扰感到抱歉。</p>' +
      '<p>' + config.name + ' 谨上。</p>';

  sendMail({
      from: from,
      to: to,
      subject: subject,
      html: html
  });
};

/**
 * 发送密码重置通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} token 重置用的token字符串
 * @param {String} name 接收人的用户名
 */
exports.sendResetPassMail = function (who, token, name) {
    var from = config.mail_opts.auth.user;
    var to = who;
    var subject = config.name + '密码重置';
    var html = '<p>您好：<p/>' +
        '<p>我们收到您在' + config.name + '重置密码的请求，请在24小时内单击下面的链接来重置密码：</p>' +
        '<a href="' + SITE_ROOT_URL + '/resetPassword?key=' + token + '&email=' + name + '">重置密码链接</a>' +
        '<p>若您没有在' + config.name + '填写过注册信息，说明有人滥用了您的电子邮箱，请删除此邮件，我们对给您造成的打扰感到抱歉。</p>' +
        '<p>' + config.name + ' 谨上。</p>';

    sendMail({
        from: from,
        to: to,
        subject: subject,
        html: html
    });
};


exports.sendGroupMail = function(userList, subject ,data){
    var from = config.mail_opts.auth.user;
    var subject = subject;
    var html = data;
    userList.forEach(function(to){
        sendMail({
            from: from,
            to: to.email,
            subject: subject,
            html: html
        });
    });
}