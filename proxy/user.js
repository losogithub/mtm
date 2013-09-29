/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 9/22/13
 * Time: 12:21 PM
 * To change this template use File | Settings | File Templates.
 */

var models = require('../models');
var User = models.User;

/**
 * 根据登录名查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} loginName 登录名
 * @param {Function} callback 回调函数
 */
var getUserByLoginName = function (loginName, callback) {
    User.findOne({'loginName': loginName}, callback);
};

/**
 * 根据用户名，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} name 用户名
 * @param {Function} callback 回调函数
 */
var getUserByName = function (name, callback) {
    User.findOne({name: name}, callback);
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
    User.findOne({email: email}, callback);
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
    User.find(query, {}, opt, callback);   // change the second arguments from [] to {}
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
    User.findOne({name: name, retrieve_key: key}, callback);
};

var getUserByEmail = function(email, key, callback){
    User.findOne({email: email, retrieve_key: key}, callback);
}

var newAndSave = function (name, loginName, password, email, active, callback) {
    var user = new User();
    user.name = name;
    user.loginName = loginName;
    user.password = password;
    user.email = email;
    user.active = active;
    user.save(callback);
};


exports.getUserByLoginName = getUserByLoginName;
exports.getUserByName = getUserByName;
exports.getUserByMail = getUserByMail;
exports.getUsersByQuery = getUsersByQuery;
exports.getUserByQuery = getUserByQuery;
exports.getUserByEmail = getUserByEmail;
exports.newAndSave = newAndSave;