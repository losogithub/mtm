/**
 /**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/1/13
 * Time: 11:16 PM
 * To change this template use File | Settings | File Templates.
 */
var check = require('validator').check;
var sanitize = require('validator').sanitize;

var encryp = require('../helper/encryp');
var helper = require('../helper/helper');
var escape = helper.escape;


var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var config = require('../config');
var LoginToken = require('../proxy').LoginToken;

var utils = require('../public/javascripts/utils');

var showWorks = function (req, res, next) {

  //console.log(req.session);
  console.log("sort strategy: ")
  console.log(req.query.mt);
  console.log(req.query.mo);

  res.locals.path = req.path.replace(/\/$/, '');

  console.log("render show works page");
  User.getUserById(req.session.userId, function (err, user) {
    if (err) {
      return next(err)
    }
    if (!user) {
      //if cannot find user by userId. the userId must be wrong.
      //usually this shall not happen. If user have already login.
      console.err("cannot find user by userId");
      req.session.userId = null;
      return res.render('/login');
    }

    var topics = user.topics;
    //var topicsInfos = [];
    var mt = req.query.mt || 'p';
    var mo = req.query.mo || 'd';

    //the page to show. default 1
    var currentPage = req.query.page || 1;


    //empty topics
    //todo: empty topics shall show you have no topics
    if (!topics) {
      return renderWorks(user, [], '', '', '', res);
    }
    //use this function to get all the details of topics.
    getAndSortTopics(mt, mo, topics, function (err, topicDetails) {
      if (err) {
        console.log("err");
        return;
      } else {
        //use a for to add some attributes
        if (!topicDetails) {
          console.log("err, cannot get topic details, but have topic ids");
          //???? shall return or not
          return;
        }

        //count the totalPage for show
        var totalPage = Math.ceil(topicDetails.length / 10);


        var topicsForShow = [];
        for (var i = (currentPage - 1) * 10; i < topicDetails.length && i < currentPage * 10; i++) {
          var temp = topicDetails[i];
          temp.topicUrl = "/topic/" + topicDetails[i]._id;
          temp.create_date = topicDetails[i].create_at.getFullYear() + '年'
            + (topicDetails[i].create_at.getMonth() + 1) + '月'
            + topicDetails[i].create_at.getDate() + '日';
          topicsForShow.push(temp);
        }


        //render according to different attributes.
        if (mt == 'c') {
          if (mo == 'd') {
            return renderWorks(user, topicsForShow, 'SELECTED', '', '', '', 'a', 'd', 'd', 'd', currentPage, totalPage, res);
          } else {
            return renderWorks(user, topicsForShow, 'SELECTED', '', '', '', 'd', 'd', 'd', 'd', currentPage, totalPage, res);
          }
        }
        if (mt == 'u') {
          if (mo == 'd') {
            return renderWorks(user, topicsForShow, '', 'SELECTED', '', '', 'd', 'a', 'd', 'd', currentPage, totalPage, res);
          } else {
            return renderWorks(user, topicsForShow, '', 'SELECTED', '', '', 'd', 'd', 'd', 'd', currentPage, totalPage, res);
          }
        }
        if (mt == 'p') {
          if (mo == 'd') {
            return renderWorks(user, topicsForShow, '', '', 'SELECTED', '', 'd', 'd', 'a', 'd', currentPage, totalPage, res);
          } else {
            return renderWorks(user, topicsForShow, '', '', 'SELECTED', '', 'd', 'd', 'd', 'd', currentPage, totalPage, res);
          }
        }
        if (mt == 'r') {
          if (mo == 'd') {
            return renderWorks(user, topicsForShow, '', '', '', 'SELECTED', 'd', 'd', 'd', 'a', currentPage, totalPage, res);
          } else {
            return renderWorks(user, topicsForShow, '', '', '', 'SELECTED', 'd', 'd', 'd', 'd', currentPage, totalPage, res);
          }
        }
      }
    });
  });

}

/*
 Find topics inside TopicModel and sort them in a certain order.
 * works page
 */
