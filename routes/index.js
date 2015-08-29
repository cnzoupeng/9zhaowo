var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var pool = mysql.createPool({
	connectionLimit: 10,
	host: '10.66.105.135',
	user: 'root',
	password: 'passwd@db',
	database: '9zhaowo'
});



/* GET home page. */
router.get('/', function(req, res, next) {
    var mainPage = {};
	getUserInfo('cnzoupeng', function(err, userinfo){
		if(err){
			return res.render('error', err);
		}
		mainPage.user = userinfo;
		
		getFirstPageData(function(err, firstPage){
			if(err){
				return res.render('error', err);
			}
			mainPage.firstPage = firstPage;
			
			mainPage.msg = {count: 10, item: [{mfrom: 'songan', time:'2015-8-27 18:05:30', content:'hello'},
     					   {mfrom: 'lynzou', time:'2015-8-25 18:05:30', content:'first message'}]};
			res.render('index', mainPage);
		});
	});
	/*
    mainPage.user = {name: '邹鹏', wx: 'cnzoupeng', id:'123456', mobile: '17712345678', 
      area: '广东/深圳', avatar:'http://127.0.0.1/avatar/head.jpg', tag: "IT 安全 编程", intro: "全栈工程师、网络、安全、Linux、高可靠、高并发、分布式"};
      
    mainPage.msg = {count: 10, item: [{mfrom: 'songan', time:'2015-8-27 18:05:30', content:'hello'},
      {mfrom: 'lynzou', time:'2015-8-25 18:05:30', content:'first message'}]};
      
    mainPage.listUser = [{name: '宋安', hangye: '营销', area: '广东/深圳', tag: '出书 营销', intro: 'Nice', avatar:'http://9zhaowo.com/avatar/lkjsdflhljsd.jpg'},
      {name: '宋安2', hangye: '营销', area: '广东/深圳', tag: '出书 营销', intro: 'Nice', avatar:'http://9zhaowo.com/avatar/lkjsdflhljsd.jpg'},
      {name: '宋安3', hangye: '营销', area: '广东/深圳', tag: '出书 营销', intro: 'Nice ccv', avatar:'http://9zhaowo.com/avatar/lkjsdflhljsd.jpg'},
      {name: '宋安3', hangye: '营销', area: '广东/深圳', tag: '出书 营销', intro: 'Nice ccv', avatar:'http://9zhaowo.com/avatar/lkjsdflhljsd.jpg'},
      {name: '宋安3', hangye: '营销', area: '广东/深圳', tag: '出书 营销', intro: 'Nice ccv', avatar:'http://9zhaowo.com/avatar/lkjsdflhljsd.jpg'},
      {name: '宋安3', hangye: '营销', area: '广东/深圳', tag: '出书 营销', intro: 'Nice ccv', avatar:'http://9zhaowo.com/avatar/lkjsdflhljsd.jpg'}];
      
    res.render('index', mainPage);
	*/
});


//===================================================================

function getUserInfo(id, call){
	 pool.getConnection(function(errc, conn){
		if(errc){
			call(JSON.stringify({err:1, msg:errc}));
		}
		
		conn.query("SELECT wx_openid,name,wx_city,wx_country,wx_headimgurl,indeustry,mobile,tag,specialist,introduce FROM users where wx_openid='" + id + "'", function(errx, rows, fields){
			conn.release();
			if(errx){
				return call(JSON.stringify({err:1, msg:errx}));
			}
			
			if(!rows || rows.length != 1){
				return call(JSON.stringify({err:2, msg:'no such user'}));
			}
			var user = {};
			user.id = rows[0].wx_openid;
			user.name = rows[0].name;
			user.city = rows[0].wx_city;
			user.country = rows[0].wx_country;
			user.avatar = rows[0].wx_headimgurl;
			user.indeustry = rows[0].indeustry;
			user.mobile = rows[0].mobile;
			user.specialist = rows[0].specialist;
			user.tag = rows[0].tag;
			user.introduce = rows[0].introduce;
			
			call(0, user);
		});
	});
}

function getFirstPageData(call){
	pool.getConnection(function(errc, conn){
		if(errc){
			call(JSON.stringify({err:1, msg:errc}));
		}
		
		conn.query("SELECT wx_openid,name,wx_city,tag,industry,wx_headimgurl,specialist,introduce FROM users order by reg_time desc limit 20", function(errx, rows, fields){
			if(!rows || rows.length != 1){
				return call(JSON.stringify({err:2, msg:'no such user'}));
			}
			
			var listUser = [];
			for(var i in rows){
				var one = {};
				one.id = rows[i].wx_openid;
				one.name = rows[i].name;
				one.area = rows[i].wx_city;
				one.tag = rows[i].tag;
				one.avatar = rows[i].wx_headimgurl;
				one.industry = rows[i].industry;
				one.specialist = rows[i].specialist;
				one.introduce = rows[i].introduce;
				listUser.push(one);
			}
			
			call(0, listUser);
		})
	});
}

module.exports = router;
