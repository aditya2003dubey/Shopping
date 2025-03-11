const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
    image: {
        url: String,
        filename: String,
    },
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true
        },
    size: {
            type: String,
            required: true
            },
     color: {
         type: String,
         required: true
                },
    description: {
        type: String,
        required: true
        },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",  
    },
        reviews: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Review",
            }]
});

const Product = mongoose.model("Product",productSchema);
module.exports  = Product;