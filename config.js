/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 1:23 AM
 * To change this template use File | Settings | File Templates.
 */

module.exports = {

  WEIBO_APPKEY: '3533910314',
  WEIBO_SECRET: '63b986249b59afda163cb9477fe439d4',

  QINIU_ACCESS_KEY : '-goQ4yajcjd9dWQ1A8o7C_jio8dtd5su7N80yuRT',
  QINIU_SECRET_KEY : 'nyv3qOe6FKDD8LGTMuS_US_mPduELGC5PkE602hd',
  BUCKET_NAME : "shizier",

  debug: true,
  name: "石子儿",
  hostname: 'shizier.com',
  host: "shizier.com", //revise later
  port: '3001',
  db: 'mongodb://127.0.0.1:27017/mtm',
  admins: {
    admin: 1,
    gossipxoxo: 1,
    xiaoshitou: 1,
    alibabamama: 1,
    infinal: 1
  },

  session_secret: 'shizier',
  auth_cookie_name: 'shizierCookie',
  mail_opts: {
    host: 'shizier.com',
    port: 25,
    auth: {
      user: 'notification@shizier.com',
      pass: 'shizier0725'
    }

  }
}
