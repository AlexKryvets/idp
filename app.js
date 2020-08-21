var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');

var passport = require('passport');
var exphbs = require('express-handlebars');
var flash = require('connect-flash');
var expressSession = require('express-session');

var indexRouter = require('./routes/index');
var ssoRouter = require('./routes/sso');

var spSooRouter = require('./routes/sp-sso');
var spRouter = require('./routes/sp');

var app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'twig');
;


app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars')
app.use(expressSession({
  secret: 't7XWfr2ecOgDnTlfE4yXfgRougxXX9KU',
  resave: true,
  saveUninitialized: true,
  key: 'idp.example.org-session-id'
}));

app.use(passport.initialize());
app.use(passport.session());
require('./auth')(passport);
app.use(flash());

app.use('/', indexRouter);
app.use('/sso', ssoRouter);
app.use('/sp/sso', spSooRouter);
app.use('/sp', spRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
