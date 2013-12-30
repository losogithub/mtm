/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 12/24/13
 * Time: 2:00 PM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

module.exports = mongoose.model('WeiboItem', {
  type: { type: String, default: 'WEIBO'},
  topic_id: ObjectId,
  prev_item: { type: { type: String }, id: ObjectId },
  next_item: { type: { type: String }, id: ObjectId },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },

  url: String,
  description: String,

  "created_at": Date,
  "idstr": String,
  "mid62": String,
  "text": String,
  "source": String,//html代码
  "pic_urls": [
    {"thumbnail_pic": String}
  ],
  "user": {
    "idstr": String,
    "screen_name": String,
    "description": String,
    "profile_image_url": String,//50x50
    "profile_url": String,//weibo.com/$profile_url
    "verified": Boolean,
    "verified_type": Number,//0个人，2机构
    "verified_reason": String
  },
  "retweeted_status": {//非转发没有该字段
    "created_at": Date,
    "idstr": String,
    "mid62": String,
    "text": String,
    "source": String,//html代码
    "pic_urls": [
      {"thumbnail_pic": String}
    ],
    "user": {
      "idstr": String,
      "screen_name": String,
      "description": String,
      "profile_image_url": String,//50x50
      "profile_url": String,//weibo.com/$profile_url
      "verified": Boolean,
      "verified_type": Number,//0个人，2机构
      "verified_reason": String
    }
  }
});

var shortDemo = {
  "created_at": "Tue Dec 24 11:31:24 +0800 2013",
  "idstr": "3658995136683266",
  "text": "回复@重庆何仁勇:我不许你品头论足了?我和你妈又不熟，你没教养，关我屁事 //@重庆何仁勇:家门口？又一个在公共场所圈地的主儿。你抹油打粉在公共场合出现，又不许人家评头论足……还是回家陪老婆孩子在坑头玩吧。 //@肉唐僧:回复@重庆何仁勇:好像你看得懂似的 ",
  "source": "<a href=\"http://app.weibo.com/t/feed/9ksdit\" rel=\"nofollow\">iPhone客户端</a>",
  "pic_urls": [],
  "user": {
    "idstr": "1657239733",
    "screen_name": "肉唐僧",
    "description": "邦有道，危言危行；邦无道，危行言孙",
    "profile_image_url": "http://tp2.sinaimg.cn/1657239733/50/5674482000/1",//50x50
    "profile_url": "routangseng",//weibo.com/$profile_url
    "verified": true,
    "verified_type": 0,//0个人，2机构
    "verified_reason": "著名专栏作家，著有《性、婚姻与爱情的历史：被劫持的私生活》等书"
  },
  "retweeted_status": {
    "created_at": "Mon Dec 23 14:48:13 +0800 2013",
    "idstr": "3658682279422816",
    "text": "我所理解的公民社会——兼答郭于华老师 @倾听底层",
    "source": "<a href=\"http://weibo.com/\" rel=\"nofollow\">新浪微博</a>",
    "pic_urls": [
      {"thumbnail_pic": "http://ww3.sinaimg.cn/thumbnail/62c778b5tw1ebtmyqtzbpj20c82xr18z.jpg"}
    ],
    "user": {
      "idstr": "1657239733",
      "screen_name": "肉唐僧",
      "description": "邦有道，危言危行；邦无道，危行言孙",
      "profile_image_url": "http://tp2.sinaimg.cn/1657239733/50/5674482000/1",
      "profile_url": "routangseng",
      "verified": true,
      "verified_type": 0,//0个人，2机构
      "verified_reason": "著名专栏作家，著有《性、婚姻与爱情的历史：被劫持的私生活》等书",
    }
  }
};

