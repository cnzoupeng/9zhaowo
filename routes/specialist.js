var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/:id', function(req, res, next) {
  if(!req.params.id){
    return res.render('404');
  }
  
  var user = {name: '邹鹏', wx: 'cnzoupeng', mobile: '17712345678', hangye: '互联网',
      area: '广东/深圳', avatar:'http://127.0.0.1/avatar/head.jpg', tag: "IT 安全 编程", intro: "全栈工程师、网络、安全、Linux、高可靠、高并发、分布式"};
      
  res.render('specialist', user);
});

module.exports = router;
