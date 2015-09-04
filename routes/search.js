var express = require('express');
var router = express.Router();
var db = require('./db');


router.get('/search', function(req, res, next){
    res.redirect('/');
});