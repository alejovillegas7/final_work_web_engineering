var mongoose = require("mongoose");

var machineSchema = new mongoose.Schema({
    brand: String,
    model: String,
    location: String,
    purchase_price: Number,
    purchase_receipt: String,
    creation_date: {type: Date, default: Date.now()},
    sale_date: {type: Date, default: Date.now()},
    seller: String,
    quantity: Number,
    image: String,
    state: String
});


module.exports = mongoose.model("Machine", machineSchema);