var getAndSortTopics = function (mt, mo, topics, callback) {
  if (mt == 'c') {
    var order = 'create_at';
    if (mo == 'd') {
      order = '-' + order;
    }
    return Topic.getTopicsByIdsSorted(topics, order, callback);
  }
  if (mt == 'u') {
    var order = 'update_at';
    if (mo == 'd') {
      order = '-' + order;
    }
    return Topic.getTopicsByIdsSorted(topics, order, callback);

  }
  if (mt == 'p') {
    var order = 'PV_count';
    if (mo == 'd') {
      order = '-' + order;
    }
    console.log("sort by pv");
    return Topic.getTopicsByIdsSorted(topics, order, callback);
  }
  if (mt == 'r') {
    //todo  how to count the rate.
    var order = 'create_at';
    if (mo == 'd') {
      order = '-' + order;
    }
    return Topic.getTopicsByIdsSorted(topics, order, callback);
  }
}


var renderWorks = function (user, topicsInfos, isSelectC, isSelectU, isSelectP, isSelectR, createV, updateV, pageViewV, rateV, currentPage, totalPage, res, next) {
  res.render('personal/index', {
    css: [
      '/stylesheets/personal.css'
    ],
    pageType: 'PERSONAL',
    personalType: 'WORKS',
    username: user.loginName,
    favourite: user.favourite,
    topicsCount: user.topicCount,
    topicsPageView: user.pageviewCount,
    topics: topicsInfos,
    isSelectC: isSelectC,
    isSelectU: isSelectU,
    isSelectP: isSelectP,
    isSelectR: isSelectR,
    createV: createV,
    updateV: updateV,
    pageViewV: pageViewV,
    rateV: rateV,
    imageUrl: user.url,
    currentPage: currentPage,
    totalPage: totalPage
  });
}


var showSettings = function (req, res) {
  console.log('render settings  page');

  var userId = req.session.userId;
  User.getUserById(userId, function (err, user) {
    console.log(user);
    var description = user.description;
    if (!description || description == 'undefined') {
      description = '';
    }
    res.render('personal/index', {
      css: [
        '/stylesheets/personal.css'
      ],
      js: [
        '/javascripts/setting.js'
      ],
      pageType: 'PERSONAL',
      personalType: 'SETTINGS',
      username: user.loginName,
      favourite: user.favourite,
      topicsCount: user.topicCount,
      topicsPageView: user.pageviewCount,
      imageUrl: user.url,
      description: description,
      connectUrl: user.personalSite,
      imageUrl: user.url
    });
  });
}

var updateSettings = function (req, res) {
  console.log("update Settings");
  var imageUrl = req.body.imageUrl;
  var description = req.body.description;
  var connectUrl = req.body.connectUrl;
  //console.log(imageUrl);
  //console.log(description);
  //console.log(connectUrl);
  //console.log(req.session.userId);
  var userId = req.session.userId;

  User.getUserById(userId, function (err, user) {
    if (err) {
      console.log("cannot find userid: %s", userId);
    }
    if (!user) {
      console.log("err cannot find user");
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



      //console.log(user);

      user.save(function (err) {
        if (err) {
          console.log("save user info err in updateUser Info.");
          console.log(err);
          return;
        }
      });
      res.header('Access-Control-Allow-Credentials', 'true')
      res.contentType('json');
      //res.writeHead(200);
      res.send({success: JSON.stringify("success") });
    }
  })

  return;
}


var showConfirmPassword = function (req, res) {
  res.render('personal/accountVerify')
}


/*
 When user want to change his/her personal information.
 login first.
 */
