/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/1/13
 * Time: 11:16 PM
 * To change this template use File | Settings | File Templates.
 */


var config = require('../config');

var showWorks = function (req, res) {
    console.log("render show works page");
    console.log(req.session);
    //req.session.destroy();
    //res.clearCookie(config.auth_cookie_name, { path: '/' });
    if (!req.session.userId){
        res.redirect('home');
    }

    //before rendering, prepare enough information.
    // according to the user name to find out :
    // image,
    // topics

    res.render('personal/works', {
        title: config.name,
        css: '',
        js : '' ,
        layout: 'personalLayout'
    });
}

var showFavourite = function(req, res){
    console.log('render show favourite page');
    console.log(req.session);
    /*
    if(!req.session.userId){
        res.redirect('home');
    }  */
    res.render('personal/favourite', {
        title: config.name,
        css: [
            '/stylesheets/personalAccountManage/MTM_mypage_newsfeed_13800104942008.css'
        ],
        js : '' ,
        layout: 'personalLayout'
    });
}

var showSettings = function(req, res){
    console.log('render settings  page');
    /*
     if(!req.session.userId){
     res.redirect('home');
     }  */
    res.render('personal/settings', {
        title: config.name,
        css: '',
        js: '',
        layout: 'personalLayout'
    })
}


exports.showWorks = showWorks;
exports.showFavourite = showFavourite;
exports.showSettings = showSettings;