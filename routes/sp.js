var express = require('express');
var passport = require('passport');
var router = express.Router();


/* GET home page. */
router.get('/', function (req, res, next) {
    if (req.isAuthenticated()) {
        res.render('sp-index', {
            title: 'sp1 - My Application',
            user: req.user
        });
    } else {
        res.redirect('/sp/login');
    }
});

router.get('/login', function (req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    } else {
        return res.render('sp-login', {
            title: 'sp1 - Login',
            messages: req.flash('info')
        });
    }
});

router.get('/logout', function (req, res, next) {
    req.logOut();
    res.redirect('/sp/login');
});

router.get('/logout/external.esaml', function (req, res, next) {
    req.logOut();
    res.send(JSON.stringify({
        success: true
    }));
});

router.post('/sp/login', passport.authenticate('local-login', { failureRedirect: '/login', successRedirect: '/' }));

router.post('/sp/login/external.esaml', passport.authenticate('sso-login', { failureRedirect: '/login', successRedirect: '/' }));

module.exports = router;
