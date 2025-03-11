const mongoose = require("mongoose");
const { Schema } = mongoose;
const reviewSchema = new Schema({
    name: String,
    email: String,
    review: String,
    rating: Number,
    date: {
        type: Date,
        default: Date.now(),
    },
    product:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    });
    const Review = mongoose.model("Review", reviewSchema);
    module.exports = Review;