module.exports = {
	//'url' : 'mongodb://<dbuser>:<dbpassword>@novus.modulusmongo.net:27017/<dbName>'
	'url' : 'mongodb+srv://abhijithbn:Abhi123@internship-gaqds.mongodb.net/test?retryWrites=true'
}


//local mongo database
// 'mongodb://localhost/loginform'

//using mongdb atlas to store the data in the loginform
// 'mongodb+srv://abhijithbn:Abhi123@internship-gaqds.mongodb.net/test?retryWrites=true'



// var mongoose=require('mongoose');
// module.exports = mongoose.model('User',{
//     username:String,
//     password:String,
//     email:String,
// })

/*
var mongoose=require('mongoose');
var userSchema=mongoose.Schema({
    username:String,
    password:String,
    email:String
});
mongoose.exports=mongoose.model('User',userSchema)*/
