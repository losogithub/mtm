var mongoose = require('mongoose');
var  Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.ObjectId;

var UserSchema = new Schema({
    name: {type: String, index: true},
    loginName : {type: String, unique: true},
    password: {type: String},
    email: {type: String, unique: true},
    favourite: {type: Number, default: 0},
    url: {type: String},

    active: {type: Boolean, default: true},

    retrieve_time: {type: Number},
    retrieve_key: {type: String},

    //topics array
    topics : [ObjectId ],
    topicCount : {type: Number, default:0},
    pageviewCount:  {type: Number, default:0}
});

mongoose.model('User', UserSchema);