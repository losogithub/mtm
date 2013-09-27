var mongoose = require('mongoose');
var  Schema = mongoose.Schema;


var UserSchema = new Schema({
    name: {type: String, index: true},
    loginName : {type: String, unique: true},
    password: {type: String},
    email: {type: String, unique: true},
    url: {type: String},

    active: {type: Boolean, default: true},

    retrieve_time: {type: Number},
    retrieve_key: {type: String}
});

mongoose.model('User', UserSchema);