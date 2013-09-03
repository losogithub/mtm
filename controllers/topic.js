/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 12:55 AM
 * To change this template use File | Settings | File Templates.
 */
var create = function(req, res, next) {
  res.render('topic/edit', {title: 'mtm', css: '/stylesheets/edit.css', js: '/javascripts/edit.js'});
}

exports.create = create;