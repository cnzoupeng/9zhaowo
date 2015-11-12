/**
 * Created by Administrator on 2015/10/23.
 */

var https = require('https');
var express = require('express');
var db = require('./db');
var router = express.Router();
var jieba = require('./search').jieba;

var UserType = {
    NORMAL: 5,
    SPCIALIST: 8
}

router.get('/wx_oauth', function(req, res, next) {
    if(!req.query.code){
        return res.end("wx login failed");
    }

    getUserAccessToken(req.query.code, function(err, json){
        if(err){
            return res.end("wx login failed");
        }
        if(json.errcode || !json.access_token || !json.openid){
            return res.end("wx login failed");
        }

        getUserInfo(json.access_token, json.openid, function(err, wxUserInfo){
            console.log(wxUserInfo);
            if(err){
                return res.end("wx login failed");
            }
            if(json.errcode){
                console.log(json);
                return res.end("wx login failed");
            }
            wxUserInfo.reg_ip = req.headers['x-forwarded-for'];
            wxUserInfo.reg_dev = "mobile";

            db.InsertNewUser(wxUserInfo, function(err, uid){
                if(err){
                    return res.end("wx login failed");
                }

                req.session.user = uid;
                res.cookie('uid', uid);
                res.redirect('/');
            });
        })
    });
});

router.post('/update_personal', function(req, res, next){
    var uid = req.session.user;
    //var uid = 952091;
    if(!uid){
        return res.end(JSON.stringify({err:1, msg:'need login'}));
    }

    var user = {uid: uid};
    user.name = req.body.name ? req.body.name : "";
    user.phone = req.body.phone ? req.body.phone : "";
    user.tag = req.body.tag ? req.body.tag : "";
    user.intro = req.body.intro ? req.body.intro : "";
    user.industry = req.body.industry ? req.body.industry : "";
    if(user.intro.length > 1024){
        user.intro = user.intro.substr(0, 1024);
    }

    db.updateUserInfo(user, function (err, msg) {
        if(err){
            return res.end(JSON.stringify({err:1, msg:'db error'}));
        }
        res.end(JSON.stringify({err:0, msg:'ok'}));

        update_search_seg(user);
    })
})

function getUserAccessToken(code, call){
    var url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx45de252db48d8d3d&secret=81d00b8700ca37bdba5ef08cfc095a9b&code=" + code + "&grant_type=authorization_code";
    https.get(url, function(resx) {
        var resData = "";
        resx.on('data', function(d) {
            resData += d.toString();
        });

        resx.on('end', function(d){
            if(d){
                resData += d.toString();
            }

            var js = JSON.parse(resData);
            if(!js){
              return  call(1, 'not json');
            }

            call(0, js);
        })

    }).on('error', function(e) {
        call(1, e);
    });
}

function getUserInfo(token, openid, call){
    var url = "https://api.weixin.qq.com/sns/userinfo?access_token=" + token + "&openid=" + openid + "&lang=zh_CN";
    https.get(url, function(resx) {
        var resData = "";
        resx.on('data', function(d) {
            resData += d.toString();
        });

        resx.on('end', function(d){
            if(d){
                resData += d.toString();
            }

            var js = JSON.parse(resData);
            if(!js){
                return  call(1, 'not json');
            }

            call(0, js);
        })

    }).on('error', function(e) {
        call(1, e);
    });
}

//??????
function update_search_seg(user){
    var seg_core = "";
    var seg_intro = "";
    var arr_tag = [];
    var arr_intro = [];

    if(user.name.length > 0 || user.tag.length > 0 || user.industry.length > 0){
        seg_core = jieba.cut(user.name + " " + user.tag + " " +  user.industry);
        for(var i in seg_core){
            if(seg_core[i].length > 1){
                arr_tag.push(seg_core[i]);
            }
        }
    }

    if(user.intro.length > 0){
        seg_intro = jieba.cut(user.intro);
        for(var i in seg_intro){
            if(seg_intro[i].length > 1){
                arr_intro.push(seg_intro[i]);
            }
        }
    }

    seg_core = arr_tag.join(' ');
    seg_intro = arr_intro.join(' ');
    if(seg_core.indexOf(user.name) < 0){
        seg_core += " " + user.name;
    }
    var seg = {uid: user.uid, core: seg_core, intro: seg_intro};
    db.updateSeg(seg, function(err, msg){
        if(err){
            logErr(1, msg);
        }
    });
}

function test(req, res){
    var wxUserInfo = {
        openid: '12312xxxxsfsdfsdf',
        nickname: 'testx',
        sex: 1,
        province: '??????',
        city: '??????',
        country: 'cn',
        headimgurl: 'http:/sdfkljsdlkf/xkclvjlk.png'
    }

    wxUserInfo.reg_ip = req.headers['x-forwarded-for'];
    wxUserInfo.reg_dev = "mobile";

    db.InsertNewUser(wxUserInfo, function(err, uid){
        if(err){
            return res.end("wx login failed");
        }
        res.cookie('uid', uid);
        console.log('auth done');
        res.redirect('/');
    });
}

module.exports = router;