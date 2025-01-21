const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    image: {
        url: String,
        filename: String,
    },
    email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        // required: true
        },
    phone_no: {
        type: Number,
        },
    address: {
        type: String,
    }
});
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",userSchema);