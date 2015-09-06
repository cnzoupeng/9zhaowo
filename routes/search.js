var express = require('express');
var router = express.Router();
var db = require('./db');
var jieba = require('nodejieba');


//加载分词库
jieba.load();


router.get('/', function(req, res, next){
    if(!req.query.key){
        return res.redirect('/');
    }
    var pageId = 0;
    if(req.query.page){
        pageId = req.query.page;
    }

    var arr = [];
    var seg = jieba.cut(req.query.key);
    for(var i in seg){
        if(seg[i].length > 1){
            arr.push(seg[i]);
        }
    }

    //通过请求头部的pjax判断是否渲染
    var needRender = true;
    if(req.headers.pjax && req.headers.pjax == 'yes'){
        needRender = false;
        res.setHeader("Content-Type", "application/json");
    }

    var mainPage = {err: 0};
    var key = arr.join(' ');

    logSearch(req.query.key, key);

    db.query(key, pageId, function(err, result){
        if(needRender){
            if(err){
                logErr(1006, err);
                return res.render('error', err);
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

        mainPage.userList = result;
        res.end(JSON.stringify(mainPage));
    });
});

function logSearch(str, key){
    return;
}

module.exports = router;