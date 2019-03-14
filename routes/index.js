var express=require('express');
var router=express.Router();
var User=require('../models/user');//access the databse content
router.use(express.static('public'));// for the use of html files
var bcrypt = require('bcryptjs');//password authentications

var bodyParser=require('body-parser');


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
        res.sendfile(__dirname+'/'+"login.html",{ message: req.flash('Login form') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash : true  
	}));


	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.sendfile(__dirname+'/'+"register.html",{ message: req.flash('Registration form') });
	});

	
	router.post('/signup', function(req, res)
	{
		const { username, email, password, password2 } = req.body;
		console.log("username= ",username,"email= ",email,"password= ",password,"2ndpassword= ",password2)
	  
		if (!username || !email || !password || !password2) {
		  console.log( 'Please enter all fields' );
		}
		if (password != password2) {
		  console.log(  'Passwords do not match' );
		}
	
		if (password.length < 6) {
		  console.log(  'Password must be at least 6 characters' );
		}
	   
		else 
		{
		  User.findOne({ email: email }).then(user => {
			if (user) {
			  console.log( 'Email already exists' );
			  res.sendFile(__dirname+'/'+'login.html');
			} 
			else 
			{
			  const newUser = new User({
				username,
				email,
				password
			  });
	  
			  bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(newUser.password, salt, (err, hash) => {
					if (err) 
						throw err;
				  newUser.password = hash;
				  newUser.save().then(user => {
					  req.flash(
						'success_msg',
						'You are now registered and can log in'
					  );
					  res.redirect('/');
					})
					.catch(err => console.log(err));
				});
			  });
			}
		  });
		}
		});
	
	  

	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
		res.sendfile(__dirname+'/'+"main.html",{ message: req.flash('Content Page') });
	});


	router.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));

	router.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/home', failureRedirect: '/' }));



	router.get('/auth/google', passport.authenticate('google', {scope: ['profile','email']}));

	router.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/home', failureRedirect: '/' }));

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});



	//forgot password
	router.get('/forgot',function(req,res){
		res.sendFile(__dirname+'/'+"forgot.html");
		//console.log("Success in loading forgot password page");
	})

	router.post('/forgot',function(req,res,next){
		async.waterfall([// this waterfall function executes one function after another continuously
			function(done) //generates 20bit random string in hexadecimal 
			{
				crypto.randomBytes(20, function(err, buf) {
					var token = buf.toString('hex');
					done(err, token);
				});
			},

			function(token, done) //checking if the email entered is existent in the database or not
			{
				User.findOne({ email: req.body.email }, function(err, user) {
					console.log("email is ",req.body.email);
					if (!user) // no user with that email address
					{
						console.log('error', 'No account with that email address exists.');
						return res.redirect('/forgot');
					}

	
					user.resetPasswordToken = token;//20bit token
					user.resetPasswordExpires = Date.now() + 3600000; //  expires in 1 hour
	
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
						clientSecret: '9mekItXlYZakgcOYf2sH-wj3',
						refreshToken: '1/aEThnTrtQ92nGU3sP8Y-cvRgpaECi2lyd0r9BgLn6r8',
						accessToken: 'ya29.Glu_BtnBFuVzwpbpyMSzNJ5xOzYJwad1S1PcHU7wEz6fk3RvEY4f-Mgv1wZYGDkBES4Ex7CZxEyNXs-AADQ_eCsEjJ8luyyrwnxnTnNr7QFuEKStM-JyjKSgF_Ts'
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
		], function(err) {
			if (err) return next(err);
			res.redirect('/forgot');
		});

	})

	// router.get('/reset/:token', function(req, res) {
	// 	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
	// 		if (!user) {
	// 			req.flash('error', 'Password reset token is invalid or has expired.');
	// 			return res.redirect('/forgot');
	// 		}
	// 		res.sendFile(__dirname+'/'+"reset.html", {token: req.params.token});
	// 	});
	// });

	// router.post('/reset/:token', function(req, res) {
	// 	async.waterfall([
	// 		function(done) {
	// 			User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
	// 				if (!user) {
	// 					req.flash('error', 'Password reset token is invalid or has expired.');
	// 					return res.redirect('back');
	// 				}
	// 				if(req.body.password === req.body.confirm) {
	// 					user.setPassword(req.body.password, function(err) {
	// 						user.resetPasswordToken = undefined;
	// 						user.resetPasswordExpires = undefined;
	
	// 						user.save(function(err) {
	// 							req.logIn(user, function(err) {
	// 								done(err, user);
	// 							});
	// 						});
	// 					})
	// 				} else {
	// 						req.flash("error", "Passwords do not match.");
	// 						return res.redirect('back');
	// 				}
	// 			});
	// 		},
	// 		function(user, done) {
	// 			var smtpTransport = nodemailer.createTransport({
	// 				service: 'Gmail', 
	// 				auth: {
	// 					type: 'OAuth2',
	// 					user:'b.n.abhijith@gmail.com',
	// 					clientId: '500226019228-jeuia4kl1ponqdg2qjlv98kc8fn9u4ks.apps.googleusercontent.com',
	// 					clientSecret: '9mekItXlYZakgcOYf2sH-wj3',
	// 					refreshToken: '1/aEThnTrtQ92nGU3sP8Y-cvRgpaECi2lyd0r9BgLn6r8',
	// 					accessToken: 'ya29.Glu_BtnBFuVzwpbpyMSzNJ5xOzYJwad1S1PcHU7wEz6fk3RvEY4f-Mgv1wZYGDkBES4Ex7CZxEyNXs-AADQ_eCsEjJ8luyyrwnxnTnNr7QFuEKStM-JyjKSgF_Ts'
	// 				}
	// 			});
	// 			var mailOptions = {
	// 				to: user.email,
	// 				from: 'b.n.abhijith@mail.com',
	// 				subject: 'Your password has been changed',
	// 				text: 'Hello,\n\n' +
	// 					'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
	// 			};
	// 			smtpTransport.sendMail(mailOptions, function(err) {
	// 				req.flash('success', 'Success! Your password has been changed.');
	// 				done(err);
	// 			});
	// 		}
	// 	], function(err) {
	// 		res.redirect('/');
	// 	});
	// });
	



	return router;
}