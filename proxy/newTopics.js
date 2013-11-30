/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/7/13
 * Time: 2:56 PM
 * To change this template use File | Settings | File Templates.
 */
var extend = require('extend');

var models = require('../models');
var NewTopicModel = models.NewTopicModel;

//must be loaded from db.
// otherwise you can not restart server.


/**
 * 获取人气总结
 */
function getNewTopics(callback) {
  NewTopicModel.find().sort('-update_at')
    .exec(callback);
}

function updateNewTopics(topics) {
  console.log("更新最新总结列表");
  console.log(topics.length);
  global.recentUpdatedTopicsData = [];
  topics = topics || [];
  topics.forEach(function (topic) {
    global.recentUpdatedTopicsData.push({
      id: topic._id,
      coverUrl: topic.cover_url,
      title: topic.title,
      author: topic.author_name,
      PVCount: topic.PV_count,
      des: topic.description
    });
  });
}

function saveNewTopic(topic, callback) {
  var newTopic = new NewTopicModel();
  newTopic._id = undefined;
  newTopic = extend(true, topic, newTopic);

  NewTopicModel.findByIdAndRemove(newTopic._id, function (err, doc) {
    if (err) {
      if (typeof callback === 'function') {
        callback(err);
      }
      return;
    }
    newTopic.save(function (err, doc) {
      if (err) {
        if (typeof callback === 'function') {
          callback(err);
        }
        return;
      }
      console.log("new topics save to updated topics list");

      getNewTopics(function (err, topics) {
        if (err) {
          callback(err);
        }

        //the new topics can only be 5. if more than 5, delete the old one
        if (topics.length <= 5) {
          updateNewTopics(topics);
          return;
        }

        //always delete the first one
        NewTopicModel.findByIdAndRemove(topics[5]._id, function (err, doc) {
          if (err) {
            if (typeof callback === 'function') {
              callback(err);
            }
            return;
          }
          console.log("delete old topics success");
          updateNewTopics(topics.slice(0, 5));
        });
      });
    });
  });
}

function deleteNewTopic(topicId) {
  NewTopicModel.findByIdAndRemove(topicId, function (err) {
    if (err) {
      return;
    }
    getNewTopics(function (err, topics) {
      if (err) {
        return;
      }
      updateNewTopics(topics);
    })
  });
}

exports.getNewTopics = getNewTopics;
exports.updateNewTopics = updateNewTopics;
exports.saveNewTopic = saveNewTopic;
exports.deleteNewTopic = deleteNewTopic;
