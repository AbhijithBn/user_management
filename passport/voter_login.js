var LocalStrategy=require('passport-local').Strategy;//handling strategies

var User=require('../models/user');//access the databse content
var bCrypt = require('bcryptjs');//password authentications


module.exports=function(passport){
   
   
    passport.use('login', new LocalStrategy(//where login is name of local strategy being used in this example
    function( username, password, done) 
    { 
        User.findOne({ 'voterid' :  voterid }||{'email':email}, 
        function(err, user) {
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
            // User and password both match, return user from 
            // done method which will be treated like success
            return done(null, user);
          }
        );
    }));

    var isValidPassword = function(user, password){
        console.log(password,user.password);
        return bCrypt.compareSync(password, user.password);
    }
}