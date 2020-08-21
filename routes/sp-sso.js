var fs = require('fs');
var express = require('express');
var router = express.Router();
var utility = require('samlify').Utility;
var ServiceProvider = require('samlify').ServiceProvider;
var IdentityProvider = require('samlify').IdentityProvider;

var config = {
    privateKey: fs.readFileSync('./key/privatekey.pem'),
    // privateKeyPass: 'VHOSp5RUiBcrsjrcAuXFwU1NKCkGA8px',
    // encPrivateKey: fs.readFileSync('../key/sp/encryptKey.pem'),
    // encPrivateKeyPass: 'VHOSp5RUiBcrsjrcAuXFwU1NKCkGA8px',
    // requestSignatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha512',
    metadata: fs.readFileSync('./metadata/metadata_sp1.xml')
};

var spSso = ServiceProvider(config);
var idp = IdentityProvider({
    // isAssertionEncrypted: true,
    metadata: fs.readFileSync('./metadata/metadata_idp1.xml')
});

router.get('/metadata', function (req, res, next) {
    res.header('Content-Type', 'text/xml').send(spSso.getMetadata());
});

router.get('/spinitsso-post', function (req, res) {
    var which = req.query.id || '';
    var toIdP, fromSP;
    switch (which) {
        case 'onelogin': {
            fromSP = olsp;
            toIdP = oneLoginIdP;
            break;
        }
        case 'okta': {
            fromSP = otsp;
            toIdP = oktaIdp;
            break;
        }
        default: {
            fromSP = spSso;
            toIdP = idp;
            break;
        }
    }

    const request = fromSP.createLoginRequest(toIdP, 'post')
    console.log('[request] for post request', request);
    res.render('actions', request);

});

router.get('/spinitsso-redirect', function (req, res) {
    const request = spSso.createLoginRequest(idp, 'redirect');
    res.redirect(request.context);
});

router.post('/acs/:idp?', function (req, res, next) {
    var _idp, _sp;
    if (req.params.idp === 'onelogin') {
        _idp = oneLoginIdP;
        _sp = olsp;
    } else if (req.params.idp === 'okta') {
        _idp = oktaIdp;
        _sp = otsp;
    } else {
        _idp = idp;
        _sp = spSso;
    }
    _sp.parseLoginResponse(_idp, 'post', req)
        .then(parseResult => {
            if (parseResult.extract.nameid) {
                res.render('login', {
                    title: 'Processing',
                    isSSOLogin: true,
                    email: parseResult.extract.nameid
                });
            } else {
                req.flash('info', 'Unexpected error');
                res.redirect('/login');
            }
        })
        .catch(err => {
            res.render('error', {
                message: err.message
            });
        });
});

function slo (req, res, binding, relayState) {
    spSso.parseLogoutRequest(idp, binding, req)
        .then(parseResult => {
            // Check before logout
            req.logout();
            const response = spSso.createLogoutResponse(idp, parseResult, 'redirect', relayState);
            res.redirect(response.context);
        })
        .catch(err => {
            res.render('error', {
                message: err.message
            });
        });

}

router.post('/slo', function (req, res) {
    slo(req, res, 'post', req.body.RelayState)
});

router.get('/slo', function (req, res) {
    slo(req, res, 'redirect', req.query.RelayState)
});

module.exports = router;
