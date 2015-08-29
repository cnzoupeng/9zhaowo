var express = require('express');
var router = express.Router();
var db = require('./db');


router.get('/', function(req, res, next) {
	var mainPage = {};

	/*
	mainPage.user =   { id: 'cnzoupeng',
     name: '邹鹏',
     city: '广东/深圳',
     country: 'china',
     avatar: 'http://9zhaowo.com/demo/avatar/head.jpg',
     industry: '互联网',
     mobile: '17712345678',
     specialist: '网络安全专家',
     tag: 'IT 安全 互联网',
     introduce: '6年聚焦在网络、安全、后台开发、高性能、高可靠、分布式领域；作为团队技术骨干，负责核心系统的设计、开发；质量保证、流程把控；能够独立承担一个产品的整个流程；' };
	mainPage.firstPage = [{ id: 'cnzoupeng',
       name: '邹鹏',
       area: '广东/深圳',
       tag: 'IT 安全 互联网',
       avatar: 'http://9zhaowo.com/demo/avatar/head.jpg',
       industry: '互联网',
       specialist: '网络安全专家',
       introduce: '6年聚焦在网络、安全、后台开发、高性能、高可靠、分布式领域；作为团队技术骨干，负责核心系统的设计、开发；质量保证、流程把控；能够独立承担一个产品的整个流程；' }];
	   
    mainPage.msg = {count: 10, item: [{mfrom: 'songan', time:'2015-8-27 18:05:30', content:'hello'},
      {mfrom: 'lynzou', time:'2015-8-25 18:05:30', content:'first message'}]};
	res.render('index', mainPage);
	*/


	db.getUserInfo('cnzoupeng', function(err, userinfo){
		if(err){
			logErr(1001, err);
			return res.render('error', err);
		}
		mainPage.user = userinfo;
		
		db.getPageMsg('cnzoupeng', 0, function(err, result){
			if(err){
				logErr(1002, err);
				return res.render('error', err);
			}
			mainPage.user.hasNewMsg = result.hasNew;
			mainPage.msg = result.msgs;
			
			db.getPageUsers(0, function(err, result){
				if(err){
					logErr(1003, err);
					return res.render('error', err);
				}
				mainPage.userCount = result.count;
				mainPage.firstPage = result.users;
				res.render('index', mainPage);
			});
		});
	});
});


router.get('/updateMsg', function(req, res, next) {
	if(!req.query.id || !req.query.time){
		return res.end(JSON.stringify({err: 1, msg: 'miss query'}));
	}
	
	db.updateUserMsgState(req.query.id, req.query.time, function(err){
		res.end(JSON.stringify({err: 0, msg: 'ok'}));
	});
});

//===================================================================


module.exports = router;
