var express=require('express');
var app=express(); 
var flash=require('connect-flash');//flash message on true or false login
var LocalStrategy=require('passport-local').Strategy;//handling strategies
var bodyParser=require('body-parser');// to extract body in the request by the user


//body parser
app.use(bodyParser.urlencoded({ extended: false }));// if there is an error at body parsing the change it to False
app.use(bodyParser.json());//body is represented in json format

//serving files
app.use(express.static('public'));// for the use of html files

//globals
var PORT=process.env.PORT||9000;

//EJS
app.set('view engine','ejs');


//configure mongoose
var dbConfig = require('./db');
var mongoose = require('mongoose');
// Connect to DB
mongoose.connect(dbConfig.url);

//configure passport
var passport=require('passport');//passport.js for authentication
var session = require("express-session");


app.use(session({ 
    secret: "cats",
    resave: false,
    saveUninitialized: false  }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash())//flash is a function


var initPassport = require('./passport/init');
initPassport(passport);

var routes = require('./routes/index')(passport);
app.use('/', routes);

var server=app.listen(PORT,function(){
    var host=server.address().address
    var port=server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
})


// https://user-management-2018.herokuapp.com/