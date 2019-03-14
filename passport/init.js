var login= require('./login');
var User=require('../models/user');//access the databse content

module.exports=function(passport){


    //serialization and de-serialization of users
    passport.serializeUser(function(user, done) {
        //console.log('serializing user: ');console.log(user);
        done(null, user._id);
    });
  
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            //console.log('Deserializing user: ',user);
            done(err, user);
        });
    });

    //passport strategies for passport
    login(passport);

}