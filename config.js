/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 1:23 AM
 * To change this template use File | Settings | File Templates.
 */

module.exports = {
    debug: true,
    name: "shizier",
    hostname: 'shizier.com',
    host:"shizier.com", //revise later
    port: '80',
    db: 'mongodb://127.0.0.1:27017/mtm',

  dbOptions : {

  } ,

    session_secret: 'mtm',
    auth_cookie_name: 'mtmCookie',
    mail_opts : {
         host: 'weiji.com' ,
         port: 25,
        service: "shiziweiji",
        auth: {
            user: 'shizier@weiji.com',
            pass: 'shizi0725'
        }

    }
}
