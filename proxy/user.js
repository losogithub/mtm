/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 9/22/13
 * Time: 12:21 PM
 * To change this template use File | Settings | File Templates.
 */
var EventProxy = require('eventproxy');

var models = require('../models');
var UserModel = models.User;

/**
 * 根据登录名查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} loginName 登录名
 * @param {Function} callback 回调函数
 */
var getUserByLoginName = function (loginName, callback) {
  UserModel.findOne({'loginName': loginName}, callback);
};

/**
 * 根据用户名，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} name 用户名
 * @param {Function} callback 回调函数
 */
//deprecated
//not use this one.
//use LoginName
var getUserByName = function (name, callback) {
  UserModel.findOne({name: name}, callback);
};

/**
 * 根据邮箱，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} email 邮箱地址
 * @param {Function} callback 回调函数
 */
var getUserByMail = function (email, callback) {
  UserModel.findOne({email: email}, callback);
};

/**
 * 根据关键字，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {String} query 关键字
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
var getUsersByQuery = function (query, opt, callback) {
  UserModel.find(query, {}, opt, callback);   // change the second arguments from [] to {}
};

/**
 * 根据查询条件，获取一个用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} name 用户名
 * @param {String} key 激活码
 * @param {Function} callback 回调函数
 */
var getUserByQuery = function (name, key, callback) {
  UserModel.findOne({name: name, retrieve_key: key}, callback);
};

var getUserByNamePass = function (name, pass, callback) {
  UserModel.findOne({loginName: name, password: pass}, callback);
}

var getUserByEmailPass = function (email, pass, callback) {
  UserModel.findOne({email: email, password: pass}, callback);
}

// here is Email need a key
var getUserByEmail = function (email, key, callback) {
  UserModel.findOne({email: email, retrieve_key: key}, callback);
}

var newAndSave = function (name, loginName, password, email, active, callback) {
  var user = new UserModel();
  user.name = name;
  user.loginName = loginName;
  user.password = password;
  user.email = email;
  user.active = active;
  user.save(callback);
};

/**
 * 根据用户ID，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} id 用户ID
 * @param {Function} callback 回调函数
 */
var getUserById = function (id, callback) {
  UserModel.findById(id, callback);
};

var appendTopic = function (id, topicId, callback) {
  var ep = new EventProxy().fail(callback);
  UserModel.findById(id, ep.done(function (user) {
    if (!user) {
      ep.emit('error', new Error(404))
      return;
    }

    var topics = user.topics;
    var length = topics.length;
    for (var i = 0; i < length; i++) {
      if (topics[i] == topicId) {
        if (typeof callback === 'function') {
          callback(null, user);
          return;
        }
      }
    }
    user.topics.push(topicId);
    user.topicCount++;
    user.save(ep.done(function () {
      if (typeof callback === 'function') {
        callback(null, user);
      }
    }));
  }));
}

function deleteTopic(authorId, topicId, callback) {
  callback = callback || function () {
  };
  UserModel.findById(authorId, function (err, author) {
    if (err) {
      callback(err)
      return;
    }
    if (!author) {
      callback(new Error(404))
      return;
    }
    author.topics.pull(topicId);
    author.topicCount = author.topics.length;
    author.save(callback);
  });
}

exports.getUserById = getUserById;
exports.getUserByLoginName = getUserByLoginName;
exports.getUserByName = getUserByName;
exports.getUserByMail = getUserByMail;
exports.getUsersByQuery = getUsersByQuery;
exports.getUserByQuery = getUserByQuery;
exports.getUserByEmail = getUserByEmail;
exports.newAndSave = newAndSave;
exports.appendTopic = appendTopic;
exports.deleteTopic = deleteTopic;
exports.getUserByNamePass = getUserByNamePass;
exports.getUserByEmailPass = getUserByEmailPass;