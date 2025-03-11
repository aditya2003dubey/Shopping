if(process.env.NODE_ENV != "production"){
require("dotenv").config()
}

const express =  require("express");
const engine =  require("ejs-mate");
const mongoose = require("mongoose");
const path = require("path");
const { fileURLToPath } = require('url');
const methodOverride = require("method-override");
const Category = require("./models/category");
const Product = require("./models/product");
const User = require("./models/user");
const Query = require("./models/query");
const Review = require("./models/review");

const Order = require("./models/order");
const Cart = require("./models/cart");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const multer = require("multer");
const {storage} = require("./cloudConfig");
const upload = multer({ storage });
const flash = require("connect-flash");
const MongoStore = require("connect-mongo");

const wrapAsync = require("./utils/WrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");

const {isLoggedIn} = require("./middleware.js");
const {saveRedirecturl} = require("./middleware.js");
const user = require("./models/user");

const app = express();
app.engine('ejs', engine);

app.set("view engine","ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));

const dburl = process.env.MONGODBURL;

const store = MongoStore.create({
    mongoUrl: dburl,
    crypto: {
      secret: process.env.SECRET,
    },
    touchAfter: 24*3600,
  });
  
  store.on("error",() =>{
    console.log("ERROR in MONGO SESSION STORE",err);
  });


const sessionOptions = {
secret: process.env.SECRET,
resave: false,
saveUninitialized: true,
cookie: {
    expires: Date.now() + 1000 * 60 * 60 * 24 * 3,
    maxAge: 1000*60*60*24*3,
    httpOnly: true
},
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

// app.use("*",(req,res,next)=>{
//     res.render("error_page.ejs");
//     next();
// })
main()
.then(() =>{
    console.log("connection succesfull")
})
.catch((err)=>console.log(err));

async function main(){
    await mongoose.connect(dburl);
};

app.get("/",async (req,res)=>{
    let countCart =await Cart.countDocuments();
    let allCategory =await Category.find({});
    res.render("home.ejs",{allCategory,countCart});
});

app.get("/signup",(req,res)=>{
    res.render("user/signup.ejs");
});

app.post("/signup",async (req,res,next)=>{
    try{
    const {username,email,password} = req.body;
    const user = new User({username,email});
    const registeredUser = await User.register(user,password);
    console.log(registeredUser);
    req.login(registeredUser,(err)=>{
        if(err){
             return next(err);
        }
        req.flash("success","Welcome to Our Website");
        res.redirect("/");
    })
}
catch(err){
    req.flash("error",err.message);
    res.redirect("/signup")
   } 
})

app.get("/login",(req,res)=>{
    res.render("user/login.ejs");
});

app.post("/login",saveRedirecturl,
passport.authenticate("local",{
    failureRedirect:"/login",
    failureFlash: true
}),
async (req,res)=>{
    req.flash("success","Welcome to Our Website");
    let redirectUrl = res.locals.redirectUrl || "/";
    res.redirect(redirectUrl);
})

app.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
            }
            req.flash("success","you are succesfully log out");
            res.redirect("/")
   });
});

app.get("/profile",isLoggedIn,(req,res)=>{
    res.render("user/profile.ejs");
});

app.get("/admin/:id/all_order_detail",async (req,res)=>{
    let user_id = req.params.id;
    let allOrder =await Order.find({}).populate("user");
    res.render("admin/all_order_detail.ejs",{allOrder});
})

app.get("/admin/:uid/all_order_detail/order_detail/:id",async (req,res)=>{
    let user_id = req.params.uid;
    let order_id = req.params.id;
    let order = await Order.findById(order_id).populate("product");
    res.render("admin/order_detail.ejs",{order});
});

app.get("/admin/:uid/update_order/:id",async (req,res)=>{
    let user_id = req.params.uid;
    let order_id = req.params.id;
    let order = await Order.findById(order_id);
    res.render("./admin/update_order.ejs",{order})
});

app.post("/admin/:uid/update_order/:id",async (req,res)=>{
    let user_id = req.params.uid;
    let order_id = req.params.id;
    let {status,tracking_id} = req.body;
    let order = await Order.findByIdAndUpdate(order_id,{status,tracking_id},{new:true});
    await order.save;
    res.redirect(`/admin/${user_id}/all_order_detail/order_detail/${order_id}`);
});

app.post("/admin/:uid/cancel_order/:id",async (req,res)=>{
    let user_id = req.params.uid;
    let order_id = req.params.id;
    let status = "cancelled";
    let order = await Order.findByIdAndUpdate(order_id,{status},{new:true});
    await order.save;
    res.redirect(`/admin/${user_id}/all_order_detail/order_detail/${order_id}`)
})

app.get("/profile/profile_edit",(req,res)=>{
    res.render("user/profile_edit.ejs");
});

