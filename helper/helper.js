/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/12/13
 * Time: 2:50 PM
 * To change this template use File | Settings | File Templates.
 */


/**
 * When given a plain text, translate into a certain html tagged str.
 *
 */
function linkify(inputText) {
  //empty case
  if (!inputText) {
    return inputText;
  }
  var replacedText, replacePattern1, replacePattern2, replacePattern3;

  //URLs starting with http://, https://, or ftp://
  replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
  replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

  //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
  replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
  replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

  //Change email addresses to mailto:: links.
  replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
  replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

  return replacedText.replace(/(\n)+/g, '<br>');
}

function validateEmail(email) {
  // First check if any value was actually set
  if (email.length == 0) return false;
  // Now validate the email format using Regex
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
  return re.test(email);
}

function escape(html) {
  if (!html) {
    return html;
  }
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function concatNoDup(a, b) {
  for(var i=0,j=0,ci,r={},c=[];ci=a[i++]||b[j++];){
    if(r[ci])continue;
    r[ci]=1;
    c.push(ci);
  }
  return c;
}

exports.linkify = linkify;
exports.validateEmail = validateEmail;
exports.escape = escape;
exports.concatNoDup = concatNoDup;
