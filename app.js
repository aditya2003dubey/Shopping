if(process.env.NODE_ENV != "production"){
require("dotenv").config()
}

const express =  require("express");
const engine =  require("ejs-mate");
const mongoose = require("mongoose");
const path = require("path");
const { fileURLToPath } = require('url');
const methodOverride = require("method-override");
// import category from "./models/category";
const Category = require("./models/category");
const Product = require("./models/product");
const User = require("./models/user");
const Review = require("./models/review");
const Order = require("./models/order");
const Cart = require("./models/cart");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const multer = require("multer");
const {storage} = require("./cloudConfig");
const upload = multer({ storage });

const app = express();
app.engine('ejs', engine);

app.set("view engine","ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));

const sessionOptions = {
secret: "mysecretcode",
resave: false,
saveUninitialized: true,
cookie: {
    expires: Date.now() + 1000 * 60 * 60 * 24 * 3,
    maxAge: 1000*60*60*24*3,
    httpOnly: true
},
};

app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.currUser = req.user;
    // console.log(req.user);
    next();
})

app.get("/",async (req,res)=>{
    let allCategory =await Category.find({});
    res.render("home.ejs",{allCategory});
});

app.get("/signup",(req,res)=>{
    res.render("user/signup.ejs");
});

app.post("/signup",async (req,res,next)=>{
    const {username,email,password} = req.body;
    const user = new User({username,email});
    const registeredUser = await User.register(user,password);
    console.log(registeredUser);
    req.login(registeredUser,(err)=>{
        if(err){
             return next(err);
        }
        res.redirect("/");
    })
   
})

app.get("/login",(req,res)=>{
    res.render("user/login.ejs");
});

app.post("/login",
passport.authenticate("local",{
    failureRedirect:"/login",
    // failureFlash: true,
}),
async (req,res)=>{
    res.redirect("/");
})

app.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
            }
            res.redirect("/")
   });
});

app.get("/profile",(req,res)=>{
    res.render("user/profile.ejs");
});

app.get("/profile/profile_edit",(req,res)=>{
    res.render("user/profile_edit.ejs");
});

app.post("/profile/profile_edit/:id",async (req,res)=>{
    const id = req.params.id;
    const {username,email,phone_no,address} = req.body;
    const user = await User.findByIdAndUpdate(id,{username,email,phone_no,address},{new:true});
    // let user = await User.findByIdAndUpdate(id,{...req.body.listing});
    await user.save();
    res.redirect("/profile");
})

app.get("/add_category",async (req,res)=>{
    res.render("admin/add_category.ejs");
});

app.post("/add_category",upload.single("image"),async (req,res)=>{
    let url = req.file.path;
    let filename = req.file.filename;
    const {type,description} = req.body;
    const category = new Category({type,description});
    category.image = {url,filename};
    category.save()
    .then((category)=>{
        res.redirect("/");
        })
        // console.log(req.body)
})

app.get("/add_product/:id",(req,res)=>{
    let id = req.params.id;
    res.render("admin/add_product.ejs",{id});
});

app.post("/add_product/:id",upload.single("image"),async (req,res)=>{
    let id = req.params.id;
    let url = req.file.path;
    let filename = req.file.filename;
    const {price,size,color,description,name} = req.body;
    const product = new Product({price,size,color,description,name});
    product.category = id;
    product.image = {url,filename};
    product.save()
    .then((product)=>{
        res.redirect(`/category/${id}`);
        })
        console.log(req.body)
});

app.get("/contact",(req,res)=>{
    res.render("contact.ejs");
});

app.get("/about",(req,res)=>{
    res.render("about.ejs");
});

app.get("/category/:id",async (req,res)=>{
    let category_id = req.params.id;
    let allProduct =await Product.find({});
    const products_array = [];
    for(product of allProduct){
        let product_id = product.category;
        if(category_id == product_id){
            products_array.push(product);
        }
    }
    res.render("category.ejs",{products_array,category_id});
});

app.delete("/category/:id",async (req,res) =>{
    let id = req.params.id;
    await Category.findByIdAndDelete(id);
    res.redirect("/");
})

app.get("/product/:id",async (req,res)=>{
    let id = req.params.id;
    let countCart =await Cart.countDocuments();
   await Product.findById(id)
    .then((product)=>{
        res.render("product.ejs",{product,countCart});
        })
});

app.delete("/product/:id",async (req,res) =>{
    let id = req.params.id;
    await Product.findByIdAndDelete(id);
    res.redirect("/category");
})

app.get("/product/:id/review",(req,res)=>{
    let id = req.params.id;
    res.render("review.ejs",{id});
})

app.post("/product/:id/review",(req,res)=>{
    let id = req.params.id;
    let {name,email,review} = req.body;
    let reviewData = new Review({name,email,review});
    reviewData.save();
    res.redirect(`/product/${id}`);
})

//cart api
app.get("/cart",async (req,res)=>{
    let allCart =await Cart.find({});
    res.render("cart.ejs",{allCart});
});

app.post("/cart/:id",async (req,res)=>{
    let product_id = req.params.id;
    // let {quantity} = req.body;
    let product = await Product.findById(product_id);
    // let cart = await Cart.findOne({user:req.session.user._id});
    // if(cart){
    // }
    let name = product.name;
    let price = product.price;
    let url = product.image.url;
    let filename = product.image.filename;
    let cartData = new Cart({name,price,product_id});
    cartData.image = {url,filename};
    cartData.save();
    res.redirect(`/product/${product_id}`);
});

app.delete("/cart/:id",(req,res)=>{
    let id = req.params.id;
    Cart.findByIdAndDelete(id).then((cart)=>{
        res.redirect("/cart");
        })
})

main()
.then(() =>{
    console.log("connection succesfull")
})
.catch((err)=>console.log(err));

async function main(){
    await mongoose.connect("mongodb+srv://adityadubeypc:IJWj8RNCjasI0Kk3@cluster0.nyucr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
};

app.listen(8080);