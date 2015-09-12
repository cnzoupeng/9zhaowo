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
var max_intro_len = 60;
var userCount = 0;

function getUserInfo(id, call){
	 pool.getConnection(function(errc, conn){
		if(errc){
			logErr(1001, errc);
			return call(JSON.stringify({err:1, msg:errc}));
		}
		var sql = "SELECT uid,name,wx_city,wx_country,wx_headimgurl,industry,mobile,tag,specialist,introduce FROM users where uid='" + id + "'";
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
			user.uid = rows[0].uid;
			user.name = rows[0].name;
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

function getPageUsers(pageId, call){
	pool.getConnection(function(errc, conn){
		if(errc){
			logErr(1005, errc);
			return call(JSON.stringify({err:1, msg:errc}));
		}
		
		var userStart = pageId * pageUserCount;
		var sql = "SELECT uid,name,wx_city,tag,industry,wx_headimgurl,specialist,introduce FROM users order by reg_time desc limit " + userStart + "," + pageUserCount;
		logDbg(1006, sql);
		conn.query(sql, function(errx, rows, fields){
			conn.release();
			if(!rows || rows.length == 0){
				logErr(1007, 'db error empty');
				return call(JSON.stringify({err:2, msg:'no users found'}));
			}
			
			var result = {count: userCount, users: []}
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

function getPageMsg(id, pageId, call){
	pool.getConnection(function(errc, conn){
		if(errc){
			logErr(1008, errc);
			return call(JSON.stringify({err:3, msg:errc}));
		}
		
		var msgStartId = pageId * pageMsgCount;
		var sql = "SELECT * FROM msg where uid =" + id + " order by time desc limit " + msgStartId + "," + pageMsgCount;
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
				one.time = rows[i].time;
				one.direct = rows[i].direct;
				one.peer_uid = rows[i].peer_uid;
				one.peer_name = rows[i].peer_name;
				one.peer_avatar = rows[i].peer_avatar;
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
			conn.release();
			if(errx){
				logErr(1014, errx);
				return;
			}
			userCount = rows[0].countx;
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
