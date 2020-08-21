var express = require('express');
var router = express.Router();
var fs = require('fs');
var samlify = require('samlify');

samlify.setSchemaValidator({
  validate: (response) => {
    /* implment your own or always returns a resolved promise to skip */
    return Promise.resolve('skipped');
  }
});

var idp1 = samlify.IdentityProvider({
  privateKey: fs.readFileSync('./key/privatekey.pem'),
  // isAssertionEncrypted: true,
  // encPrivateKey: fs.readFileSync('../key/idp/encryptKey.pem'),
  // encPrivateKeyPass: 'g7hGcRmp8PxT5QeP2q9Ehf1bWe9zTALN',
  // privateKeyPass: 'q9ALNhGT5EhfcRmp8Pg7e9zTQeP2x1bW',
  metadata: fs.readFileSync('./metadata/metadata_idp1.xml')
});

var sp1 = samlify.ServiceProvider({ metadata: fs.readFileSync('./metadata/metadata_sp1.xml') });

// router.get('/metadata/:id', function (req, res, next) {
//   var entity = entityPair(req.params.id);
//   var assoIdp = entity.assoIdp;
//   res.header('Content-Type', 'text/xml').send(assoIdp.getMetadata());
// });

router.get('/metadata', function (req, res, next) {
  res.header('Content-Type', 'text/xml').send(idp1.getMetadata());
});

router.all('/:action/:id', function (req, res, next) {
  if (!req.isAuthenticated()) {
    var url = '/login';
    if (req.params && req.params.action == 'SingleSignOnService') {
      if (req.method.toLowerCase() == 'post') {
        url = '/login/external.esaml?METHOD=post&TARGET=' + samlify.Utility.base64Encode(JSON.stringify({
          entityEndpoint: req.originalUrl,
          type: 'SAMLRequest',
          context: req.body.SAMLRequest,
          relayState: req.body.relayState
        }));
      } else if (req.method.toLowerCase() == 'get') {
        url = '/login/external.esaml?METHOD=get&TARGET=' + samlify.Utility.base64Encode(req.originalUrl);
      }
    } else if (req.params && req.params.action == 'SingleLogoutService') {
      if (req.method.toLowerCase() == 'post') {
        url = '/logout/external.esaml?METHOD=post&TARGET=' + samlify.Utility.base64Encode(JSON.stringify({
          entityEndpoint: req.originalUrl,
          type: 'LogoutRequest',
          context: req.body.LogoutRequest,
          relayState: req.body.relayState
        }));
      } else if (req.method.toLowerCase() == 'get') {
        url = '/logout/external.esaml?METHOD=get&TARGET=' + samlify.Utility.base64Encode(req.originalUrl);
      }
    } else {
      // Unexpected error
      console.warn('Unexpected error');
    }
    return res.redirect(url);
  }
  next();
});

router.get('/SingleSignOnService/:id', function (req, res) {
  // var entity = entityPair(req.params.id);
  // var assoIdp = entity.assoIdp;
  // var targetSP = entity.targetSP;
  var assoIdp = idp1;
  var targetSP = sp1;
  assoIdp.parseLoginRequest(targetSP, 'redirect', req)
      .then(parseResult => {
        // req.user.email = epn[req.user.sysEmail].app[req.params.id.toString()].email;
        req.user.email = 'admin@sp1.com';
        return assoIdp.createLoginResponse(targetSP, parseResult, 'post', req.user);
      })
      .then(response => {
        res.render('actions', response);
      })
      .catch(err => {
        console.log(err);
        res.render('error', {
          message: err.message
        });
      });
});

router.get('/SingleLogoutService/:id', function (req, res) {
  // var entity = entityPair(req.params.id);
  // var assoIdp = entity.assoIdp;
  // var targetSP = entity.targetSP;
  var assoIdp = idp1;
  var targetSP = sp1;
  assoIdp.parseLogoutResponse(targetSP, 'redirect', req)
      .then(parseResult => {
        if (req.query.RelayState) {
          res.redirect(req.query.RelayState);
        } else {
          req.logout();
          req.flash('info', 'All participating service provider has been logged out');
          res.redirect('/login');
        }
      }).catch(err => {
    console.log(err);

    res.render('error', {
      message: err.message
    });
  });
});

module.exports = router;
