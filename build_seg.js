
var jieba = require('nodejieba');
var mysql = require('mysql');

jieba.load();

var pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'passwd@db',
    database: '9zhaowo'
});

pool.getConnection(function(errc, conn){
    if(errc){
        return console.log(errc);
    }
    var sql = "SELECT * FROM users";
    conn.query(sql, function(errx, rows, fields){
        conn.release();
        if(errx){
            return console.log(errx);
        }

        if(rows.length == 0){
            return;
        }

        var arr = [];
        for(var i in rows){
            if(rows[i].name.indexOf('徐涛') < 0){
                arr.push(rows[i]);
            }
        }

        update_seg(arr);
    });
});

function getSeg(str){
	var full = jieba.cut(str, 'FULL');
	var mix = jieba.cut(str, 'MIX');
	var out = [];
	var map = [];
	for(var i in full){
		if(!full[i] || full[i].length < 2 || map[full[i]]){
			continue;
		}
		map[full[i]] = true;
		out.push(full[i]);
	}
	for(var i in mix){
		if(!mix[i] || mix[i].length < 2 || map[mix[i]]){
			continue;
		}
		map[mix[i]] = true;
		out.push(mix[i]);
	}
	return out;
}


function update_seg(arr){
    if(arr.length == 0){
        return console.log("done");
		process.exit(0);
    }

    var user = arr.pop();
	var str_core = user.name + " " + user.specialist + " " + user.tag;
    var arr_core = getSeg(str_core);
	var arr_intro = getSeg(user.introduce);

    var seg_core = arr_core.join(' ');
    var seg_intro = arr_intro.join(' ');

    var sql = "update users set seg_core=\"" + seg_core + "\",seg_intro=\"" + seg_intro +"\"  where uid=" + user.uid;
    console.log(sql);

    pool.getConnection(function(errc, conn) {
        if (errc) {
            return console.log(errc);
        }
        conn.query(sql, function(errx, rows, fields) {
            conn.release();
            if(errx){
                return console.log(errx);
            }
            setTimeout(update_seg, 1000, arr);
        });
    });
}
