/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 1:23 AM
 * To change this template use File | Settings | File Templates.
 */
module.exports = {
    debug: true,
    name: "mtm",
    host:"localhost.mtm.org",
    port: 3000,
    db: 'mongodb://127.0.0.1/mtm',

    session_secret: 'mtm',

    mail_opts : {
       /* host: '' ,
        port: 25, */
        service: "Gmail",
        auth: {
            user: 'splatform2013@gmail.com',
            pass: 'zongjie0924'
        }

    }
}