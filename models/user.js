const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String
    },
    email:{
        type:String,
        required: true
    },
    phone:{
        type:Number,
        required: true
    },
    password:{
        type:String,
        required:true
    },
    dob:{
        type:Date,
        required:true
    },
    userType:{
        type:String,
        required:true
    }
})

module.exports = mongoose.model("users", userSchema);