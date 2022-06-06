require('dotenv').config()
   


var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs= require('express-handlebars')
var db=require('./config/connection')
var session=require('express-session')
var swal=require('sweetalert2')

var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');
const pdfRouter = require('./routes/pdfgenerator');
 
var app = express(); 

var Hbs=hbs.create({});

//register new fuction

Hbs.handlebars.registerHelper('if_eq', function(a, b, opts) {
  if(a == b) // Or === depending on your needs
      return opts.fn(this);
  else
      return opts.inverse(this);
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:"layout",layoutsDir:__dirname+'/views/layout',partialsDir:__dirname+'/views/partials'}))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:'key'}))


db.connect((err)=>{
  if(err){
    console.log('connection Error'+err); 
  }else{
    console.log('Database connected');
  }
})



app.use('/', usersRouter);
app.use('/admin', adminRouter);
app.use('/pdf', pdfRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.render('404',{err404:true})
  // next(createError(404));
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
