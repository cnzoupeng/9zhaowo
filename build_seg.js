
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

function update_seg(arr){
    if(arr.length == 0){
        return console.log("done");
    }

    var user = arr.pop();

    var seg_tag = jieba.cut(user.tag);
    var seg_intro = jieba.cut(user.introduce);

    var arr_tag = [];
    for(var i in seg_tag){
        if(seg_tag[i].length > 1){
            arr_tag.push(seg_tag[i]);
        }
    }

    var arr_intro = [];
    for(var i in seg_intro){
        if(seg_intro[i].length > 1){
            arr_intro.push(seg_intro[i]);
        }
    }

    seg_tag = arr_tag.join(' ');
    seg_intro = arr_intro.join(' ');

    var sql = "update users set seg_tag=\"" + seg_tag + "\",seg_intro=\"" + seg_intro +"\"  where uid=" + user.uid;
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
