/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 12:43 AM
 * To change this template use File | Settings | File Templates.
 */
var site = require('./controllers/site');
var topic = require('./controllers/topic');
var sign = require('./controllers/sign');

module.exports = function (app) {
  // home page
  app.get('/', site.index);
  app.get('/home', site.index);

  //console.log("router start");

  app.get('/topic/create', topic.create);
  app.get('/topic/getid', topic.getId);
  app.get('/topic/getcontents', topic.getContents);
  app.get('/topic/:topicId', topic.index);
  app.post('/topic/createitem', topic.createItem);
  app.put('/topic/edititem', topic.editItem);
  app.put('/topic/sort', topic.sort);
  app.put('/topic/publish', topic.publish);
  app.delete('/topic/deleteitem', topic.deleteItem);



    // sign up, login, logout
    app.get('/signup', sign.showSignUp);
    app.get('/registerAccount', sign.signup);
    app.post('/signup', sign.signup);
    app.post('/registerAccount', sign.signup);
    app.get('/login', sign.showLogin);
    app.post('/login', sign.login);
    app.get('/signout', sign.signout);


    /*
    app.get('/active_account', sign.active_account);

    // password
    app.get('/search_pass', sign.showSearchPass);
    app.post('/search_pass', sign.updateSearchPass);
    app.get('/reset_pass', sign.reset_pass);
    app.post('/reset_pass', sign.update_pass);
*/
}