app.post("/profile/profile_edit/:id",upload.single("profile_photo"),async (req,res)=>{
    const id = req.params.id;
    let url = req.file.path;
    let filename = req.file.filename;
    const {full_name,user_name,email,phone_no,address} = req.body;
    const user = await User.findByIdAndUpdate(id,{full_name,user_name,email,phone_no,address},{new:true});
    // let user = await User.findByIdAndUpdate(id,{...req.body.listing});
    user.profile_photo = {url,filename};
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
        req.flash("success","New Category Created");
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
        req.flash("success","New Product Created");
        res.redirect(`/category/${id}`);
        })
});

app.get("/contact",(req,res)=>{
    res.render("contact.ejs");
});

app.get("/all_query",async(req,res)=>{
    let query = await Query.find({});
    res.render("./admin/all_query.ejs",{query});
})

app.post("/query",isLoggedIn ,async(req,res) =>{
    let id = req.user._id;
    let {name,email,phone,message} = req.body;
    const query = new Query({name,email,phone,message});
    query.user = id;
    await query.save()
    res.redirect("/");
})

app.get("/about",(req,res)=>{
    res.render("about.ejs");
});

app.get("/category/:id",async (req,res)=>{
    let category_id = req.params.id;
    let category = await Category.findById(category_id);
    if(!category){
        req.flash("error", "Category you requested for does not exist");
        res.redirect("/");
      }
    let allProduct =await Product.find({});
    const products_array = [];
    for(product of allProduct){
        let product_id = product.category;
        if(category_id == product_id){
            products_array.push(product);
        }
    }
    res.render("category.ejs",{products_array,category_id,category});
});

app.delete("/category/:id",async (req,res) =>{
    let id = req.params.id;
    await Category.findByIdAndDelete(id);
    req.flash("success","Category Deleted");
    res.redirect("/");
})

app.get("/product/:id",async (req,res)=>{
    let id = req.params.id;
    let allreview = await Review.find({});
    const reviews_array = [];
    for(review of allreview){
        // let product_id = product.category;
        if(id == review.product){
            reviews_array.push(review);
        }
    }
   await Product.findById(id)
    .then((product)=>{
        if(!product){
            req.flash("error", "Product you requested for does not exist");
            res.redirect(`/product/${id}`);
          }
        res.render("product.ejs",{product,reviews_array});
        })
});

app.delete("/product/:id",async (req,res) =>{
    let id = req.params.id;
    await Product.findByIdAndDelete(id);
    req.flash("success","Product Deleted");
    res.redirect("/category");
})

app.get("/product/:id/review",(req,res)=>{
    let id = req.params.id;
    res.render("review.ejs",{id});
})

app.post("/product/:id/review",isLoggedIn,(req,res)=>{
    let id = req.params.id;
    let {name,email,review,rating} = req.body;
    let reviewData = new Review({name,email,review,rating});
    console.log(rating);
    reviewData.product = id;
    reviewData.save();
    req.flash("success","Review Created");
    res.redirect(`/product/${id}`);
})

//review api



//cart api
app.get("/cart",isLoggedIn,async (req,res)=>{
    let allcart =await Cart.find({});
    let carts_array = [];
    for(cart of allcart){
        if(req.user._id.equals(cart.owner)){
            carts_array.push(cart);
        }
    }
    res.render("cart.ejs",{carts_array});
});

app.get("/cart/:id",async (req,res)=>{
    let id = req.params.id;
    let product = await Product.findById(id);
    res.render("addCart.ejs",{product})
});

app.post("/cart/:id",isLoggedIn,async (req,res)=>{
    let product_id = req.params.id;
    let {color,size,quantity} = req.body;
    let product = await Product.findById(product_id);
    // let cart = await Cart.findOne({user:req.session.user._id});
    // if(cart){
    // }

    let name = product.name;
    let price = product.price;
    let url = product.image.url;
    let filename = product.image.filename;
    let cartData = new Cart({name,price,product_id,color,size,quantity});
    cartData.owner = req.user._id;
    cartData.image = {url,filename};
    cartData.save();
    req.flash("success","Cart Added..");
    res.redirect(`/product/${product_id}`);
});

app.delete("/cart/:id",(req,res)=>{
    let id = req.params.id;
    Cart.findByIdAndDelete(id).then((cart)=>{
        req.flash("success","Cart Deleted");
        res.redirect("/cart");
        })
})

//footer
app.get("/legal_policies/privacy_policy",(req,res)=>{
    res.render("Legal_Policies/privacy_policy.ejs");
})
app.get("/legal_policies/terms_of_use",(req,res)=>{
    res.render("Legal_Policies/terms_of_use.ejs");
})

app.get("/legal_policies/returns_policy",(req,res)=>{
    res.render("Legal_Policies/returns_policy.ejs");
    })

app.get("/legal_policies/shipping_policy",(req,res)=>{
        res.render("Legal_Policies/shipping_policy.ejs");
        })    
// buying api

app.get("/product/cart/buy_all",isLoggedIn,async (req,res)=>{
    // let id = req.params.id;
    // let cart = await Cart.find({});
    res.render("./order/create_multiorder.ejs");
});

