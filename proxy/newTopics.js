/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/7/13
 * Time: 2:56 PM
 * To change this template use File | Settings | File Templates.
 */
var models = require('../models');
var NewTopicModel = models.NewTopicModel;

var User = require('../proxy').User;

//var fifo = require('fifo');

//must be loaded from db.
// otherwise you can not restart server.


/**
 * 获取人气总结
 */
function getNewTopics(callback) {
  NewTopicModel.find().sort('-update_at')
    .exec(callback);
}


function saveNewTopic(authorId, topicId, title, coverUrl, description, callback) {
  var newTopic = new NewTopicModel();

    getNewTopics(function(err, topics){
      if(err){next(err);}


      //the new topics can only be 5. if more than 5, delete the old one
      var topicIdtoDelete;
      var deleteTag = false;
      if(topics.length == 5 ) {
        topicIdtoDelete = topics[4]._id;
        deleteTag = true;
      }

    User.getUserById(authorId, function(err, author){

      if(err){return;}

      newTopic.title = title;
      newTopic.cover_url = coverUrl;
      newTopic.description = description;
      newTopic.author_id = authorId;
      newTopic._id = topicId;
      newTopic.author_name = author.loginName;
      newTopic.update_at = Date.now();
      newTopic.save();
      console.log("new topics save to updated topics list");


      //remove one from the head
      if (deleteTag){
        //always delete the first one
        NewTopicModel.findOneAndRemove({"_id": topicIdtoDelete}, function(err, doc){
          if(err){
            next(err);
          }
          console.log("delete old topics success");
        });
      } //if

    }) //User.getUserById

    })//getNewTopics

}

exports.getNewTopics = getNewTopics;
exports.saveNewTopic = saveNewTopic;
