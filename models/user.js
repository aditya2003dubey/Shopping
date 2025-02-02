const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    profile_photo: {
        url: String,
        filename: String,
    },
    full_name: {
        type: String,
    },
    email: {
        type: String,
        required: true
    },
    user_name: {
        type: String,
        required: true
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