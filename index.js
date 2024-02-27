const express = require("express");
const mongoose = require("mongoose");
const multer = require('multer');
const cors = require("cors");
const path = require('path');
const userModel = require("./models/user");
const medModel = require("./models/med");
const cartModel = require("./models/cart");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const url = "mongodb://127.0.0.1:27017/MedApp";
mongoose.connect(url);

app.post("/register",async (req,res) => {
    const user  = await userModel.findOne({email:req.body.email});
    if(!user){ 
        userModel.create(req.body)
        .then(users => res.json({data:users,status:200, message:"success"}))
        .catch(err => res.json({message:err}))
    }else{
        res.json({message:"User Already Exist"})
    }
})

app.post("/login", (req,res) => {
    const {email, password} = req.body;
    userModel.findOne({email:email})
    .then(user => {
        if(user){
            if(user.password === password){
                res.json({data:user, status:200, message:"success"});
            }else{
                res.json({message:"Password is incorrect"})
            }
        }else{
            res.json({message:"No record found", status:404})
        }
    })
})

const storage = multer.diskStorage({    
    destination:(req, file, cb)=>{
        cb(null,'public/images')
    },
    filename:(req, file, cb) => {
        cb(null, file.fieldname + "_"+Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({storage:storage})

app.post('/uploadMedicine', upload.single('file'), (req, res) => {
    const medicine = {
        name:req.body.name,
        price:req.body.price,
        stock:req.body.stock,
        image:req.file.filename,
        companyName:req.body.companyName
    }
    medModel.create(medicine)
    .then(result => res.json({data:result, status:200, message:"success"}))
    .catch(err =>  res.json({message:err}))
})

app.get('/medicines', async(req,res) => {
    const medicines = await medModel.find({});
    if(medicines && medicines.length > 0){
        res.json({data:medicines, status:200, message:"success"})
    }else{
        res.json({message:"No Data Found",status:404})
    }
})

app.post('/addToCart', async (req,res) => {
    const userCart = await cartModel.findOne({userId:req.body.userId});
    if(userCart){
        const index = userCart.cart.findIndex(({_id}) => _id === req.body.productId);
        if(index > -1){
            const medProd = medModel.findOne({_id:req.body.productId});
            if(parseInt(userCart.cart[index].quantity) + parseInt(req.body.quantity) < parseInt(medProd.stock)){
                cartModel.updateOne({userId:req.body.userId, "cart._id":userCart.cart[index]},
                    {
                        "$set":{
                            "cartTotal":parseFloat(userCart.cartTotal) + (parseFloat(userCart.cart[index].price) * parseInt(req.body.quantity)),
                            "cart.$.quantity" : parseInt(userCart.cart[index].quantity) + parseInt(req.body.quantity),
                            "cart.$.totalPrice" : parseFloat(userCart.cart[index].price) * (parseInt(userCart.cart[index].quantity) + parseInt(req.body.quantity))
                        }
                }).then(updated => {
                    res.json({message:"Product Added to Cart Successfully", status:200})
                }).catch(err => res.json({message:"Something went wrong!"}))
            }else{
                res.json({message:"This product has limited stock"})
            }
        }else{
            medModel.findOne({_id:req.body.productId}).then(product => {
                console.log(product,123)
                if(product && parseInt(product.stock) >  parseInt(req.body.quantity)){
                    const productObj = {
                        _id:req.body.productId,
                        name:product.name,
                        image:product.image,
                        quantity:parseInt(req.body.quantity),
                        price:parseFloat(product.price),
                        totalPrice:parseFloat(product.price)*parseInt(req.body.quantity)
                    }

                    cartModel.updateOne({userId:req.body.userId},
                        {
                            "$set":{
                                "cartTotal":productObj.totalPrice+parseFloat(userCart.cartTotal)
                            },
                            "$push":{cart:productObj}
                        }
                    )
                    .then(updated => {
                        console.log(updated);
                        res.json({message:"Product Added to Cart Successfully", status:200})
                    }).catch(err => {console.log(err); res.json({message:"Something went wrong!"})})
                }else{
                    res.json({message:"This product has limited stock"})
                }
            }).catch(err => res.json({message:"Something went wrong!"}));
        }
    }else{
        medModel.findOne({_id:req.body.productId}).then(product => {
            if(product && parseInt(product.stock) > parseInt(req.body.quantity)){
                cartModel.create({
                    userId:req.body.userId,
                    cartTotal:parseFloat(product.price)*parseInt(req.body.quantity),
                    cart:[
                        {
                            _id:req.body.productId,
                            name:product.name,
                            image:product.image,
                            quantity:parseInt(req.body.quantity),
                            price:parseFloat(product.price),
                            totalPrice:parseFloat(product.price)*parseInt(req.body.quantity)
                        }
                    ]
                }).then(added =>{
                    console.log(added);
                    res.json({message:"Product Added to Cart Successfully", status:200})
                }).catch(err => res.json({messgae:"Something went wrong!"}))
            }else{
                res.json({message:"This product has limited stock"})
            }
        }).catch(err => console.log(err))
    }
})

app.post('/getCart', (req,res) => {
    cartModel.findOne({userId:req.body.userId}).then(data => {
        if(data && data.cart.length > 0){
            res.json({data:data,status:200,message:"success"})
        }else{
            res.json({message:"No Products found", status:200})
        }
    }).catch(err => res.json({message:err}))
})

app.post('/updateCartQty',async (req,res) => {
    const userCart = await cartModel.findOne({userId:req.body.userId});
    if(userCart){
        const medProd = await medModel.findOne({_id:req.body.productId});
        const index = userCart.cart.findIndex(({_id}) => _id === req.body.productId);
        if(parseInt(userCart.cart[index].quantity) + parseInt(req.body.quantity) < parseInt(medProd.stock)){
            cartModel.updateOne({userId:req.body.userId, "cart._id":userCart.cart[index]},
            {
                "$set":{
                    "cartTotal":parseFloat(userCart.cartTotal) + (parseFloat(userCart.cart[index].price) * parseInt(req.body.quantity)),
                    "cart.$.quantity" : parseInt(userCart.cart[index].quantity) + parseInt(req.body.quantity),
                    "cart.$.totalPrice" : parseFloat(userCart.cart[index].price) * (parseInt(userCart.cart[index].quantity) + parseInt(req.body.quantity))
                }
            }).then(updated => {
                res.json({message:"Product Quantity Updated", status:200})
            }).catch(err => res.json({message:"Something went wrong!"}))
        }else{
            res.json({message:"This product has limited stock"})
        }
    }else{
        res.json({message:"Something went wrong!"})
    }
})

app.post('/removeCartItem',async (req,res) => {
    const userCart = await cartModel.findOne({userId:req.body.userId});
    if(userCart){
        const index = userCart.cart.findIndex(({_id}) => _id === req.body.productId);
        if(index >-1 ){
            cartModel.updateOne({userId:req.body.userId},
                {
                    $pull: {cart:{_id:req.body.productId}}
                }
            )
            .then(removed => {
            res.json({message:"Product has been removed", status:200});
            }).catch(err => {
                res.json({message:"Something went wrong!"})
            })
        }else{
            res.json({message:"Product is not in the cart"})
        }
    }else{
        res.json({message:"Something went wrong!"})
    }
})

app.listen(3001,()=>{
    console.log("Server is connected");
})