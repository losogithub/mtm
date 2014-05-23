/**
 * Created by zan on 14-5-20.
 */
var mail = require('../services/mail');
var User = require('../proxy').User;

function showGroupEmail(req, res){
  if (!res.locals.isAdmin) {
      return res.send('您没有访问权限');
  }

  res.render('email/groupEmail', {
      js: ['/javascripts/send-group-mail.js']
  });
}

function sendGroupEmail(req, res){
    if (!res.locals.isAdmin) {
        return res.send('您没有访问权限');
    }
    var userListType = req.body.userListType;
    var subject = req.body.subject;
    var text = req.body.text;
    //todo: reform text to html.
   //recoginze newline; using p tag.
    /*
    step 1: get all the exptected users
     */
    if(userListType == "1"){
        User.getAllUserEmail(function(err, userList){
            mail.sendGroupMail(userList, subject, text);
        })
    }
    else if(userListType == "2"){
        User.getAllActiveUserEmail(function(err, userList){
            mail.sendGroupMail(userList, subject, text);
        })
    }
    else if(userListType == "3"){
        userList = [ {'email':'losoxoxo@qq.com'}, {'email':'395363381@qq.com'}, {'email':'losoadmi@qq.com'}, {'email':'stefanzan@163.com'}];
        mail.sendGroupMail(userList, subject, text);
    }
    res.send({"success": "1"});
}

exports.showGroupEmail = showGroupEmail;
exports.sendGroupMail=sendGroupEmail;