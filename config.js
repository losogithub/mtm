/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 1:23 AM
 * To change this template use File | Settings | File Templates.
 */

module.exports = {

  WEIBO_APPKEY: '2027761570',
  WEIBO_COOKIE: 'SUE=es%3Ded67293ff456cd2ee94b0c584dc1bbb4%26ev%3Dv1%26es2%3Dcc82c64018b28022a182180c893b978d%26rs0%3DcchC0Xo2VA25X2WeMXkkuQPlZSgKrF7P1LqlMwvYyiVg2vzwe2ySmWmV6ytCSprVpul%252FYN%252BuBtZ10dbayqb%252FQANR3o4djg3oWE8%252BSNHw4G1%252FHcYmQtmKy2DZtQvdBYMBeoEJqpNMrSfxOXuacsj3jY4fIbx7vAzJiL3G8gGx3BI%253D%26rv%3D0; SUP=cv%3D1%26bt%3D1388247347%26et%3D1388333747%26d%3D40c3%26i%3D0217%26us%3D1%26vf%3D0%26vt%3D0%26ac%3D2%26st%3D0%26lt%3D7%26uid%3D3957585134%26user%3Dlosoqq1%2540qq.com%26ag%3D4%26name%3Dlosoqq1%2540qq.com%26nick%3D%25E6%25A8%258A%25E5%25B0%258F%25E5%25B0%258F%25E5%25B0%258F%25E5%25B0%258F%25E5%25B0%258F%25E9%259B%25AF%26sex%3D2%26ps%3D0%26email%3D%26dob%3D%26ln%3D%26os%3D%26fmp%3D%26lcp%3D;',

  debug: true,
  name: "石子儿",
  hostname: 'shizier.com',
  host: "shizier.com", //revise later
  port: '3000',
  db: 'mongodb://127.0.0.1:27017/mtm',

  dbOptions: {

  },

  session_secret: 'shizier',
  auth_cookie_name: 'shizierCookie',
  mail_opts: {
    host: 'weiji.com',
    port: 25,
    service: "shiziweiji",
    auth: {
      user: 'shizier@weiji.com',
      pass: 'shizi0725'
    }

  }
}
