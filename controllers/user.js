/**
 /**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/1/13
 * Time: 11:16 PM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');
var check = require('validator').check;
var sanitize = require('validator').sanitize;

var encryp = require('../helper/encryp');
var helper = require('../helper/helper');
var escape = helper.escape;

var Common = require('../common');
var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var config = require('../config');
var LoginToken = require('../proxy').LoginToken;

var utils = require('../public/javascripts/utils');

function showUsers(req, res, next) {
  User.getAllUsersSorted(function (err, users) {
    if (err) {
      return next(err);
    }

    if (!res.locals.isAdmin) {
      return res.send('您没有访问权限');
    }
    res.render('user/users', {
      layout: false,
      users: users,
      AuthorTopicCount: Common.AuthorTopicCount,
      AuthorPVCount: Common.AuthorPVCount
    });
  })
}

function showWorks(req, res, next) {

  //console.log(req.session);
  console.log("sort strategy: ")
  console.log(req.query.mt);
  console.log(req.query.mo);

  console.log("render show works page");
  User.getUserById(req.session.userId, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new Error(403));
    }

    //var topicsInfos = [];
    var mt = req.query.mt || 'p';
    var mo = req.query.mo || 'd';

    //the page to show. default 1
    var currentPage = parseInt(req.query.page) || 1;

    //use this function to get all the details of topics.
    getAndSortTopics(req.session.userId, mt, mo, function (err, topicDetails) {
      if (err) {
        return next(err);
      }
      //use a for to add some attributes
      if (!topicDetails.length) {
        console.log("err, cannot get topic details, but have topic ids");
        return renderWorks(res, user);
      }

      //count the totalPage for show
      var totalPage = Math.ceil(topicDetails.length / 10);

      var topicsForShow = [];
      for (var i = (currentPage - 1) * 10; i < topicDetails.length && i < currentPage * 10; i++) {
        var temp = topicDetails[i];
        temp.create_date = topicDetails[i].create_at.getFullYear() + '年'
          + (topicDetails[i].create_at.getMonth() + 1) + '月'
          + topicDetails[i].create_at.getDate() + '日';
        temp.update_date = topicDetails[i].update_at.getFullYear() + '年'
          + (topicDetails[i].update_at.getMonth() + 1) + '月'
          + topicDetails[i].update_at.getDate() + '日';
        topicsForShow.push(temp);
      }

      return renderWorks(res, user, topicsForShow, currentPage, totalPage, mt, mo, topicDetails.length);
    });
  });
}

/*
 Find topics inside TopicModel and sort them in a certain order.
 * works page
 */
function getAndSortTopics(authorId, mt, mo, callback) {
  var order = {
    'c': 'create_at',
    'u': 'update_at',
    'p': 'PV_count',
    'r': 'create_at'
  }[mt];
  if (mo == 'd') {
    order = '-' + order;
  }
  return Topic.getAllTopicsByAuthorIdSorted(authorId, order, callback);
}

function renderWorks(res, user, topicsInfos, currentPage, totalPage, mt, mo, length) {
  res.render('user/index', {
    css: [
      '/stylesheets/user.css'
    ],
    title: '我的策展',
    personalType: 'WORKS',
    user: user,
    topicsPageView: Common.AuthorPVCount[user.loginName],
    topicCount: length,
    topics: topicsInfos,
    currentPage: currentPage,
    totalPage: totalPage,
    mt: mt,
    mo: mo
  });
}

function showSettings(req, res, next) {
  var userId = req.session.userId;
  User.getUserById(userId, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new Error(404));
    }

    Topic.getAllTopicsByAuthorId(userId, function (err, topics) {
      if (err) {
        return next(err);
      }

      res.render('user/index', {
        css: [
          '/stylesheets/user.css'
        ],
        js: [
          '/javascripts/utils.js'
        ],
        pageType: 'PERSONAL',
        personalType: 'SETTINGS',
        user: user,
        topicCount: topics.length,
        topicsPageView: Common.AuthorPVCount[user.loginName],
        description: user.description,
        connectUrl: user.personalSite
      });
    });
  });
}

function updateSettings(req, res, next) {
  console.log("update Settings");
  var imageUrl = req.body.imageUrl;
  var description = req.body.description;
  var connectUrl = req.body.connectUrl;
  var userId = req.session.userId;

  User.getUserById(userId, function (err, user) {
    if (err) {
      console.log("cannot find userid: %s", userId);
      return next(err);
    }
    if (!user) {
      console.log("err cannot find user");
      return next(new Error(400));
    } else {
      if (imageUrl) {
        user.url = imageUrl;
      }
      //here a problem: if user clear his/her description, you also need to update too.
      user.description = description;


      //If the url is not empty, then check it and add http.
      if (connectUrl) {
        if (!utils.REGEXP_PROTOCOL.test(connectUrl)) {
          connectUrl = 'http://' + connectUrl;
        }
      }
      user.personalSite = connectUrl;

      user.save(function (err) {
        if (err) {
          console.log("save user info err in updateUser Info.");
          return next(err);
        }
      });
      res.send(200);
    }
  });
}


