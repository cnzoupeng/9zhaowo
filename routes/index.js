var express = require('express');
var router = express.Router();
var db = require('./db');

var MAX_INTRO_LEN = 60;

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

	db.getUserInfo('952070', function(err, userinfo){
		if(err){
			logErr(1001, err);
			return res.render('error', err);
		}
		mainPage.user = userinfo;
		mainPage.self = JSON.stringify(userinfo);
		
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
				mainPage.pageCount = result.count / db.pageUserCount;
				mainPage.pageCount = parseInt(mainPage.pageCount);
				if(result.count % db.pageUserCount != 0){
					mainPage.pageCount++;
				}
				
				for(var i in result.users){
					if(result.users[i].introduce.length > MAX_INTRO_LEN){
						result.users[i].introduce = result.users[i].introduce.substr(0, MAX_INTRO_LEN);
						result.users[i].introduce += "...";
					}
				}
				
				mainPage.firstPage = result.users;
				res.render('index', mainPage);
			});
		});
	});
});

router.get('/personal', function(req, res, next){
	res.redirect('/');
});

router.get('/msg', function(req, res, next){
	res.redirect('/');
});

router.get('/edit', function(req, res, next){
	res.redirect('/');
});

router.get('/page/:id', function(req, res, next) {
	res.setHeader("Content-Type", "application/json");
	var mainPage = {};
	var pageId = req.params.id;
	if(pageId === undefined){
		logErr(1004, "wrong page id recved");
		return res.end(JSON.stringify({err: 3, msg: "wrong id"}));
	}
	pageId = parseInt(pageId);
	if(isNaN(pageId) || pageId < 0){
		logErr(1005, "wrong page id recved");
		return res.end(JSON.stringify({err: 3, msg: "wrong id"}));
	}
	mainPage.pageId = pageId;
	mainPage.err = 0;
	
	db.getPageUsers(pageId, function(errc, result){
		if(errc){
			logErr(1006, errc);
			return res.end(JSON.stringify({err: 3, msg: errc}));
		}
		
		mainPage.pageCount = result.count / db.pageUserCount;
		mainPage.pageCount = parseInt(mainPage.pageCount);
		if(result.count % db.pageUserCount != 0){
			mainPage.pageCount++;
		}
		
		for(var i in result.users){
			if(result.users[i].introduce.length > MAX_INTRO_LEN){
				result.users[i].introduce = result.users[i].introduce.substr(0, MAX_INTRO_LEN);
				result.users[i].introduce += "...";
			}
		}
		
		mainPage.users = result.users;
		
		res.end(JSON.stringify(mainPage));
	});
});

router.get('/updateMsg', function(req, res, next) {
	res.setHeader("Content-Type", "application/json");
	if(!req.query.id || !req.query.time){
		return res.end(JSON.stringify({err: 1, msg: 'miss query'}));
	}
	
	db.updateUserMsgState(req.query.id, req.query.time, function(err){
		res.end(JSON.stringify({err: 0, msg: 'ok'}));
	});
});

//===================================================================


module.exports = router;
