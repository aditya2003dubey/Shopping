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
        },
        color: {
            type: String,
        },
        quantity:{
            type: Number,
            required: true,
        },
        size:{
            type: String,
        },
        owner:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
});

const Cart = mongoose.model("Cart",cartSchema);
module.exports  = Cart;