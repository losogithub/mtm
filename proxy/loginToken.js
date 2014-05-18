/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/7/13
 * Time: 1:19 PM
 * To change this template use File | Settings | File Templates.
 */
var LoginToken = require('../models').LoginToken;

var randomToken = function() {
  return Math.round((new Date().valueOf() * Math.random())) + '';
}

var save = function(email, callback) {
  // Automatically create the tokens
  var loginToken = new LoginToken();
  loginToken.email = email;
  loginToken.token = this.randomToken();
  loginToken.series = this.randomToken();
  loginToken.save(callback(loginToken));
}

var find = function(email,series, token, callback){
  LoginToken.findOne({email: email, series: series, token: token}, callback);
}

var findByEmailAndSeries = function(email, series, callback){
  LoginToken.findOne({email: email, series: series}, callback);
}

var remove = function(email, series){
  findByEmailAndSeries(email, series, function(err, logintoken){
    if(err){
      console.log("cannot find logintoken");
      next(err);
    }
    else if (!logintoken){
      console.log("no logintoken matched.")
    }
    else {
      console.log("LoginToken: ", logintoken)
      logintoken.remove(function(err, logintoken){
        if(err){console.log("remove logintoken err");}
        else {
          console.log("remove logintoken successfully!");
        }
      });
    }
  })

 /*
  LoginToken.remove({email: email, series: series}, function(err){
    if (err){
      console.log("cannot find user email from LoginToken.");
      next(err);
    }  else {
      console.log("err", err);
      console.log("remove loginToken successfully");
    }
  });*/
}

var removeAll = function(email){
  LoginToken.remove({email: email}, function(err){
    if (err){
      console.log("cannot find user email from LoginToken.");
      next(err);
    }
  });
}

exports.save = save;
exports.randomToken = randomToken;
exports.find = find;
exports.remove = remove;
exports.findByEmailAndSeries = findByEmailAndSeries;
exports.removeAll = removeAll;