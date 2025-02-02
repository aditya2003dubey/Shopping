const mongoose = require("mongoose");
const { Schema } = mongoose;
const querySchema = new Schema({
    name: String,
    email: String,
    phone: Number,
    message: String,
    date: {
        type: Date,
        default: Date.now(),
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    });
    const Query = mongoose.model("Query", querySchema);
    module.exports = Query;