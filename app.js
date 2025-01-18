import express from "express";

const app = express();

app.set("view engine","ejs");
app.use(express.static("public"));

app.get("/",(req,res)=>{
    res.render("home.ejs");
});

app.get("/contact",(req,res)=>{
    res.render("contact.ejs");
});

app.get("/about",(req,res)=>{
    res.render("about.ejs");
});

app.get("/category",(req,res)=>{
    res.render("category.ejs");
});

app.get("/product",(req,res)=>{
    res.render("product.ejs");
});

app.get("/cart",(req,res)=>{
    res.render("cart.ejs");
});

app.listen(8080);