function showConfirmPassword(req, res) {
  res.render('user/accountVerify')
}

/*
 When user want to change his/her personal information.
 login first.
 */
function passwordVerify(req, res) {
  //user name also unique
  var username = res.locals.username;
  var pass = sanitize(req.body.password).trim();
  //console.log(req.body);
  console.log("name: %s", username);
  console.log("pass: %s", pass);
  User.getUserByLoginName(username, function (err, user) {
    if (err) {
      console.log("cannot find user by name: %s", username);
    }
    else if (!user) {
      console.log("null user");
      //but this shall not happen.
      //how to do ?
      res.render('user/accountVerify', {
        errMsg: '找不到该用户'
      })

    }
    else {
      //check the password
      //need md5 function
      console.log("check password");

      if (encryp.md5(pass) !== user.password) {
        //wrong password
        console.log("wrong password");
        //res.locals.errMsg =  '密码不正确';
        return res.render('user/accountVerify', {
          errMsg: '密码不正确'
        })
      }
      else {
        //correct password
        //redirect to other page: account private information setting.
        //here why redirect to login page ???
        var date = new Date(Date.now()).getTime().toString();
        console.log("current time: ");
        console.log(date);
        var auth = encryp.encrypt(date, 'mtm');
        return res.redirect('/accountModify?auth=' + auth);
      }

    }
  })

}

/*
 * show the account private info page.
 * */
function showAccountModify(req, res) {

  console.log("show AccountModify page");
  console.log(req.query);
  //check how long after login

  if (!req.query.auth) {
    return res.redirect('/account');
  }
  var auth = req.query.auth.toString();

  timeSpanCheck(auth, req, res);

  console.log(req.session.userId);
  User.getUserById(req.session.userId, function (err, user) {
    if (err) {
      console.log("err in showAccountModify");
    } else if (!user) {
      console.log("cannot find user By Id: %s", req.session.userId);
    } else {

      //get user gender;
      var genderTypeCd = user.gender;
      //add 2012.11.24 add user year;
      var birthday = user.birthday;
      console.log("((((((((((((((((((Birthday)))))))))");
      console.log(birthday);
      /*
       if(user.birthday){

       }*/

      var fChecked = '';
      var mChecked = '';
      var uChecked = '';
      if (genderTypeCd == 'F') {
        fChecked = 'checked';
      }
      else if (genderTypeCd == 'M') {
        mChecked = 'checked';
      }
      else if (genderTypeCd == 'U') {
        uChecked = 'checked';
      }
      else {
        fChecked = 'checked';
      }

      return res.render('user/account', {
        fChecked: fChecked,
        mChecked: mChecked,
        uChecked: uChecked,
        auth: auth,
        birthday: birthday
      })

    }
  });
}


var timeSpanCheck = function (auth, req, res) {

  console.log("---account modify: time Span check----");
  //2013.11.30 sometimes if user change the auth data, decrypt may crash.
  try {
    var loginTime = encryp.decrypt(auth, 'mtm');
  } catch (err) {
    return res.redirect('/account');
  }

//console.log("time stamp: %s", loginTime);
  var timeNow = new Date().getTime();
  if (timeNow - loginTime > 1 * 60 * 1000) //1 minutes
  {
    //console.log("timeNow: %s", timeNow);
    //console.log("need re-login");

    var auth = encryp.encrypt(timeNow.toString(), 'mtm');


    //clear everything ? yes in case you change your password

    //commented 2013.11.30
    /*
     if (req.session) {

     User.getUserById(req.session.userId, function (err, user) {
     if (err) {
     console.log("err");
     }
     else if (!user) {
     console.log("cannot find user by ID: %s", req.session.userId);
     }
     else {
     //combine email and series to make sure only only clear from on computer.
     LoginToken.removeAll(user.email);

     }
     })
     console.log("logout: session userId: %s", req.session.userId);
     req.session.destroy(function () {
     });
     } */

    //commented 2013.11.20
    //res.clearCookie('logintoken');
    //2013.11.30  change the url to /account
    //var url = '/login?fromUrl=/accountModify?auth=' + auth;
    var url = '/account';
    //console.log(url);
    return res.redirect(url);
  }
}


/**
 * update account private information page.
 *
 */
