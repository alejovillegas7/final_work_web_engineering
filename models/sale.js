var mongoose = require("mongoose");

var saleSchema = mongoose.Schema({
    product: String,
    buyer: String,
    seller: String,
    price: Number,
    date: Date
});

module.exports = mongoose.model("Sale", saleSchema);