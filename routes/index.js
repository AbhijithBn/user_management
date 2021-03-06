//express app-generator
var express=require('express');

//express router
var router=express.Router();

//database model
var User=require('../models/user');//access the databse content

//file server
router.use(express.static('public'));// for the use of ejs files

//encryption middleware
var bcrypt = require('bcryptjs');//password authentications

//body parser
var bodyParser=require('body-parser');
router.use(bodyParser.urlencoded({extended: true}))
var flash = require('express-flash');
router.use(flash());


/*
//image upload
var multer=require('multer');

// SET STORAGE for storing the image

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})
var upload = multer({ storage: storage })
*/

//used to handle forgot password
var async=require('async');
var nodemailer=require('nodemailer');
var crypto=require('crypto');

//check if authenticated
var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. 
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

module.exports = function(passport){

	/* GET login page. */
	router.get('/', function(req, res) {
        res.render("login.ejs");
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash : true  
	}));


	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render("register.ejs");
	});

	// POST REGISTRATION PAGE
	router.post('/signup',function(req, res,next){
		async.waterfall([
			// GENERATION OF TOKEN
			function(done){
				crypto.randomBytes(20,function(err,buf){
					var token=buf.toString('hex');
					done(err,token);
				});
			},
			//CHECK DATABASE FOR USER
			function(token,done){

				User.findOne({ email: req.body.email }).then(user => {
					if (user) {
						console.log( 'Email already exists' );
						res.redirect('/');
					} 
					else 
					{
						const username=req.body.username;
						const email=req.body.email;
						const password=req.body.password;
						
						const newUser = new User({
						username,
						email,
						password
						});

						newUser.emailVerifyToken=token,
						newUser.emailVerifyDate=Date.now()+3600000,
				
						bcrypt.genSalt(10, function(err, salt){
							bcrypt.hash(newUser.password, salt, function(err, hash)
							{
								if (err) 
									throw err;
								newUser.password = hash;
								newUser.save(function(err)
								{
									done(err,token,newUser);
								})
								
							});
						});
						
					}
				});
			},
			function(token,newUser,done){
				console.log("the email of the client is :",newUser.email);
				const smtpTransport = nodemailer.createTransport({
					host: 'smtp.gmail.com',
					port: 465,
					secure: true,
					auth: {
						type: 'OAuth2',
						user:'b.n.abhijith@gmail.com',
						clientId: '500226019228-jeuia4kl1ponqdg2qjlv98kc8fn9u4ks.apps.googleusercontent.com',
						clientSecret: 'wFu3RNZjbwMkRE4Euaq757Y4',
						refreshToken: '1/3klIQeDEJ2bWcBP6MbZk5haPSg66GqjYpPPvqzXFoOs',
						accessToken: 'ya29.GlsyB5BxfndYuKRSl-P1yqb24CcF-NxzSyaSCTIlrH02PNlvisgsVbVYh-oNgdBqEywessN8sTby45vJgoqXeKTU5nZUMi774CezSN1CSvySvL86XZRTEHHGG9sl'
					}
				});
				var mailOptions = {
					to: newUser.email,
					from: 'b.n.abhijith@gmail.com',
					subject: 'Your account verification',
					text: 'You are receiving this because you (or someone else) have registered.\n\n' +
						'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
						'http://' + req.headers.host + '/verify/' + token + '\n\n' +
						'If you did not request this, please ignore this email and your password will remain unchanged.\n'
				};
				smtpTransport.sendMail(mailOptions, function(err) {
					console.log('mail sent');
					req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
					done(err, 'done');
				});

				res.redirect('/');
			}
		],function(err){
			if(err)
				return next(err);
			res.redirect('/');
		});
	});

	router.get('/verify/:token',function(req,res){
		User.findOne({emailVerifyToken:req.params.token,emailVerifyDate:{$gt:Date.now()}},function(err,user){
			if(!user){
				console.log("Email verification token is invalid or has expired");
				return res.redirect('/');
			}
			console.log('Email verification token is valid')
			res.redirect('/');
			// console.log("User before updating",user);
			user.confirmed=true;
			user.emailVerifyToken=undefined;
			user.emailVerifyDate=undefined;
			user.save(function(err){
				console.log("Error in updating the confirmed user");
			});

			// console.log("User before updating:",user);
		})
	});

	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
		res.render("main.ejs",{user:req.user});
	});

	//facebook authetication
	router.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));
	router.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/home', failureRedirect: '/' }));

	//Google authentication
	router.get('/auth/google', passport.authenticate('google', {scope: ['profile','email']}));
	router.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/home', failureRedirect: '/' }));

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	//forgot password
	router.get('/forgot',function(req,res){
		res.render("forgot.ejs");
		//console.log("Success in loading forgot password page");
	})

	router.post('/forgot',function(req,res,next){
		async.waterfall([
			function(done){
				crypto.randomBytes(20,function(err,buf){
					var token=buf.toString('hex');
					done(err,token);
				});
			},
			function(token,done){
				User.findOne({email:req.body.email},function(err,user){
					if(!user){
						req.flash('error','No account with that email address exists.');
						return res.redirect('/forgot');
					}

					user.resetPasswordToken = token;
					user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
	
					user.save(function(err) {
						done(err, token, user);
					});
				});
			},
			function(token, user, done) 
			{
				const smtpTransport = nodemailer.createTransport({
					host: 'smtp.gmail.com',
					port: 465,
					secure: true,
					auth: {
						type: 'OAuth2',
						user:'b.n.abhijith@gmail.com',
						clientId: '500226019228-jeuia4kl1ponqdg2qjlv98kc8fn9u4ks.apps.googleusercontent.com',
						clientSecret: 'wFu3RNZjbwMkRE4Euaq757Y4',
						refreshToken: '1/3klIQeDEJ2bWcBP6MbZk5haPSg66GqjYpPPvqzXFoOs',
						accessToken: 'ya29.GlsyB5BxfndYuKRSl-P1yqb24CcF-NxzSyaSCTIlrH02PNlvisgsVbVYh-oNgdBqEywessN8sTby45vJgoqXeKTU5nZUMi774CezSN1CSvySvL86XZRTEHHGG9sl'
					}
				});
				var mailOptions = {
					to: user.email,
					from: 'b.n.abhijith@gmail.com',
					subject: 'Node.js Password Reset',
					text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
						'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
						'http://' + req.headers.host + '/reset/' + token + '\n\n' +
						'If you did not request this, please ignore this email and your password will remain unchanged.\n'
				};
				smtpTransport.sendMail(mailOptions, function(err) {
					console.log('mail sent');
					req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
					done(err, 'done');
				});
			}
		],function(err){
			if(err)
				return next(err);
			res.redirect('/forgot');
		});
	});

	router.get('/reset/:token', function(req, res) {
		User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
			if (!user) {
				req.flash('error', 'Password reset token is invalid or has expired.');
				return res.redirect('/forgot');
			}
			res.render("reset.ejs",{token: req.params.token});
		});
	});

	router.post('/reset/:token', function(req, res) {
		async.waterfall([
			function(done) {
				User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
					if (!user) {
						req.flash('error', 'Password reset token is invalid or has expired.');
						return res.redirect('back');
					}
					
					bcrypt.genSalt(10, function(err, salt) 
					{
						bcrypt.hash(req.body.password, salt, (err, hash) => {
							if (err) 
								throw err;
							user.password = hash;
							user.save().then(user => {
								req.flash(
								'success_msg',
								'You are now registered and can log in'
								);
								res.redirect('/');
							})
							.catch(err => console.log(err));
						});
					});

					user.resetPasswordToken = undefined;
					user.resetPasswordExpires = undefined;
	
					user.save(function(err) {
						req.logIn(user, function(err) {
							done(err, user);
						});
					});
				});
			},
			function(user, done) {
			const smtpTransport = nodemailer.createTransport({
				host: 'smtp.gmail.com',
				port: 465,
				secure: true,
				auth: {
					type: 'OAuth2',
					user:'b.n.abhijith@gmail.com',
					clientId: '500226019228-jeuia4kl1ponqdg2qjlv98kc8fn9u4ks.apps.googleusercontent.com',
					clientSecret: 'wFu3RNZjbwMkRE4Euaq757Y4',
					refreshToken: '1/3klIQeDEJ2bWcBP6MbZk5haPSg66GqjYpPPvqzXFoOs',
					accessToken: 'ya29.GlsyB5BxfndYuKRSl-P1yqb24CcF-NxzSyaSCTIlrH02PNlvisgsVbVYh-oNgdBqEywessN8sTby45vJgoqXeKTU5nZUMi774CezSN1CSvySvL86XZRTEHHGG9sl'
				}
			});
			var mailOptions = {
				to: user.email,
				from: 'b.n.abhijith@gmail.com',
				subject: 'Node.js Password Reset',
				text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
			};
			smtpTransport.sendMail(mailOptions, function(err) {
				console.log('mail sent');
        req.flash('success', 'Success! Your password has been changed.');
				done(err, 'done');
			});
			}
		], function(err) {
			res.redirect('/');
		});
	});
	



	return router;
}