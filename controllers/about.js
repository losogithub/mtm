/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 12/1/13
 * Time: 4:51 PM
 * To change this template use File | Settings | File Templates.
 */
function showAbout(req, res){
  res.render('about/about', {
    css: ['/stylesheets/service.css'],
    layout: false
  });
}
function showRules(req, res){
  res.render('about/rules', {
    css: ['/stylesheets/service.css'],
    layout: false
  });
}


function showPrivacyCenter(req, res){
  res.render('about/privacy/privacyCenter',
    {
      css: ['/stylesheets/service.css'],
      layout: false
    });
}

function showPolicy(req, res){
  res.render('about/privacy/policy',
    {
      css: ['/stylesheets/service.css'],
      layout: false
    });
}

function showCope(req, res){
  res.render('about/privacy/cope',
    {
      css: ['/stylesheets/service.css'],
      layout: false
    });
}

function showService(req, res){
  res.render('about/privacy/service',
    {
      css: ['/stylesheets/service.css'],
      layout: false
    });
}

function showPrinciple(req, res){
  res.render('about/privacy/principle',
    {
      css: ['/stylesheets/service.css'],
      layout: false
    });
}

function showHelp(req, res){
  res.render('about/help',
    {
      css: ['/stylesheets/helpCenter.css'],
      layout: false
    });
}

function showEachHelp(req, res){
  helpId =req.params.helpId;

  var commonPart = 'about/help/';
  var fileName = commonPart + helpId ;

  res.render(fileName, {
    css: ['/stylesheets/helpCenter.css'],
    layout: false
  });
}

function showPrivacy(req,res){
  res.render('about/privacy',
    {
      css: ['/stylesheets/service.css'],
      layout: false
    });

}
exports.showAbout = showAbout;
exports.showRules = showRules;
exports.showPrivacyCenter = showPrivacyCenter;
exports.showPolicy = showPolicy;
exports.showCope = showCope;
exports.showService = showService;
exports.showPrinciple = showPrinciple;
exports.showHelp = showHelp;
exports.showEachHelp = showEachHelp;
exports.showPrivacy = showPrivacy;
