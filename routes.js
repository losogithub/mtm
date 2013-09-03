/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 12:43 AM
 * To change this template use File | Settings | File Templates.
 */
var topic = require('./controllers/topic');

module.exports = function(app) {
  app.get('/topic/create', topic.create);
}