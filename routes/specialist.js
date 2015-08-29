var express = require('express');
var db = require('./db');
var router = express.Router();


/* GET users listing. */
router.get('/:id', function(req, res, next) {
  if(!req.params.id){
    return res.render('404');
  }
  
  db.getUserInfo(req.params.id, function(err, userInfo){
    if(err){
		  return res.render('error', err);
    }	
    res.render('specialist', userInfo);
  });
});


module.exports = router;
