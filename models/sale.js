var mongoose = require("mongoose");

var saleSchema = mongoose.Schema({
    product: {
        id: String,
        product_name: String
    },
    buyer: String,
    seller: {
        id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
        seller_name: String
        },
    price: Number,
    date: Date
});

module.exports = mongoose.model("Sale", saleSchema);