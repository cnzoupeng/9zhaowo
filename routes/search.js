var express = require('express');
var router = express.Router();
var db = require('./db');
var jieba = require('nodejieba');


//加载分词库
jieba.load();


router.get('/search', function(req, res, next){
    if(!req.query.key){
        return res.redirect('/');
    }
    var pageId = 0;
    if(req.query.page){
        pageId = req.query.page;
    }

    var arr = [];
    var seg = jieba.cut(req.query.key);
    for(var i in seq){
        if(seq[i].length > 1){
            arr.push(seq[i]);
        }
        arr.push(seq[i]);
    }

    //通过请求头部的pjax判断是否渲染
    var needRender = true;
    if(req.headers.pjax && req.headers.pjax == 'yes'){
        needRender = false;
        res.setHeader("Content-Type", "application/json");
    }

    var mainPage = {};
    var key = arr.join(' ');
    db.query(key, pageId, function(err, result){
        if(needRender){
            if(err){
                logErr(1006, errc);
                return res.render('error', err);
            }
            for(var i in result.users){
                if(result.users[i].introduce.length > MAX_INTRO_LEN){
                    result.users[i].introduce = result.users[i].introduce.substr(0, db.max_intro_len);
                    result.users[i].introduce += "...";
                }
            }
            mainPage.login = false;
            mainPage.userList = result;
            return res.render('index', mainPage);
        }

        mainPage.userList = result;
        res.end(mainPage);
    });
});

module.exports = router;