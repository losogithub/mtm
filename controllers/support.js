/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 12/1/13
 * Time: 4:51 PM
 * To change this template use File | Settings | File Templates.
 */

var User = require('../proxy').User;
var models = require('../models');
var UserModel = models.User;
var topicSuggModel = models.TopicSuggestionModel;
var topicSuggLogModel = models.SuggestionTopicLogModel;


function topicSuggestion(req, res) {

    topicSuggModel.find({}, function (err, docs) {
        console.log('话题数量' + docs.length);
        for (i in docs) {
//            console.log(docs[i]._id);

        }
        res.render('support/topicsuggestion', {
            suggestions: docs
        });
    });
}


function addSuggestionTopic(req, res) {
    if (!req.session.userId) {
        res.redirect('/topicSuggestion');
        return;
    }

    if (!req.body.content) {
        res.redirect('/topicSuggestion');
        return;
    }

    console.log("session userId: ", req.session.userId);
    usermodel = new UserModel();
    UserModel.findById(req.session.userId, function (err, user) {

            console.log(user.loginName);
            console.log(req.body.content);


            var tsModelEntity = new topicSuggModel();
            tsModelEntity.content = req.body.content;
            tsModelEntity.proposer = user.loginName;
            tsModelEntity.save(function (error) {
                //

                if (error) {
                    console.log(error);
                } else {
                    console.log('saved OK!');
                }
            });

            res.redirect('/topicSuggestion');

        }
    );


}


function takeSuggestionTopic(req, res) {

//    var suggid = req.params.suggId;
//    console.log(suggid);

    if (!req.session.userId) {
        res.redirect('/topicSuggestion');
        return;
    }


    var suggid = req.body._id;

    usermodel = new UserModel();


    topicSuggModel.findById(suggid, function (err, topic) {

//        console.log('删除' + topic.content);

        topicSuggModel.remove({_id: suggid}, function (error) {
            if (error) {
                console.log(error);
            } else {


                UserModel.findById(req.session.userId, function (err, user) {
                    //记录日志
                    var tslogModelEntity = new topicSuggLogModel();
                    tslogModelEntity.content = topic.content;
                    tslogModelEntity.taker = user.loginName;
                    tslogModelEntity.proposer = topic.proposer;
                    tslogModelEntity.save(function (error) {

                    });
                });


                //

                if (error) {
                    console.log(error);
                } else {
                    console.log('saved OK!');
                }
            }

        });
    });


    res.redirect('/topicSuggestion');

}


function topicSuggestion(req, res) {

    topicSuggModel.find({}, function (err, docs) {
        console.log('话题数量' + docs.length);
        for (i in docs) {
//            console.log(docs[i]._id);

        }
        res.render('support/topicsuggestion', {
            suggestions: docs
        });
    });
}

function topicSuggestionLog(req, res) {

    topicSuggLogModel.find({}, function (err, docs) {
//        console.log('logs长度'+logs.length);

        res.render('support/topicSuggestionLog', {
            logs: docs
        });
    });
}


exports.topicSuggestion = topicSuggestion;
exports.addSuggestionTopic = addSuggestionTopic;
exports.takeSuggestionTopic = takeSuggestionTopic;
exports.topicSuggestionLog = topicSuggestionLog;