// app.post("/product/cart/buy_all",isLoggedIn, async(req,res)=>{
//     let {name,email,phone,address} = req.body;
//     let cart = await Cart.find({owner:req.user._id});
//     var sumOfAll = 0;
//     var orders = [];
//     for(product of cart){
//         let total = 0;
//     let color = product.color;
//     let size = product.size;
//     let product_id = product.product_id;
//     let price = product.price;
//     let quantity = product.quantity;
//     total = total + price * quantity;

//     sumOfAll = total + sumOfAll;
//     let order = new Order({name,email,phone,address,color,size,quantity,total,product_id
//         });
//         order.product = product_id;
//         order.user = req.user._id;
//       await  order.save();
      
//       orders.push(order);
//     }
//         res.render("./order/multi_checkout.ejs",{orders,sumOfAll});
// });

app.post("/product/cart/buy_all", isLoggedIn, async (req, res) => {
    try {
        let { name, email, phone, address } = req.body;
        let cart = await Cart.find({ owner: req.user._id });

        if (!cart.length) {
            return res.status(400).send("Cart is empty");
        }

        let sumOfAll = 0;
        let orders = cart.map(product => {
            let total = product.price * product.quantity;
            sumOfAll += total;

            return {
                name,
                email,
                phone,
                address,
                color: product.color,
                size: product.size,
                quantity: product.quantity,
                total,
                product_id: product.product_id,
                product: product.product_id,
                user: req.user._id
            };
        });

        // Insert multiple orders at once
        var savedOrders = await Order.insertMany(orders);
        
        res.render("./order/multi_checkout.ejs", { orders: savedOrders, sumOfAll });
        console.log(orders);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/product/buy_all/online/:id",isLoggedIn,async(req,res)=>{
    let order = req.params.id;
    let orders = await Cart.find({});
    var total = 0
    for(ordero of orders){
        total = total + ordero.price * ordero.quantity;
        // total = total + ordero.total
    }
    console.log(total);
    res.render("./order/payment.ejs",{order,total});
})

app.delete("/product/buy_all/:id",async (req,res)=>{
    let order_id = req.params.id;
    let order = await Order.find({});
    for(product_item of order){
        let product_id = product_item.product;
        let product_order_id = product_item._id;
        let cart = await Cart.find({});
        for(cart_product of cart){
            if(cart_product.product_id == product_id && cart_product.user == req.user._id){
                await Cart.deleteOne({product_id: product_id, user: req.user._id});
                console.log("Product deleted from cart");
                }
            // if(cart_product.product_id.equals(product_id)){
            //     await Order.findByIdAndDelete(product_order_id);
            //     await Cart.findByIdAndDelete(cart_product._id);
            //     res.json({message:"product deleted"});
        }}
                
            

    // let order = await Order.findByIdAndDelete(order_id);
    // req.flash("success","Order Deleted");
    res.redirect("/");
})


    app.get("/product/:id/buy",isLoggedIn,async (req,res)=>{
        let id = req.params.id;
        let product = await Product.findById(id);
        res.render("./order/create_order.ejs",{product});
    });

    app.post("/product/:id/buy/:uid",isLoggedIn, async(req,res)=>{
        let product_id = req.params.id;
        let user_id = req.params.uid;
        let {name,email,phone,address,color,size,quantity} = req.body;
        let product = await Product.findById(product_id);
        let price = product.price;
        let total = price * quantity;
        let order = new Order({name,email,phone,address,color,size,quantity,total,product_id
            });
            order.product = product_id;
            order.user = user_id;
          await  order.save();
            res.render("./order/checkout",{order});
    })

        app.get("/product/buy/:id",isLoggedIn,async (req,res)=>{
            let order_id = req.params.id;
            console.log(req.body);
            let order = await Order.findById(order_id); 
            res.render("./order/order_confirmation.ejs",{order});
        })

        app.get("/product/buy/online/:id",isLoggedIn,async(req,res)=>{
            let order_id = req.params.id;
            let order = await Order.findById(order_id);
            let total = order.total;
            res.render("./order/payment.ejs",{order,total});
        })

        app.post("/product/buy/online/:id",isLoggedIn,async(req,res)=>{
            let order_id = req.params.id;
            let order = await Order.findById(order_id);
            let {payment_method} = req.body;
            res.render("./order/order_confirmation.ejs",{order});
        })

        app.delete("/product/buy/:id",async (req,res)=>{
            let order_id = req.params.id;
            let order = await Order.findByIdAndDelete(order_id);
            // req.flash("success","Order Deleted");
            res.redirect("/");
        })



    app.all("*",(req,res,next) =>{
        next(new ExpressError(404,"Page Not Found!"))
      })
      
      app.use((err,req,res,next)=>{
        let {statusCode = 500, message = "something went wrong"} = err;
        res.status(statusCode).render("error.ejs",{message});
      })



app.listen(8080);