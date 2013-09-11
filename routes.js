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
  app.get('/topic/getid', topic.getId);
  app.get('/topic/getcontents', topic.getContents);
  app.post('/topic/create', topic.post);
  app.put('/topic/sort', topic.sort);
}