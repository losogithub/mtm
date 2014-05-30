/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 9/22/13
 * Time: 12:21 PM
 * To change this template use File | Settings | File Templates.
 */
var UserModel = require('../models').User;

var createUser = function (name, loginName, password, email, callback) {
  var user = new UserModel();
  user.name = name;
  user.loginName = loginName;
  user.password = password;
  user.email = email;
  user.save(callback);
};

var getActivedAuthors = function (callback) {
  UserModel.find({'active': true}, callback);
};

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
  UserModel.findOne({email: email.toLowerCase()}, callback);
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
  UserModel.findOne({email: email.toLowerCase(), password: pass}, callback);
}

// here is Email need a key
var getUserByEmail = function (email, key, callback) {
  UserModel.findOne({email: email.toLowerCase(), retrieve_key: key}, callback);
}

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

var getUserByIds = function (ids, callback) {
  UserModel.find({ _id: { $in: ids } }, callback);
};

function getAllUsers(callback){
  UserModel.find(callback);
}

function getAllUsersSorted(callback){
  UserModel.find()
    .sort('-_id')
    .exec(callback);
}

function getAllUserEmail(callback){
    UserModel.find({}, 'email', callback);
}

function getAllActiveUserEmail(callback){
    UserModel.find({'active': true}, 'email', callback);
}

function increaseMessageCount(_id, callback) {
  UserModel.findByIdAndUpdate(_id, { $inc: { messageCount: 1 } }).exec(callback);
}

function resetMessageCount(user, callback) {
  callback = callback || function () {
  };

  user.messageCount = 0;
  user.save(function (err, user) {
    callback(err, user);
  });
}


exports.createUser = createUser;
exports.getActivedAuthors = getActivedAuthors;
exports.getUserById = getUserById;
exports.getUserByIds = getUserByIds;
exports.getUserByLoginName = getUserByLoginName;
exports.getUserByName = getUserByName;
exports.getUserByMail = getUserByMail;
exports.getUsersByQuery = getUsersByQuery;
exports.getUserByQuery = getUserByQuery;
exports.getUserByEmail = getUserByEmail;
exports.getUserByNamePass = getUserByNamePass;
exports.getUserByEmailPass = getUserByEmailPass;
exports.getAllUsers = getAllUsers;
exports.getAllUsersSorted = getAllUsersSorted;
exports.getAllUserEmail = getAllUserEmail;
exports.getAllActiveUserEmail = getAllActiveUserEmail;
exports.increaseMessageCount = increaseMessageCount;
exports.resetMessageCount = resetMessageCount;