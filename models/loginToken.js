/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/7/13
 * Time: 11:20 AM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TokenSchema = new Schema({
  email: {type: String, index: true},
  series: {type: String},
  token: {type: String}
})

TokenSchema.virtual('cookieValue')
  .get(function() {
    return JSON.stringify({ email: this.email, token: this.token, series: this.series });
  });


exports.TopicModel = mongoose.model('LoginToken', TokenSchema);

