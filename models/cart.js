const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    _id:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    quantity:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    totalPrice:{
        type:Number,
        required:true
    }
})

const cartSchema = mongoose.Schema({
    userId:{
        type:String,
        required: true
    },
    cartTotal:{
        type:Number,
        required:true
    },
    cart:[productSchema]
})

module.exports = mongoose.model("cart",cartSchema);