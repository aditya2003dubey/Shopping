const mongoose = require("mongoose")

const cartSchema = new mongoose.Schema({
    image: {
        url: String,
        filename: String,
    },
    name: {
        type: String,
        required: true
        },
    price: {
        type: String,
        required: true
        },
        product_id:{
            type: String,
        }
});

const Cart = mongoose.model("Cart",cartSchema);
module.exports  = Cart;