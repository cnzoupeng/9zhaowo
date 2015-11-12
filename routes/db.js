var mysql = require('mysql');

var pool = mysql.createPool({
	connectionLimit: 20,
	host: 'localhost',
	user: 'root',
	password: 'passwd@db',
	database: '9zhaowo'
});

var pageUserCount = 10;
var pageMsgCount = 10;
var max_intro_len = 30;
var userCount = 0;
var maxUid = 0;

function getUserInfo(id, call){
	 pool.getConnection(function(errc, conn){
		if(errc){
			logErr(1001, errc);
			return call(JSON.stringify({err:1, msg:errc}));
		}
		var sql = "SELECT newMsg,uid,name,usertype,wx_city,wx_country,wx_headimgurl,industry,mobile,tag,specialist,introduce FROM users where uid='" + id + "'";
		logDbg(1002, sql);
		conn.query(sql, function(errx, rows, fields){
			conn.release();
			if(errx){
				logErr(1003, errx);
				return call(JSON.stringify({err:1, msg:errx}));
			}
			
			if(!rows || rows.length < 1){
				logErr(1004, 'wrong user ' + id);
				return call(JSON.stringify({err:2, msg:'no such user'}));
			}
			var user = {};
			user.newMsg = rows[0].newMsg;
			user.uid = rows[0].uid;
			user.name = rows[0].name;
			user.type = rows[0].usertype;
			user.city = rows[0].wx_city;
			user.country = rows[0].wx_country;
			user.avatar = rows[0].wx_headimgurl;
			user.industry = rows[0].industry;
			user.mobile = rows[0].mobile;
			user.specialist = rows[0].specialist;
			user.tag = rows[0].tag;
			user.introduce = rows[0].introduce;
			
			call(0, user);
		});
	});
}

function getPageUsers(industry, pageId, call){
	pool.getConnection(function(errc, conn){
		if(errc){
			logErr(1005, errc);
			return call(JSON.stringify({err:1, msg:errc}));
		}

		console.log(industry)
		var userStart = pageId * pageUserCount;
		var sql = "SELECT uid,name,wx_city,tag,company,position,service,industry,wx_headimgurl,specialist,introduce FROM users where usertype=8 ";
		if(industry != 'all'){
			sql += "and industry like '%" + industry + "%' ";
		}
		sql += "order by reg_time desc limit " + userStart + "," + pageUserCount;

		logDbg(1006, sql);
		conn.query(sql, function(errx, rows, fields){
			conn.release();
			var result = {count: userCount, users: []};
			result.lastPage = rows.length == pageUserCount ? false : true;
			for(var i in rows){
				var one = {};
				one.uid = rows[i].uid;
				one.name = rows[i].name;
				one.city = rows[i].wx_city;
				one.tag = rows[i].tag;
				one.company = rows[i].company;
				one.position = rows[i].position;
				one.service = rows[i].service;
				one.avatar = rows[i].wx_headimgurl;
				one.industry = rows[i].industry;
				one.specialist = rows[i].specialist;
				one.introduce = rows[i].introduce;
				if(one.city){
					var arr = one.city.split('/');
					one.city_short = arr[1];
				}
				result.users.push(one);
			}
			call(0, result);
		})
	});
}

function getPageMsg(id, pageId, call){
	pool.getConnection(function(errc, conn){
		if(errc){
			logErr(1008, errc);
			return call(JSON.stringify({err:3, msg:errc}));
		}
		
		var msgStartId = pageId * pageMsgCount;
		var sql = "SELECT * FROM msg where uid =" + id + " or peer_uid =" + id + " order by uptime desc limit " + msgStartId + "," + pageMsgCount;
		logDbg(1009, sql);
		conn.query(sql, function(errx, rows, fields){
			conn.release();
			if(!rows || rows.length == 0){
				return call(0, []);
			}
			
			var result = {hasNew: false, msgs: []};
			if(pageId == 0 && rows[0].isReaded == 0){
				result.hasNew = true;
			}
			result.lastPage = rows.length == pageMsgCount ? false : true;

			for(var i in rows){
				var one = {};
				one.update = rows[i].uptime;
				if(rows[i].uid == id){
					one.uid = rows[i].uid;
					one.name = rows[i].name;
					one.avatar = rows[i].avatar;
					one.peer_uid = rows[i].peer_uid;
					one.peer_name = rows[i].peer_name;
					one.peer_avatar = rows[i].peer_avatar;
				}
				else{
					one.peer_uid = rows[i].uid;
					one.peer_name = rows[i].name;
					one.peer_avatar = rows[i].avatar;
					one.uid = rows[i].peer_uid;
					one.name = rows[i].peer_name;
					one.avatar = rows[i].peer_avatar;
				}
				one.content = rows[i].content;
				result.msgs.push(one);
			}
			
			call(0, result);
		})
	});
}

