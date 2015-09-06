var express = require('express');
var router = express.Router();
var db = require('./db');


router.get('/', function(req, res, next) {
	var mainPage = {};
	var uid = '952070';

	//获取一页用户
	getPageInfo(0, function(err, result1){
		if(err){
			logErr(1003, err);
			return res.render('error', err);
		}

		var users = result1.users;
		for(var i in users){
			if(users[i].introduce.length > db.max_intro_len){
				users[i].shortIntro = users[i].introduce.substr(0, db.max_intro_len);
				if(users[i].introduce.length > 60){
					users[i].shortIntro += " . . .";
				}
			}
		}
		mainPage.userList = result1;
		if(!uid){
			mainPage.user = {self: '{}'};
			mainPage.login = false;
			return res.render('index', mainPage);
		}

		//获取当前用户信息
		getUserInfo(uid, function(err, result2){
			if(err){
				logErr(1003, err);
				return res.render('error', err);
			}
			mainPage.user = result2.user;
			mainPage.msg = result2.msg;
			mainPage.login = true;

			res.render('index', mainPage);
		})
	});
});

router.get('/page/:id', function(req, res, next) {
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
	var mainPage = {err: 0};

	//通过请求头部的pjax判断是否渲染
	var needRender = true;
	if(req.headers.pjax && req.headers.pjax == 'yes'){
		needRender = false;
		res.setHeader("Content-Type", "application/json");
	}

	if(needRender && pageId == 0){
		return res.redirect('/');
	}

	getPageInfo(pageId, function(errc, result){
		if(needRender) {
			if(errc) {
				logErr(1006, errc);
				return res.render('error', errc);
			}

			var users = result.users;
			for(var i in users){
				if(users[i].introduce.length > db.max_intro_len){
					users[i].shortIntro = users[i].introduce.substr(0, db.max_intro_len);
					if(users[i].introduce.length > 60){
						users[i].shortIntro += " . . .";
					}
				}
			}
			mainPage.user = {self: '{}'};
			mainPage.login = false;
			mainPage.userList = result;
			return res.render('index', mainPage);
		}

		//ajax
		if(errc){
			logErr(1006, errc);
			return res.end(JSON.stringify({err: 3, msg: errc}));
		}
		mainPage.login = false;
		mainPage.userList = result;
		res.end(JSON.stringify(mainPage));
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

router.get('/advsearch', function(req, res, next){
	res.redirect('/');
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

function getPageInfo(pageId, call){
	var pageInfo = {};
	db.getPageUsers(pageId, function(errc, result){
		if(errc){
			logErr(1006, errc);
			return call(errc);
		}

		pageInfo.pageCount = result.count / db.pageUserCount;
		pageInfo.pageCount = parseInt(pageInfo.pageCount);
		if(result.count % db.pageUserCount != 0){
			pageInfo.pageCount++;
		}
		pageInfo.lastPage = result.lastPage;
		pageInfo.users = result.users;
		call(0, pageInfo);
	});
}

function getUserInfo(uid, call){
	var result = {user: {}, msg: {}};
	db.getUserInfo('952070', function(err, userinfo) {
		if (err) {
			logErr(1001, err);
			return call(err);
		}
		result.user.info = userinfo;
		result.user.self = JSON.stringify(userinfo);

		db.getPageMsg('cnzoupeng', 0, function (err, userMsg) {
			if (err) {
				logErr(1002, err);
				return call(err);
			}
			result.msg.hasNewMsg = userMsg.hasNew;
			result.msg.lastPage = userMsg.lastPage;
			result.msg.data = userMsg.msgs;
			call(0, result);
		});
	});
}

module.exports = router;
