/**
 * Created by Administrator on 2015-10-27.
 */

var express = require('express');
var db = require('./db');
var http = require('http');
var querystring = require('querystring');
var router = express.Router();

var MIN_NOTIFY_SEC = 3600;
var users = new Map();
setInterval(clearTimeout, 30 * 60 * 1000);

router.get('/list/:id', function(req, res, next){
    res.setHeader("Content-Type", "application/json");
    var uid = req.session.user;
    //var uid = 952091;
    if(!uid){
        return res.end(JSON.stringify({err: 1, msg: 'need login'}));
    }

    var pageId = req.params.id;
    if(pageId === undefined){
        pageId = 0;
    }

    db.getPageMsg(uid, pageId, function(err, data){
        if(err){
            return res.end(JSON.stringify({err: 1, msg: 'internal error'}));
        }

        var msgs = data.msgs;
        for(var i in msgs){
            if(msgs[i].content){
                var cont = JSON.parse(msgs[i].content);
                for(var j in cont){
                    if(cont[j].from == uid){
                        cont[j].inMsg = false;
                    }
                    else{
                        cont[j].inMsg = true;
                    }
                }
                msgs[i].content = cont;
            }
        }

        res.end(JSON.stringify({err: 0, msg: data}));
    })
});

router.get('/post', function(req, res, next) {
    res.setHeader("Content-Type", "application/json");
    //var uid = req.session.user;
    var from = req.query.from;
    var to = req.query.to;

    var uid = 952091;

    if (!uid) {
        return res.end(JSON.stringify({err: 1, msg: 'need login'}));
    }
    if(!from || !to || !req.query.content){
        return res.end(JSON.stringify({err: 1, msg: 'wrong format'}));
    }

    db.postMsg(from, to, req.query.content, function(err, info){
        if(err){
            return res.end(JSON.stringify({err: 1, msg: 'internal error'}));
        }
        res.end(JSON.stringify({err: 0, msg: 'ok'}));

        //�ж��Ƿ���ҪSMS֪ͨ
        var tm = users.get(to);
        var now = (new Date().getTime()) / 1000;
        if(tm && ((now - tm) < MIN_NOTIFY_SEC)){
            return;
        }
        users.set(to, now);

        if(!info){
            db.getMsgUserInfos(from, to, function(err, info){
                if(err || !info){
                    return;
                }
                var obj = {f_n: info.f_n, t_n: info.t_n, f_d: from, t_d: to, t_m: info.t_m};
                sendSMS(obj);
            })
        }
        else{
            if(info.t_m){
                var obj = {f_n: info.f_n, t_n: info.t_n, f_d:  from, t_d: to, t_m: info.t_m};
                sendSMS(obj);
            }
        }
    });
});

function sendSMS(info){
    var obj = {
        action: 'send',
        userid: 12835,
        account: '������APP',
        password: '123456',
        mobile: info.t_m,
        content: "�𾴵��û����������� " + info.f_n + " ���� �ԣ�������ʱ��¼���ںŻ�APP�� ��������ʱ�� ���������������������Ȩ�أ�",
        sendTime: '',
        taskName: 'notify',
        checkcontent: 1,
        mobilenumber: 1,
        countnumber: 1,
        telephonenumber: 1
    }

    var pathx = querystring.stringify(obj);
    pathx = "/sms.aspx?" + pathx;

    var opt = {
        method: "POST",
        host: "www.qf106.com",
        port: 80,
        path: pathx,
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',
            "Content-Length": 0
        }
    };

    console.log(pathx);

    var req = http.request(opt, function (res) {
        res.on('data', function(data){
            if(data.toString().indexOf('>Success<') < 0){
                logErr(data.toString());
            }
        });
    });

    req.on('error', function(err){
        logErr(err);
    });

    req.write("\n");
    req.end();
}

function clearTimeout(){
    var now = (new Date().getTime()) / 1000;
    var arr = [];
    for (var key of users.keys()) {
        var tm = parseInt(users.get(key));
        if((now - tm) > MIN_NOTIFY_SEC){
            arr.push(key);
        }
    }

    for(var i in arr){
        users.delete(arr[i]);
    }
}

module.exports = router;

