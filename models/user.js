const mongoose = require("mongoose")
const {schema} = mongoose

const userSchema = new mongoose.Schema({
    firstName:{
        type: String,
        minLength : 3,
        required : true,
        maxLenght : 28
    },

    lastName:{
        type: String,
         minLength : 3,
        maxLenght : 28,
    },
    emailId:{
        type: String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true,
        uppercase : true,
        immutable: true
    },

    age:{
        type: Number,
       
        min : 10,
        max : 80,
    },

    role:{
        type: String,
        enum: ['user' , 'admin'],
        default : 'user',
       
    },

    problemSolved:{
        type : [{
            type: mongoose.Schema.ObjectId,
            ref : 'Problem',
           
        }], 
         unique: true ,
         default: []

    },
    password:{
        type: String,
        required: true
    }
}, {timestamps:true})

const User =  mongoose.model("User",userSchema);
module.exports = User