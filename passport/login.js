var LocalStrategy=require('passport-local').Strategy;//handling strategies
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy=require('passport-facebook').Strategy;

var User=require('../models/user');//access the databse content
var bCrypt = require('bcryptjs');//password authentications

var configAuth=require('./config');// config file which contains the clientID and client Secret


module.exports=function(passport){
   
   
    passport.use('login', new LocalStrategy(//where login is name of local strategy being used in this example
    function( username, password, done) 
    {   
        //login using email or username
        var criteria = (username.indexOf('@') === -1) ? {username: username} : {email: username};
        User.findOne(criteria, function(err, user) {
            // In case of any error, return using the done method      
            if (err)
              return done(err);
            // Username does not exist, log error & redirect back
            if (!user){
                console.log('User Not Found with username '+username);
                return done(null, false);                 
            }
            // User exists but wrong password, log the error 
            if (!isValidPassword(user, password)){
                console.log('Invalid Password');
                return done(null, false);
            }
            if(user.confirmed!=true){
                console.log('The user hasnt verified their account');
                return done(null,false);
            }
            // User and password both match, return user from 
            // done method which will be treated like success
            return done(null, user);
          }
        );
    }));

    var isValidPassword = function(user, password)
    {
        console.log(password,user.password);
        return bCrypt.compareSync(password, user.password);
    }



    // passport.use('facebook',new FacebookStrategy({
    //     clientID: configAuth.facebookAuth.clientID,
    //     clientSecret: configAuth.facebookAuth.clientSecret,
    //     callbackURL: configAuth.facebookAuth.callbackURL
    // },
    // function(accessToken, refreshToken, profile, cb)
    // {
    //     User.findOne({ 'facebook.id': profile.id }, function (err, user) {
    //         if(err)
    //             return console.log(err);
    //         if(user)
    //             return console.log(null,user);
    //         else{
    //             var newUser=new User();
    //             newUser.facebook.id=profile.id;
    //             newUser.facebook.token=accessToken;
    //             newUser.facebook.name=profile.name.givenName+' '+profile.name.familyName;
    //             // newUser.facebook.email=profile.email[0].value;
    //             newUser.save(function(err){
    //                 if(err)
    //                     throw err;
    //                 return console.log(null,newUser); 
    //             })

    //         }
    //     });
    // }
    // ));


    passport.use(new GoogleStrategy({
	    clientID: configAuth.googleAuth.clientID,
	    clientSecret: configAuth.googleAuth.clientSecret,
	    callbackURL: configAuth.googleAuth.callbackURL
	  },
	  function(accessToken, refreshToken, profile, done) {
	    		User.findOne({'google.id': profile.id}, function(err, user){
	    			if(err)
	    				return done(err);
	    			if(user)
	    				return done(null, user);//here err is null
	    			else {
	    				var newUser = new User();
	    				newUser.google.id = profile.id;
	    				newUser.google.token = accessToken;
	    				newUser.google.name = profile.displayName;
                        newUser.google.email = profile.emails[0].value;
                        newUser.email=profile.emails[0].value;
                        newUser.username=profile.emails[0].value;

	    				newUser.save(function(err){
	    					if(err)
	    						throw err;
	    					return done(null, newUser);
	    				})
	    				console.log(profile);
	    			}
	    		});
	    }
    ));
    

    

}

