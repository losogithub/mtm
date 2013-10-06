/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/5/13
 * Time: 8:51 PM
 * To change this template use File | Settings | File Templates.
 */
/**
 * 需要管理员权限
 */
var loginRequired = function (req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
    //todo:  show a login frame.
  }
  next();
};

exports.loginRequired = loginRequired;