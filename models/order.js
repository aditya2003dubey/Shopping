const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema([{
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: Number,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    total: {
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
    quantity: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now(),
    },
    status: {
        type: String,
        default: "pending",
    },
    payment_mode: {
        type: String,
        default: "Cash On Delivery",
    },
    tracking_id: {
        type: String,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        },
}]);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;