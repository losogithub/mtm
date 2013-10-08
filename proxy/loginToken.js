/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/7/13
 * Time: 1:19 PM
 * To change this template use File | Settings | File Templates.
 */
var models = require('../models');
var LoginToken = models.LoginToken;

var randomToken = function() {
  return Math.round((new Date().valueOf() * Math.random())) + '';
}

var save = function(email, callback) {
  // Automatically create the tokens
  var loginToken = new LoginToken();
  loginToken.email = email;
  loginToken.token = this.randomToken(); //shall I use this here ?
  loginToken.series = this.randomToken();
  loginToken.save(callback(loginToken));
}

var find = function(email,series, token, callback){
  LoginToken.findOne({email: email, series: series, token: token}, callback);
}

var remove = function(email, callback){
  LoginToken.remove({email: email}, function(err){
    //handle err
    if(err){
      console.log("LoginToken remove err");
    }
  })
}
exports.save = save;
exports.randomToken = randomToken;
exports.find = find;
exports.remove = remove;