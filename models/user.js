var mongoose = require("mongoose");

var userSchema = mongoose.Schema({
    name: String,
    secondName: String,
    age: Number,
    contract: {charge: String, salary: Number, start_date: Date, due_date: Date},
    user_image: String,
    sales: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Sale"
        }
    ]
});

module.exports = mongoose.model("Sale", saleSchema);