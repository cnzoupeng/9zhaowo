var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var mainPage = {};
    mainPage.user = {name: '邹鹏', wx: 'cnzoupeng', mobile: '17712345678', 
      area: '广东/深圳', avatar:'http://127.0.0.1/avatar/head.jpg', tag: "IT 安全 编程", intro: "全栈工程师、网络、安全、Linux、高可靠、高并发、分布式"};
      
    mainPage.msg = {count: 10, item: [{mfrom: 'songan', time:'2015-8-27 18:05:30', content:'hello'},
      {mfrom: 'lynzou', time:'2015-8-25 18:05:30', content:'first message'}]};
      
    mainPage.listUser = [{name: '宋安', hangye: '营销', area: '广东/深圳', tag: '出书 营销', intro: 'Nice', avatar:'http://9zhaowo.com/avatar/lkjsdflhljsd.jpg'},
      {name: '宋安2', hangye: '营销', area: '广东/深圳', tag: '出书 营销', intro: 'Nice', avatar:'http://9zhaowo.com/avatar/lkjsdflhljsd.jpg'},
      {name: '宋安3', hangye: '营销', area: '广东/深圳', tag: '出书 营销', intro: 'Nice ccv', avatar:'http://9zhaowo.com/avatar/lkjsdflhljsd.jpg'}];
      
    res.render('index', mainPage);
});

module.exports = router;