function updateUserMsgState(id, time, call){
	pool.getConnection(function(errc, conn){
		if(errc){
			logErr(1010, errc);
			call(JSON.stringify({err:3, msg:errc}));
		}
		
		var sql = "update msg set isReaded = 1 where id='" + id + "' and time ='" + time + "'";
		logDbg(1011, sql);
		conn.query(sql, function(errx, rows, fields){
			conn.release();
			if(errx){
				logErr(1012, errx);
				return call(JSON.stringify({err:3, msg:errx}));
			}
			call(0);
		});
	});
}

function _updateUserCount(){
	pool.getConnection(function(errc, conn){
		if(errc){
			logErr(1013, errc);
			return;
		}
		
		var sql = "select count(*) as countx from users";
		logDbg(1014, sql);
		conn.query(sql, function(errx, rows, fields){
			if(errx){
				logErr(1014, errx);
				conn.release();
				return;
			}
			userCount = rows[0].countx;

			sql = "select max(uid) as maxid from users";
			conn.query(sql, function(errx, rows, fields){
				conn.release();
				if(errx){
					logErr(1014, errx);

					return;
				}
				maxUid = rows[0].maxid;
			});
		});
	});
}

function queryKey(query, pageId, call){
	pool.getConnection(function(errc, conn){
		if(errc){
			logErr(1005, errc);
			return call({err:1, msg:errc});
		}

		var userStart = pageId * pageUserCount;
		var sql = buildQuerySql(query, pageId);

		logDbg(1010, sql);
		conn.query(sql, function(errx, rows, fields){
			conn.release();
			if(errx){
				return call({err:2, msg:errx});
			}

			var result = {users: []};
			result.lastPage = rows.length == pageUserCount ? false : true;

			for(var i in rows){
				var one = {};
				one.uid = rows[i].uid;
				one.name = rows[i].name;
				one.city = rows[i].wx_city;
				one.tag = rows[i].tag;
				one.avatar = rows[i].wx_headimgurl;
				one.industry = rows[i].industry;
				one.specialist = rows[i].specialist;
				one.introduce = rows[i].introduce;
				result.users.push(one);
			}

			call(0, result);
		})
	});
}

function buildQuerySql(query, pageId){
	var sql = "";
	var condition = [];

	if(query.city){
		condition.push("wx_city like '%" + query.city + "%'");
	}
	if(query.industry){
		condition.push("industry like '%" + query.industry + "%'");
	}

	if(query.key){
		condition.push("MATCH(seg_core) AGAINST ('" + query.key + "')");
		sql = "SELECT uid,name,wx_city,tag,industry,wx_headimgurl,specialist,introduce FROM users where " + condition.join(' AND ') ;
		condition.pop();
		condition.push("MATCH(seg_intro) AGAINST ('" + query.key + "' IN BOOLEAN MODE)");
		sql += " UNION SELECT uid,name,wx_city,tag,industry,wx_headimgurl,specialist,introduce FROM users where ";
		sql += condition.join(' AND ');
	}
	else{
		sql = "SELECT * FROM users where " + condition.join(' AND ');
	}
	var userStart = pageId * pageUserCount;
	var sqlRet = "SELECT * from (" + sql + ") as t limit " + userStart + "," + pageUserCount;
	return sqlRet;
}

