/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 12/1/13
 * Time: 4:51 PM
 * To change this template use File | Settings | File Templates.
 */
function showAbout(req, res){
  res.render('about/about');
}
function showRules(req, res){
  res.render('about/rules');
}

function showPrivacy(req,res){
  res.render('about/privacy');

}

function showHelp(req, res){
  res.render('about/help');
}

function showEachHelp(req, res){
  helpId = req.params.helpId;

  var commonPart = 'about/help/';
  var fileName = commonPart + helpId ;

  res.render(fileName);
}

exports.showAbout = showAbout;
exports.showRules = showRules;
exports.showPrivacy = showPrivacy;
exports.showHelp = showHelp;
exports.showEachHelp = showEachHelp;
