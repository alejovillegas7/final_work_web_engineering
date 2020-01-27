var express = require("express");
var router = express.Router({mergeParams: true});
var Machine = require("../models/machine");
var Sale = require("../models/sale");
var User = require("../models/user");
var multer = require("multer");
var pdfDocument = require('pdfkit');
var fs = require('fs');
var mongoose = require('mongoose');

var storage = multer.diskStorage({
    destination: (req, file, callBack)=>{
        callBack(null, './uploads/');
    },
    filename: (req, file, callBack)=>{
        callBack(null, file.originalname);
    }
});

var fileFilter = (req, file, callBack)=>{
    //reject a file
    if(file.mimetype === 'image/jpg' || file.mimetype === 'application/pdf' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/svg'){
        callBack(null, true);
    }else{
        callBack(null, false);
    }
}
var upload = multer({
    storage:storage,
    fileFilter: fileFilter
    });

//===========
//SALES ROUTES
//===========

//INDEX ROUTE FOR THE SALES
router.get("/sales", isLoggedIn, (req, res)=>{
    //get all sales from de DB
    Sale.find({}, (err, sales)=>{
        if(err){
            console.log(err);
        }else{
            //render all the sales in the template
            res.render("sales/index", {sales:sales})
        }
    });
});

//SHOW THE FORM TO GENERATE A NEW SALE
router.get("/machines/:id/sale", isLoggedIn, (req, res)=>{
    //find the machine with provided ID
    Machine.findById(req.params.id, (err, foundMachine)=>{
        if(err){
            console.log(err);
        }
        else{
            //render the show template
            res.render("sales/new", {machine:foundMachine});
        }
    });
});

//CREATE ROUTE OR THE INVENTORY--ADD NEW MACHINE
router.post("/machines/:id/sale", isLoggedIn, (req, res)=>{
    var product_id = req.params.id;
    var product_name = req.body.product_name;
    var buyer = req.body.buyer;
    var seller_id = req.user._id;
    var seller_name = req.user.name;
    var price = req.body.price;
    var date = req.body.sale_date;
    var newSale = {product:{id:product_id, product_name:product_name}, buyer:buyer, seller:{id:seller_id, seller_name:seller_name}, price:price, date:date};
    // Create a new machine and save to DB
    Sale.create(newSale, (err, sale)=>{
        if(err){
            console.log(err);
        }else{
            //redirect back to machines page
            res.redirect("/sales");
        }
    });
});

//middleware
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/sales");
}

module.exports = router;