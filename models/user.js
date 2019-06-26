var mongoose=require('mongoose');
module.exports = mongoose.model('users',{
    username:{type: String, unique: true, required: true},
    password:String,
    firstName: String,
    lastName: String,
    email:{type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    emailVerifyToken:String,
    emailVerifyDate:Date,
    confirmed: { type: Boolean, default: false },
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
