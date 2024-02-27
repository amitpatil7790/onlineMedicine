const mongoose = require("mongoose");

const medSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    image:{
       type:String,
       required:true
    },
    companyName:{
        type:String,
        required:true
    }
})

module.exports = mongoose.model("medicine", medSchema);