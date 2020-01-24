var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    contract: {charge: String, salary: Number, start_date: Date, due_date: Date, workplace: String},
    user_image: String,
    password: String,
    provider: String,
    provider_id: {type: String, default:null},
    sales: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Sale"
        }
    ]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);