function InsertNewUser(user, call){
	pool.getConnection(function(errc, conn) {
		if (errc) {
			logErr(1013, errc);
			return call(1, JSON.stringify({err: 1, msg: errc}));
		}

		var sql = "SELECT uid FROM users where wx_openid='" + user.openid + "'";
		logDbg(1014, sql);
		conn.query(sql, function (errx, rows, fields) {
			if (errx) {
				conn.release();
				logErr(1003, errx);
				return call(2, JSON.stringify({err: 1, msg: errx}));
			}

			var uid;
			if (!rows || rows.length < 1) {
				uid = maxUid + 7;

				sql = "INSERT INTO users(uid, wx_openid, wx_nickname, wx_sex, wx_city, wx_country, wx_headimgurl, reg_time, reg_ip, reg_dev, usertype) values(";
				sql += uid;
				sql += ", '"  + user.openid ;
				sql += "', '"  + user.nickname ;
				sql += "', "  + user.sex ;
				sql += ", '"  + user.province + "/" + user.city;
				sql += "', '" + user.country;
				sql += "', '"  + user.headimgurl ;
				sql += "', now()";
				sql += ", '"  + user.reg_ip ;
				sql += "','"  + user.reg_dev ;
				sql += "', 5)";
			}
			else{
				uid = rows[0].uid;
				sql = "UPDATE users SET wx_openid='" + user.openid + "'";
				sql += ", wx_nickname='" + user.nickname + "'";
				sql += ", wx_sex='" + user.sex + "'";
				sql += ", wx_city='" + user.province + "/" + user.city+ "'";
				sql += ", wx_country='" + user.country;
				sql += "', wx_headimgurl='" + user.headimgurl + "'";
				sql += " where uid=" + uid;
			}

			logDbg(1014, sql);
			conn.query(sql, function (errx, rows, fields) {
				conn.release();
				if (errx) {
					logErr(1003, errx);
					return call(3, JSON.stringify({err: 1, msg: errx}));
				}

				maxUid = uid;
				call(0, uid);
			});
		});
	});
}

function updateUserInfo(user, call){
	pool.getConnection(function(errc, conn) {
		if (errc) {
			logErr(1013, errc);
			return call(1, JSON.stringify({err: 1, msg: errc}));
		}

		var sql = "UPDATE users SET name='" + user.name + "'";
		sql += ", mobile='" + user.phone + "'";
		sql += ", tag='" + user.tag + "'";
		sql += ", industry='" + user.industry + "'";
		sql += ", introduce='" + user.intro + "'";
		sql += " WHERE uid=" + user.uid;

		logDbg(1014, sql);
		conn.query(sql, function (errx, rows, fields) {
			conn.release();
			if (errx) {
				logErr(1003, errx);
				return call(3, JSON.stringify({err: 1, msg: errx}));
			}
			call(0);
		});
	});
}

function updateSeg(seg, call){
	pool.getConnection(function(errc, conn) {
		if (errc) {
			return call(1, errc);
		}

		var sql = "UPDATE users SET seg_core=\"" + seg.core + "\",seg_intro=\"" + seg.intro + "\"  WHERE uid=" + seg.uid;
		logDbg(1014, sql);
		conn.query(sql, function (errx, rows, fields) {
			conn.release();
			if (errx) {
				return call(1, errx);
			}
			call(0);
		});
	});
}

function _getUserNameAvatar(from, to, call){
	pool.getConnection(function(errc, conn) {
		if (errc) {
			logErr(1008, errc);
			return call(3, errc);
		}

		var from_name, from_avatar, to_name, to_avatar, to_mobile;
		var sql = "SELECT name,wx_headimgurl FROM users where uid=" + from;
		logDbg(1009, sql);
		conn.query(sql, function(err1, rows, fields) {
			if(err1){
				conn.release();
				logErr(1008, err1);
				return call(3, err1);
			}

			if(rows.length == 0){
				conn.release();
				return call(3, 'no user ' + from);
			}

			from_name = rows[0].name;
			from_avatar = rows[0].wx_headimgurl;

			var sql = "SELECT name,wx_headimgurl,mobile FROM users where uid=" + to;
			logDbg(1009, sql);
			conn.query(sql, function(err2, rows, fields) {
				conn.release();

				if(err2){
					logErr(1008, err2);
					return call(3, err2);
				}

				if(rows.length == 0){
					conn.release();
					return call(3, 'no user ' + to);
				}

				to_name = rows[0].name;
				to_avatar = rows[0].wx_headimgurl;
				to_mobile = rows[0].mobile;
				var obj = {f_n: from_name, f_a: from_avatar, t_n: to_name, t_a: to_avatar, t_m: to_mobile};
				call(0, obj);
			});
		});
	});
}

