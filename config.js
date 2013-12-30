/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 1:23 AM
 * To change this template use File | Settings | File Templates.
 */

module.exports = {
    debug: true,
    name: "石子儿",
    hostname: 'shizier.com',
    host:"shizier.com", //revise later
    port: '3000',
    db: 'mongodb://127.0.0.1:27017/mtm',

  dbOptions : {

  } ,

    session_secret: 'shizier',
    auth_cookie_name: 'shizierCookie',
    mail_opts : {
        host: 'shizier.com',
        port: 25,
        auth: {
            user: 'notification@shizier.com',
            pass: 'shizier0725'
        }

    }
}