function accountModify(req, res) {
  var auth = req.body.auth.toString();
  timeSpanCheck(auth, req, res);

  console.log("accountModify");
  console.log(req.body);
  //console.log(req.body);
  //do password check then store in the db.
  //show update notification.
  var newPassword = req.body.newPassword;
  var newPasswordConfirm = req.body.newPasswordConfirm;
  var genderTypeCd = req.body.genderTypeCd;
  var birthYear = req.body.birthYear;

  //gender selection
  var fChecked = '';
  var mChecked = '';
  var uChecked = '';
  if (genderTypeCd == 'F') {
    fChecked = 'checked';
  }
  else if (genderTypeCd == 'M') {
    mChecked = 'checked';
  }
  else if (genderTypeCd == 'U') {
    uChecked = 'checked';
  }

//at least one is not empty
// e ne
// ne e
// ne ne
  if (newPassword || newPasswordConfirm) {
    //empty and not empty
    if ((!newPassword) && newPasswordConfirm) {
      return res.render('user/account', {
        passwordMsg: "请输入密码",
        fChecked: fChecked,
        mChecked: mChecked,
        uChecked: uChecked,
        auth: auth,
        birthday: birthYear
      })
    }

    // first not empty. check length.
    else if (newPassword.length < 6 || newPassword.length > 20) {
      return res.render('user/account', {
        passwordMsg: "密码长度介于6-20位数之间",
        fChecked: fChecked,
        mChecked: mChecked,
        uChecked: uChecked,
        auth: auth,
        birthday: birthYear
      })
    }

    // check equal
    else if (newPassword !== newPasswordConfirm) {
      return res.render('user/account', {
        confirmMsg: "两次密码不一样",
        fChecked: fChecked,
        mChecked: mChecked,
        uChecked: uChecked,
        auth: auth,
        birthday: birthYear
      })
    }
  }


  //Finally, update user info in DB.
  //console.log(req.session.userId);
  User.getUserById(req.session.userId, function (err, user) {
    if (err) {
      console.log("err happened");
    } else if (!user) {
      console.log("cannot find user by Id: %s", req.session.userId);
    } else {
      var uPFlag = false;
      var uGFlag = false;
      var uYFlag = false;

      //password updated
      if (newPassword) {
        console.log("newpass: %s", newPassword);
        uPFlag = true;
        user.password = encryp.md5(newPassword);
      }
      //gender updated
      if (user.gender !== genderTypeCd) {
        uGFlag = true;
        user.gender = genderTypeCd;
      }
      //birthday updated
      if (user.birthday !== birthYear) {
        uYFlag = true;
        user.birthday = birthYear;
      }

      if ((!uPFlag) && (!uYFlag) && (!uGFlag)) {
        //nothing is updated
        return res.render('user/account', {
          fChecked: fChecked,
          mChecked: mChecked,
          uChecked: uChecked,
          auth: auth,
          birthday: birthYear
        })
      }

      //save
      user.save(function (err) {
        if (err) {
          console.log("save user infor err. userId: %s", req.session.userId);
        } else {
          console.log("update user info success");
          var infoMsg = '';

          //this contain 3 true case
          if ((uPFlag && uGFlag) || (uPFlag && uYFlag) || (uGFlag && uYFlag) || uGFlag || uYFlag) {
            infoMsg = '个人信息更新成功';
          }
          else if (uPFlag) {
            infoMsg = '密码更新成功';
          }

          return res.render('user/account', {
            infoMsg: infoMsg,
            fChecked: fChecked,
            mChecked: mChecked,
            uChecked: uChecked,
            auth: auth,
            birthday: birthYear
          })

        }
      })
    }
  })

}