function postMsg(from, to, contentx, call){
	pool.getConnection(function(errc, conn) {
		if (errc) {
			logErr(1008, errc);
			return call(3, errc);
		}
		var sql = "SELECT uid,peer_uid,name,peer_name,content FROM msg where (uid =" + from + " and peer_uid =" + to + ") or (uid=" + to + " and peer_uid=" + from + ")";
		logDbg(1009, sql);
		conn.query(sql, function (errx, rows, fields) {
			if (errx) {
				conn.release();
				logErr(1008, errx);
				return call(3, errx);
			}

			//new msg
			if (rows.length == 0) {
				_getUserNameAvatar(from, to, function (err, uInfo) {
					if (err) {
						return call(3, uInfo);
					}

					var content = {}
					content.time = new Date().format('yyyy-MM-dd hh:mm:ss');
					content.from = from;
					content.to = to;
					content.msg = contentx;
					var cs = [];
					cs.push(content)
					var str = JSON.stringify(cs);
					str = str.replace(/\"/g, "\\\"");

					sql = "INSERT INTO msg(uid, name, avatar, uptime, peer_uid, peer_name, peer_avatar, content) VALUES(" + from;
					sql += ", \"" + uInfo.f_n + "\"";
					sql += ", \"" + uInfo.f_a + "\"";
					sql += ", now()";
					sql += ", " + to;
					sql += ", \"" + uInfo.t_n + "\"";
					sql += ", \"" + uInfo.t_a + "\"";
					sql += ", \"" + str + "\")";

					logDbg(1009, sql);
					conn.query(sql, function (errx, rows, fields) {
						conn.release();
						if (errx) {
							logErr(1008, errx);
							return call(3, errx);
						}

						return call(0, uInfo);
					});
				});
			}
			//msg response
			else {
				var uid = rows[0].uid;
				var peer_uid = rows[0].peer_uid;
				var cont = JSON.parse(rows[0].content);

				var item = {};
				item.time = new Date().format('yyyy-MM-dd hh:mm:ss');
				item.from = from;
				item.to = to;
				item.msg = contentx;
				cont.push(item);
				var newContent = JSON.stringify(cont);
				newContent = newContent.replace(/\"/g, "\\\"");

				sql = "UPDATE msg set uptime=now(), content=\"" + newContent + "\" WHERE uid=" + uid + " AND peer_uid=" + peer_uid;
				logDbg(1009, sql);
				conn.query(sql, function (errx, rows, fields) {
					conn.release();
					if (errx) {
						logErr(1008, errx);
						return call(3, errx);
					}
					return call(0);
				});
			}
		});
	});
}

function getMsgUserInfos(from, to, call){
	_getUserNameAvatar(from, to, call);
}

Date.prototype.format =function(format)
{
	var o = {
		"M+" : this.getMonth()+1, //month
		"d+" : this.getDate(),    //day
		"h+" : this.getHours(),   //hour
		"m+" : this.getMinutes(), //minute
		"s+" : this.getSeconds(), //second
		"q+" : Math.floor((this.getMonth()+3)/3),  //quarter
		"S" : this.getMilliseconds() //millisecond
	}
	if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
		(this.getFullYear()+"").substr(4- RegExp.$1.length));
	for(var k in o)if(new RegExp("("+ k +")").test(format))
		format = format.replace(RegExp.$1,
			RegExp.$1.length==1? o[k] :
				("00"+ o[k]).substr((""+ o[k]).length));
	return format;
}

_updateUserCount();

module.exports = {};

module.exports.pageUserCount = pageUserCount;
module.exports.pageMsgCount = pageMsgCount;
module.exports.max_intro_len = max_intro_len;

module.exports.getUserInfo = getUserInfo;
module.exports.getPageUsers = getPageUsers;
module.exports.getPageMsg = getPageMsg;
module.exports.updateUserMsgState = updateUserMsgState;
module.exports.query = queryKey;
module.exports.InsertNewUser = InsertNewUser;
module.exports.updateUserInfo = updateUserInfo;
module.exports.updateSeg = updateSeg;
module.exports.postMsg = postMsg;
module.exports.getMsgUserInfos = getMsgUserInfos;

