var mongoose=require('mongoose');
module.exports = mongoose.model('users',{
    username:{type: String, unique: true, required: true},
    password:String,
    firstName: String,
    lastName: String,
    email:{type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    facebook:{
        id:String,
        token:String,
        email:String,
        name:String
    },
    google:{
        id:String,
        token:String,
        email:String,
        name:String
    }
})