var passwordVerify = function (req, res) {
  //user name alos unique
  var username = sanitize(req.body.username).trim().toLowerCase();
  var pass = sanitize(req.body.password).trim();
  //console.log(req.body);
  console.log("name: %s", username);
  console.log("pass: %s", pass);
  res.locals.username = username;
  User.getUserByLoginName(username, function (err, user) {
    if (err) {
      console.log("cannot find user by name: %s", username);
    }
    else if (!user) {
      console.log("null user");
      //but this shall not happen.
      //how to do ?
      res.render('personal/accountVerify', {
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
        return res.render('personal/accountVerify', {
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
var showAccountModify = function (req, res) {

  console.log("show AccountModify page");
  console.log(req.query);
  //check how long after login
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

      return res.render('personal/account', {
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
  var loginTime = encryp.decrypt(auth, 'mtm');
  console.log("time stamp: %s", loginTime);
  var timeNow = new Date().getTime();
  if (timeNow - loginTime > 1 * 60 * 1000) //15 minutes
  {
    console.log("timeNow: %s", timeNow);
    console.log("need re-login");
    var auth = encryp.encrypt(timeNow.toString(), 'mtm');
    //clear everything ? yes in case you change your password

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
    }

    res.clearCookie('logintoken');
    var url = '/login?fromUrl=/accountModify?auth=' + auth;
    console.log(url);
    return res.redirect(url);
  }
}


/**
 * update account private information page.
 *
 */
var accountModify = function (req, res) {

  console.log(req.body);
  var auth = req.body.auth.toString();
  timeSpanCheck(auth, req, res);

  console.log("accountModify");
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
      var infoMsg = "请输入密码";

      return res.render('personal/account', {
        infoMsg: infoMsg,
        fChecked: fChecked,
        mChecked: mChecked,
        uChecked: uChecked,
        auth: auth,
        birthday: birthYear
      })
    }

    // first not empty. check length.
    else if (newPassword.length < 6 || newPassword > 20) {
      var infoMsg = "密码长度介于6-20位数之间";

      return res.render('personal/account', {
        infoMsg: infoMsg,
        fChecked: fChecked,
        mChecked: mChecked,
        uChecked: uChecked,
        auth: auth,
        birthday: birthYear
      })
    }

    // check equal
    else if (newPassword !== newPasswordConfirm) {
      var infoMsg = "两次密码不一样";

      return res.render('personal/account', {
        infoMsg: infoMsg,
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

      console.log(user);

      if ((!uPFlag) && (!uYFlag) && (!uGFlag)) {
        //nothing is updated
        return res.render('personal/account', {
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

          return res.render('personal/account', {
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


var showPersonal = function (req, res) {

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
  if (req.session.userId && req.currentUser) {
    if (req.currentUser.loginName == authorName) {
      //jump to works page
      console.log("the same person, jump to works");
      return res.redirect('/works');
    }
  }

  //2---------------------------------------
  //normal case
  var workType = req.query.type || 'P';
  // 'P' means made by himself. 'J' means join with others. not himself's topic.
  //current: first implement 'P'.
  // for 'J' part, out put empty as default.

  var sortOrder = req.query.order || 'U';
  // default order is according to update date. 'F' means favourte, i.e. likes
  // 'N' means name
  var uSelect = false;
  var fSelect = false;
  var nSelect = false;
  if (sortOrder == 'U') {
    uSelect = true;
  }
  else if (sortOrder == 'F') {
    fSelect = true;
  }
  else {
    nSelect = true;
  }

  var currentPage = req.query.page || '1';
  //default currentPage is the first page.

  console.log("workType: %s", workType);
  console.log("sortOrder: %s", sortOrder);
  console.log("req.page: %s", currentPage);
  console.log("req.url: %s", req.url);


  User.getUserByLoginName(authorName, function (err, user) {
    if (err) {
      console.log("err: ");
      console.log(err);
    } else if (!user) {
      //not such user
      console.log("not such user in DB. username: %s", authorName);
      //todo: then do what
    } else {
      //found the author information in DB

      //todo: revise thisUrl
      var thisUrl = "http://" + config.host + ':' + config.port + req.url;
      var baseUrl = thisUrl.split('?')[0];

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
      getandSortTopicsforShow(sortOrder, user.topics, function (err, topicsInfo) {
        if (err) {
          console.log("err");
        }
        /*
         //null topics has no problem
         else if(!topicsInfo){
         console.log("err: null topics");
         }*/
        else {
          //sorted topics
          console.log("topics length: ", topicsInfo.length);

          //here according to TotalTopic decide totalPage and currentPage topics
          var totalPage = Math.ceil(topicsInfo.length / 9);


          //console.log(topicsInfo);
          //create a template arrary,
          //then push all the topics into this arrary for show.
          var topicsForShow = [];
          for (var i = (currentPage - 1) * 9; i < topicsInfo.length && i < currentPage * 9; i++) {
            var temp = topicsInfo[i];
            temp.topicUrl = "/topic/" + topicsInfo[i]._id;
            temp.create_date = topicsInfo[i].create_at.getFullYear() + '年'
              + (topicsInfo[i].create_at.getMonth() + 1) + '月'
              + topicsInfo[i].create_at.getDate() + '日';
            topicsForShow.push(temp);
          }


          //before render: deal with more than one page.


          res.render('personal/index', {
            personalType: 'PERSONAL',
            css: ['/stylesheets/personal.css'],
            authorName: authorName,
            authorImage: user.url,
            authorDescription: description,
            authorPersonalUrl: user.personalSite,
            topicCount: user.topicCount,
            topicsPageView: user.pageviewCount,
            favourite: user.favourite,
            topics: topicsForShow,
            thisUrl: thisUrl,
            thisUrlJoin: baseUrl + '?type=J',
            uSelect: uSelect,
            fSelect: fSelect,
            nSelect: nSelect,
            totalPage: totalPage,
            currentPage: currentPage,
            likedBefore: likedBefore
          });
          return;

        }

      });
    }

  })
}


var getandSortTopicsforShow = function (sortName, topics, callback) {

  if (sortName == 'U') {
    //according to update time
    //this is default
    return Topic.getTopicsByIdsSorted(topics, '-update_at', callback);
  }
  else if (sortName == 'F') {
    //accordiing to liked count
    //todo: changed to favourite count.
    return Topic.getTopicsByIdsSorted(topics, '-PV_count', callback);
  } else if (sortName == 'N') {
    //according to Name
    return Topic.getTopicsByIdsSorted(topics, '-title', callback);
  }
}


var AddorRemoveLikes = function (req, res) {
  console.log("add or remove likes");
  console.log("req Body: %s", req.body);

  var authorName = req.body.url.split('/').pop();

  //default true case means from unlogin --> login situation.
  //this also makes the duplication check necessary in later part.
  var toLike = req.body.toLike || 'true';   //but after login, maybe already liked that why need check before add.
  console.log("authorName: %s", authorName);
  console.log("toLike: %s", toLike);
  var viewerId = req.session.userId;
  //console.log("current User");
  console.log(req.currentUser);


  //extract the author model and update the  favourite and favouriteList.
  User.getUserByLoginName(authorName, function (err, author) {
    if (err) {
      console.log("find user err");
    }
    else if (!author) {
      console.log("cannot find user by name: %s", authorName);
    }
    else {
      //found the user
      //toLike is string
      //console.log("toLike:  %s", toLike);
      //console.log(typeof toLike);

      if (toLike == 'true') {
        //todo: why is string

        //console.log("add likes");
        //For safety check:
        // if Exists do nothing
        if (author.favouriteList.indexOf(viewerId) == -1) {
          author.favouriteList.push(viewerId);
          author.favourite += 1;
          //console.log(author.favouriteList);
        }
      } else {
        //remove from the like list
        //console.log("remove likes");
        //if exist in DB
        var index = author.favouriteList.indexOf(viewerId);
        if (index > -1) {
          author.favourite -= 1;
          author.favouriteList.splice(index, 1);
        }
        //console.log(author.favouriteList);
      }
      author.save(function (err) {
        if (err) {
          console.log("save err in getUserByLoginName func");
        }
      });

      //extract the user and update the likelist
      User.getUserById(viewerId, function (err, viewer) {
        if (err) {
          console.log('find user err');
          return;
        }
        else if (!viewer) {
          console.log("cannot find the user by id: %s", viewerId);
          return;
        }
        else {
          //dekida
          //console.log("view like list: %s", viewer.likeList);

          if (toLike == 'true') {
            //console.log("add likes");
            if (viewer.likeList.indexOf(author._id) == -1) {
              viewer.likeList.push(author._id);
            }
            //console.log(viewer.likeList);
          } else {
            //console.log("remove likes");
            var index = viewer.likeList.indexOf(author._id);
            if (index > -1) {
              viewer.likeList.splice(index, 1);
            }
            //console.log(viewer.likeList);
          }

          viewer.save(function (err) {
            if (err) {
              console.log("save err");
            }
          })

          //now successfully update info for both author and viewer.
          //send information back
          res.header('Access-Control-Allow-Credentials', 'true')
          res.contentType('json');
          //res.writeHead(200);
          //if need login, then in auth.js, loginDialog : true,
          //correct attribute is used for login Dialog success situation.
          res.send({favourite: author.favourite, correct: true, userName: viewer.loginName });

        }
      })

    }
  })


}


var showFavourite = function (req, res) {
  res.locals.path = req.path.replace(/\/$/, '');
  if (req.session && req.session.userId && req.session.userId !== 'undefined') {
    console.log('render show favourite page');
    res.render('personal/favourite', {
      css: [
        '/stylesheets/personal.css'
      ],
      pageType: 'PERSONAL'
    });
  } else {
    return res.redirect('/home');
  }

}
exports.showWorks = showWorks;
exports.showFavourite = showFavourite;
exports.showSettings = showSettings;
exports.updateSettings = updateSettings;
exports.showConfirmPassword = showConfirmPassword;
exports.passwordVerify = passwordVerify;
exports.showAccountModify = showAccountModify;
exports.accountModify = accountModify;
exports.showPersonal = showPersonal;
exports.AddorRemoveLikes = AddorRemoveLikes;