function showPersonal(req, res, next) {

  //before render: check whether visitor is itself or not.
  //if so, jump to works page.
  //else show.

  //1.-----------------------------------
  //visitor is not login ok
  //visitor has login then check whether the same.
  var authorName = req.params.authorName;
  console.log("authorName: %s", req.params.authorName);
  //login user and the same with the author of this one
  // jump to works page
  if (req.session.userId && req.currentUser
    && req.currentUser.loginName == authorName) {
    //jump to works page
    console.log("the same person, jump to works");
    return res.redirect('/works');
  }

  //2---------------------------------------
  var sortOrder = req.query.order || 'U';
  // default order is according to update date. 'F' means favourte, i.e. likes
  // 'N' means name

  var currentPage = parseInt(req.query.page) || 1;
  //default currentPage is the first page.

  User.getUserByLoginName(authorName, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new Error(404));
    }
    //found the author information in DB

    //if the description contains some text url link.
    var description = user.description;
    //here must check whether it is empty or not.
    //bug fixed.
    if (description) {
      description = escape(user.description);
      //description = balinkify.linkify(description, {target: " "})  ;
      description = helper.linkify(description);
    }
    //console.log(description);

    //check the like, whether the viewer liked author before
    var likedBefore = false;

    if (req.session.userId && (req.session.userId != 'undefined')) {
      var fList = user.favouriteList;
      var viewerId = req.session.userId;
      for (var i = 0; i < fList.length; i++) {
        if (viewerId == fList[i]) {
          likedBefore = true;
          break;
        }
      }
    }

    //getAndSort all the topics according to
    //P or J
    //Inner: U F N

    //1. Personal work
    getSortedTopicsforShow(user._id, sortOrder, function (err, topicsInfo) {
      if (err) {
        return next(err);
      }
      /*
       //null topics has no problem
       else if(!topicsInfo){
       console.log("err: null topics");
       }*/

      //sorted topics
      console.log("topics length: ", topicsInfo.length);

      //here according to TotalTopic decide totalPage and currentPage topics
      var totalPage = Math.ceil(topicsInfo.length / 10);


      //console.log(topicsInfo);
      //create a template arrary,
      //then push all the topics into this arrary for show.
      var topicsForShow = [];
      for (var i = (currentPage - 1) * 10; i < topicsInfo.length && i < currentPage * 10; i++) {
        var temp = topicsInfo[i];
        temp.create_date = topicsInfo[i].create_at.getFullYear() + '-'
          + (topicsInfo[i].create_at.getMonth() + 1) + '-'
          + topicsInfo[i].create_at.getDate();
        temp.update_date = topicsInfo[i].update_at.getFullYear() + '-'
          + (topicsInfo[i].update_at.getMonth() + 1) + '-'
          + topicsInfo[i].update_at.getDate();
        topicsForShow.push(temp);
      }

      //before render: deal with more than one page.

      res.render('user/index', {
        title: user.loginName + ' 的策展',
        personalType: 'PERSONAL',
        css: ['/stylesheets/user.css'],
        user: user,
        authorDescription: description,
        topicCount: topicsInfo.length,
        topicsPageView: Common.AuthorPVCount[user.loginName],
        topics: topicsForShow,
        sortOrder: sortOrder,
        totalPage: totalPage,
        currentPage: currentPage,
        likedBefore: likedBefore
      });
    });
  });
}


var getSortedTopicsforShow = function (authorId, sortName, callback) {

  if (sortName == 'U') {
    //according to update time
    //this is default
    return Topic.getPublishedTopicsByAuthorIdSorted(authorId, '-update_at', callback);
  }
  else if (sortName == 'F') {
    //accordiing to liked count
    //todo: changed to favourite count.
    return Topic.getPublishedTopicsByAuthorIdSorted(authorId, '-FVCount', callback);
  } else if (sortName == 'N') {
    //according to Name
    return Topic.getPublishedTopicsByAuthorIdSorted(authorId, 'title', callback);
  }
}

function favorite(req, res, next) {
  var authorName = req.body.authorName;
  var toLike = sanitize(req.body.toLike).toBoolean();
  var viewerId = req.session.userId;

  //extract the author model and update the favourite and favouriteList.
  User.getUserByLoginName(authorName, function (err, author) {
    if (err) {
      console.log("find user err");
      return next(err);
    }
    if (!author) {
      console.log("cannot find user by name: %s", authorName);
      return next(new Error(400));
    }
    if (toLike) {
      if (author.favouriteList.indexOf(viewerId) == -1) {
        author.favouriteList.push(viewerId);
        author.favourite += 1;
      }
    } else {
      var index = author.favouriteList.indexOf(viewerId);
      if (index > -1) {
        author.favouriteList.splice(index, 1);
        author.favourite -= 1;
      }
    }
    author.save(function (err) {
      if (err) {
        console.log("save err in getUserByLoginName func");
        return next(err);
      }

      //extract the user and update the likeList
      User.getUserById(viewerId, function (err, viewer) {
        if (err) {
          console.log('find user err');
          return next(err);
        }
        if (!viewer) {
          console.log("cannot find the user by id: %s", viewerId);
          return next(new Error(400));
        }
        if (toLike) {
          if (viewer.likeList.indexOf(author._id) == -1) {
            viewer.likeList.push(author._id);
          }
        } else {
          var index = viewer.likeList.indexOf(author._id);
          if (index > -1) {
            viewer.likeList.splice(index, 1);
          }
        }

        viewer.save(function (err) {
          if (err) {
            console.log("save err");
            return next(err);
          }
          res.send({favourite: author.favourite });
        })
      });
    });
  });
}

exports.showUsers = showUsers;
exports.showWorks = showWorks;
exports.showSettings = showSettings;
exports.updateSettings = updateSettings;
exports.showConfirmPassword = showConfirmPassword;
exports.passwordVerify = passwordVerify;
exports.showAccountModify = showAccountModify;
exports.accountModify = accountModify;
exports.showPersonal = showPersonal;
exports.favorite = favorite;
