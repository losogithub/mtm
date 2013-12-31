/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 1:23 AM
 * To change this template use File | Settings | File Templates.
 */

module.exports = {

  WEIBO_APPKEY: '2027761570',
  WEIBO_COOKIE: 'SUE=es%3D11b01a74bb20c06cfd33a837dc29afdb%26ev%3Dv1%26es2%3D345b18fb43a38ec458e4585c29d04361%26rs0%3Dw0T1BTXqfnFJ75CihpXoQPjsVXj15CPAWEZGP2a%252FmsCql1uI9e05463T%252Fb3gke2gCj3Ms6zi7PvhkPPAGzedJZL7jBeQ2NGthmxjZ9JFDF864BCPEgTXxb9th%252Bv0i%252F33UkApKw3u2seTa2zQylJp2E5FdZBt83WDEV%252BdhxHj23I%253D%26rv%3D0; SUP=cv%3D1%26bt%3D1388468159%26et%3D1388554559%26d%3Dc909%26i%3D5df2%26us%3D1%26vf%3D0%26vt%3D0%26ac%3D2%26st%3D0%26uid%3D3957585134%26name%3Dlosoqq1%2540qq.com%26nick%3D%25E6%25A8%258A%25E5%25B0%258F%25E5%25B0%258F%25E5%25B0%258F%25E5%25B0%258F%25E5%25B0%258F%25E9%259B%25AF%26fmp%3D%26lcp%3D;',

  debug: true,
  name: "石子儿",
  hostname: 'shizier.com',
  host: "shizier.com", //revise later
  port: '3000',
  db: 'mongodb://127.0.0.1:27017/mtm',

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
