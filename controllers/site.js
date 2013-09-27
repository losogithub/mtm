/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/27/13
 * Time: 11:42 PM
 * To change this template use File | Settings | File Templates.
 */
var index = function (req, res, next) {
  res.render('index', {
    title: 'mtm[我设计的信息。策展平台]',
    index: 1,
    css: ['/stylesheets/index.css'],
    js: ['/javascripts/index.js']
  });
}

exports.index = index;