var demo = {
  "created_at": "Tue Dec 24 11:31:24 +0800 2013",
  "id": 3658995136683266,
  "mid": "3658995136683266",
  "idstr": "3658995136683266",
  "text": "回复@重庆何仁勇:我不许你品头论足了?我和你妈又不熟，你没教养，关我屁事 //@重庆何仁勇:家门口？又一个在公共场所圈地的主儿。你抹油打粉在公共场合出现，又不许人家评头论足……还是回家陪老婆孩子在坑头玩吧。 //@肉唐僧:回复@重庆何仁勇:好像你看得懂似的 ",
  "source": "<a href=\"http://app.weibo.com/t/feed/9ksdit\" rel=\"nofollow\">iPhone客户端</a>",
  "favorited": false,
  "truncated": false,
  "in_reply_to_status_id": "",
  "in_reply_to_user_id": "",
  "in_reply_to_screen_name": "",
  "pic_urls": [],
  "geo": null,
  "user": {
    "id": 1657239733,
    "idstr": "1657239733",
    "class": 1,
    "screen_name": "肉唐僧",
    "name": "肉唐僧",
    "province": "21",
    "city": "2",
    "location": "辽宁 大连",
    "description": "邦有道，危言危行；邦无道，危行言孙",
    "url": "http://blog.sina.com.cn/u/1657239733",
    "profile_image_url": "http://tp2.sinaimg.cn/1657239733/50/5674482000/1",
    "profile_url": "routangseng",
    "domain": "routangseng",
    "weihao": "",
    "gender": "m",
    "followers_count": 169008,
    "friends_count": 1359,
    "statuses_count": 9737,
    "favourites_count": 30,
    "created_at": "Fri Oct 30 11:11:20 +0800 2009",
    "following": true,
    "allow_all_act_msg": true,
    "geo_enabled": false,
    "verified": true,
    "verified_type": 0,
    "remark": "",
    "ptype": 3,
    "allow_all_comment": true,
    "avatar_large": "http://tp2.sinaimg.cn/1657239733/180/5674482000/1",
    "avatar_hd": "http://ww3.sinaimg.cn/crop.21.31.128.128.1024/62c778b5jw1e8r0vic0dgj204q04qwec.jpg",
    "verified_reason": "著名专栏作家，著有《性、婚姻与爱情的历史：被劫持的私生活》等书",
    "follow_me": false,
    "online_status": 0,
    "bi_followers_count": 1293,
    "lang": "zh-cn", "star": 0,
    "mbtype": 12, "mbrank": 4,
    "block_word": 0
  },
  "pid": 3658967072385805,
  "retweeted_status": {
    "created_at": "Mon Dec 23 14:48:13 +0800 2013",
    "id": 3658682279422816,
    "mid": "3658682279422816",
    "idstr": "3658682279422816",
    "text": "我所理解的公民社会——兼答郭于华老师 @倾听底层",
    "source": "<a href=\"http://weibo.com/\" rel=\"nofollow\">新浪微博</a>",
    "favorited": false,
    "truncated": false,
    "in_reply_to_status_id": "",
    "in_reply_to_user_id": "",
    "in_reply_to_screen_name": "",
    "pic_urls": [
      {"thumbnail_pic": "http://ww3.sinaimg.cn/thumbnail/62c778b5tw1ebtmyqtzbpj20c82xr18z.jpg"}
    ],
    "thumbnail_pic": "http://ww3.sinaimg.cn/thumbnail/62c778b5tw1ebtmyqtzbpj20c82xr18z.jpg",
    "bmiddle_pic": "http://ww3.sinaimg.cn/bmiddle/62c778b5tw1ebtmyqtzbpj20c82xr18z.jpg",
    "original_pic": "http://ww3.sinaimg.cn/large/62c778b5tw1ebtmyqtzbpj20c82xr18z.jpg",
    "geo": null,
    "user": {
      "id": 1657239733,
      "idstr": "1657239733",
      "class": 1,
      "screen_name": "肉唐僧",
      "name": "肉唐僧",
      "province": "21",
      "city": "2",
      "location": "辽宁 大连",
      "description": "邦有道，危言危行；邦无道，危行言孙",
      "url": "http://blog.sina.com.cn/u/1657239733",
      "profile_image_url": "http://tp2.sinaimg.cn/1657239733/50/5674482000/1",
      "profile_url": "routangseng",
      "domain": "routangseng",
      "weihao": "",
      "gender": "m",
      "followers_count": 169008,
      "friends_count": 1359,
      "statuses_count": 9737,
      "favourites_count": 30,
      "created_at": "Fri Oct 30 11:11:20 +0800 2009",
      "following": true,
      "allow_all_act_msg": true,
      "geo_enabled": false,
      "verified": true,
      "verified_type": 0,
      "remark": "",
      "ptype": 3,
      "allow_all_comment": true,
      "avatar_large": "http://tp2.sinaimg.cn/1657239733/180/5674482000/1",
      "avatar_hd": "http://ww3.sinaimg.cn/crop.21.31.128.128.1024/62c778b5jw1e8r0vic0dgj204q04qwec.jpg",
      "verified_reason": "著名专栏作家，著有《性、婚姻与爱情的历史：被劫持的私生活》等书",
      "follow_me": false,
      "online_status": 0,
      "bi_followers_count": 1293,
      "lang": "zh-cn",
      "star": 0,
      "mbtype": 12,
      "mbrank": 4,
      "block_word": 0
    },
    "reposts_count": 1200,
    "comments_count": 367,
    "attitudes_count": 168,
    "mlevel": 0,
    "visible": {
      "type": 0,
      "list_id": 0
    }
  },
  "reposts_count": 10,
  "comments_count": 4,
  "attitudes_count": 7,
  "mlevel": 0,
  "visible": {
    "type": 0,
    "list_id": 0
  }
}