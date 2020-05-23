var express = require("express");
var router = express.Router({ mergeParams: true });
var Machine = require("../models/machine");
var Sale = require("../models/sale");
var User = require("../models/user");
var multer = require("multer");
var pdfDocument = require('pdfkit');
var fs = require('fs');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
require('dotenv').config();

//transport to send email
var transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'confectionmachines@gmail.com',
        pass: process.env.GMAILPASS
    }
});

var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './uploads/');
    },
    filename: (req, file, callBack) => {
        callBack(null, file.originalname);
    }
});

var fileFilter = (req, file, callBack) => {
    //reject a file
    if (file.mimetype === 'image/jpg' || file.mimetype === 'application/pdf' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/svg') {
        callBack(null, true);
    } else {
        callBack(null, false);
    }
}
var upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

//===========
//SALES ROUTES
//===========

//INDEX ROUTE FOR THE SALES
router.get("/sales", isLoggedIn, (req, res) => {
    //get all sales from de DB
    Sale.find({}, (err, sales) => {
        if (err) {
            req.flash("error", "Something happened, please try again");
            res.redirect("/machines");
        } else {
            if (req.user.contract.charge == "Client") {
                req.flash("error", "You don´t have permission to do that");
                res.redirect("/machines");
            } else {
                //render all the sales in the template
                res.render("sales/index", { sales: sales });
            }
        }
    });
});

//open the pdf Report for sales
router.get('/sales/generatePdf', isLoggedIn, (req, res) => {
    res.set({ "Content-Type": 'application/pdf' });
    generatePDF(res);
});

//GENERATE PDF METHOD AS A PROMISE
function generatePDF(res) {
    //initialize a pdf document
    var doc = new pdfDocument();
    //save the pdf file in a root directory
    doc.pipe(fs.createWriteStream('./uploads/pdfs/report_sales.pdf'));
    //get all the machines from db in the last month
    var date = new Date(new Date() - 7 * 60 * 60 * 24 * 1000);
    //date.setMonth(date.getMonth() - 1);
    Sale.find({ date: { $gte: date } }, (err, sales) => {
        //setting a title for the pdf
        doc.text("Last Week Sales Report", { align: 'center' });
        //add the information of the sales
        sales.forEach(sale => {
            //add margins to the document
            doc.text("PRODUCT: " + sale.product.product_name);
            doc.text("BUYER: " + sale.buyer);
            doc.text("SELLER: " + sale.seller.seller_name);
            doc.text("PRICE: " + sale.price);
            doc.text("PURCHASE DATE: " + sale.date.toDateString());
            doc.moveDown();
            doc.addPage({ margin: 50 }).text("Last month Sales Report", { align: 'center' });
        });
        //Finalize PDF file
        doc.end();
        res.redirect('/uploads/pdfs/report_sales.pdf');
    });
};

//Send 
router.get("/sales/send-email", isLoggedIn, (req, res) => {
    User.find({ "contract.charge": "Administrator", "contract.workplace": req.user.contract.workplace }, (err, admin) => {
        if (err || admin.length == 0) {
            req.flash("error", "Your current workplace doesnt have any administrator");
            res.redirect("/sales");
        } else {
            admin.forEach((admin) => {
                var mailOptions = {
                    from: 'confectionmachines@gmail.com',
                    to: admin.email,
                    subject: 'Report of sales on the last week',
                    text: 'You have a new report of the sales made in the store on the last week',
                    attachments: [{
                        filename: 'report_sales.pdf',
                        path: 'C:/Users/alejandro.lv/Documents/college/ingenieria_web/final_work/final_work_web_heroku/uploads/pdfs/report_sales.pdf',
                        contentType: 'application/pdf'
                    }],
                };
                transport.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        req.flash("error", "Something happend with your email, please try again");
                    } else {
                        req.flash("success", "message sent " + info.response);
                    }
                });
            });
            req.flash("success", "message sent to your administrator");
            res.redirect("/sales");
        }
    });
})

//SHOW THE FORM TO GENERATE A NEW SALE
router.get("/machines/:id/sale", isLoggedIn, (req, res) => {
    //find the machine with provided ID
    Machine.findById(req.params.id, (err, foundMachine) => {
        if (err) {
            req.flash("error", "Something happend, please try again");
            res.redirect("/machines");
        } else {
            //render the show template
            res.render("sales/new", { machine: foundMachine });
        }
    });
});

//CREATE ROUTE OR THE INVENTORY--ADD NEW MACHINE
router.post("/machines/:id/sale", isLoggedIn, (req, res) => {
    var product_id = req.params.id;
    var product_name = req.body.product_name;
    var buyer = req.body.buyer;
    var seller_id = req.user._id;
    var seller_name = req.user.name;
    var price = req.body.price;
    var date = req.body.sale_date;
    var newSale = { product: { id: product_id, product_name: product_name }, buyer: buyer, seller: { id: seller_id, seller_name: seller_name }, price: price, date: date };
    // Create a new machine and save to DB
    Sale.create(newSale, (err, sale) => {
        if (err) {
            console.log(err);
        } else {
            //redirect back to machines page
            res.redirect("/sales");
        }
    });
});

//middleware
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
}

module.exports = router;