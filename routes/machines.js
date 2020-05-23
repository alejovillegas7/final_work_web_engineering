var express = require("express");
var router = express.Router({ mergeParams: true });
var Machine = require("../models/machine");
var Sale = require("../models/sale");
var User = require("../models/user");
var multer = require("multer");
var pdfDocument = require('pdfkit');
var fs = require('fs');
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
//INVENTORY ROUTES
//===========

//INDEX ROUTE FOR THE INVENTORY
router.get("/machines", (req, res) => {
    //get all machines from de DB
    Machine.find({}, (err, machines) => {
        if (err) {
            console.log(err);
        } else {
            //render all the machines in the template
            res.render("inventory/index", { machines: machines })
        }
    });
});

//CREATE ROUTE OR THE INVENTORY--ADD NEW MACHINE
router.post("/machines", isLoggedIn, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'purchase_receipt', maxCount: 1 }]), (req, res) => {
    if (req.file == undefined) {
        req.flash("error", "Please fill all the fields");
        return res.redirect("back");
    }
    //get data from form and add to machines array
    var today = new Date();
    var brand = req.body.brand;
    var state = req.body.state;
    var model = req.body.model;
    var location = req.body.location;
    var purchase_price = req.body.purchase_price;
    var purchase_receipt = req.files.purchase_receipt[0].path;
    var image = req.files.image[0].path;
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var creation_date = new Date(date);
    creation_date.setDate(creation_date.getDate());
    var sale_date = req.body.sale_date;
    var seller = req.body.seller;
    var quantity = req.body.quantity;
    var newMachine = { state: state, brand: brand, quantity: quantity, image: image, model: model, location: location, purchase_price: purchase_price, creation_date: creation_date, sale_date: sale_date, seller: seller, purchase_receipt: purchase_receipt };
    // Create a new machine and save to DB
    Machine.create(newMachine, (err, machine) => {
        if (err) {
            console.log(err);
        } else {
            //redirect back to machines page
            res.redirect("/machines");
        }
    });
});

//open the pdf Report
router.get('/machines/generatePdf', isLoggedIn, (req, res) => {
    if (req.user.contract.charge == "Client") {
        res.send("you dont have permissions to do that!");
    } else {
        res.set({ "Content-Type": 'application/pdf' });
        generatePDF(res);
    }
});

//NEW-- SHOW FORM TO CREATE A NEW MACHINE
router.get("/machines/new", isLoggedIn, (req, res) => {
    if (req.user.contract.charge == "Client") {
        res.send("you dont have permissions to do that!");
    } else {
        res.render("inventory/new", { user: req.user });
    }
});

//SEND EMAIL TO ADMON
router.get("/machines/send-email", isLoggedIn, (req, res) => {
    User.find({ "contract.charge": "Administrator", "contract.workplace": req.user.contract.workplace }, (err, admin) => {
        if (err || admin.length == 0) {
            console.log("your current workplace doesnt have any administrator");
            res.redirect("/machines");
        } else {
            admin.forEach((admin) => {
                var mailOptions = {
                    from: 'confectionmachines@gmail.com',
                    to: admin.email,
                    subject: 'Report of machines',
                    text: 'You have a new report of the machines in the store',
                    attachments: [{
                        filename: 'report.pdf',
                        path: 'C:/Users/alejandro.lv/Documents/college/ingenieria_web/final_work/final_work_web_heroku/uploads/pdfs/report.pdf',
                        contentType: 'application/pdf'
                    }],
                };
                transport.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.log("something happend with your email: " + err);
                    } else {
                        console.log("message sent " + info.response);
                    }
                });
            });
            req.flash("success", "message sent to your administrator");
            res.redirect("/machines");
        }
    });
});

//SWOW-- SHOWS MORE INFO ABOUT A MACHINE
router.get("/machines/:id", isLoggedIn, (req, res) => {
    //find the machine with provided ID
    Machine.findById(req.params.id, (err, foundMachine) => {
        if (err) {
            console.log(err);
        } else {
            //render the show template
            res.render("inventory/show_machine", { machine: foundMachine });
        }
    });
});

//EDIT MAHCINE ROUTE
router.get("/machines/:id/edit", isLoggedIn, (req, res) => {
    Machine.findById(req.params.id, (err, foundMachine) => {
        if (err) {
            return res.redirect("/machines");
        } else {
            if (req.user.name === foundMachine.seller || req.user.contract.charge == "Client") {
                return res.render("inventory/edit", { machine: foundMachine });
            } else {
                req.flash("error", "You don't have any permission over this Machine!");
                res.redirect("/machines");
            }
        }
    });
});

//UPDATE MACHINE INFO ROUTE
router.put("/machines/:id", isLoggedIn, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'purchase_receipt', maxCount: 1 }]), (req, res) => {
    if (req.file == undefined) {
        req.flash("error", "Please fill all the fields");
        return res.redirect("back");
    }
    //find and update the correct machine
    var today = new Date();
    var brand = req.body.brand;
    var state = req.body.state;
    var model = req.body.model;
    var location = req.body.location;
    var purchase_price = req.body.purchase_price;
    var purchase_receipt = req.files.purchase_receipt[0].path;
    var image = req.files.image[0].path;
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var creation_date = new Date(date);
    creation_date.setDate(creation_date.getDate());
    var sale_date = req.body.sale_date;
    var seller = req.body.seller;
    var quantity = req.body.quantity;
    var editedMachine = { state: state, brand: brand, quantity: quantity, image: image, model: model, location: location, purchase_price: purchase_price, creation_date: creation_date, sale_date: sale_date, seller: seller, purchase_receipt: purchase_receipt };
    Machine.findByIdAndUpdate(req.params.id, editedMachine, (err, updatedMachine) => {
        if (err) {
            req.flash("error", "Something happened, please try again");
            return res.redirect("/machines");
        }
        //redirect somewhere
        res.redirect("/machines/" + req.params.id);
    })
});

//GENERATE PDF METHOD AS A PROMISE
function generatePDF(res) {
    //initialize a pdf document
    var doc = new pdfDocument();
    //save the pdf file in a root directory
    doc.pipe(fs.createWriteStream('./uploads/pdfs/report.pdf'));
    //get all the machines from db in the last month
    var date = new Date();
    date.setMonth(date.getMonth() - 1);
    Machine.find({ creation_date: { $gte: date } }, (err, machines) => {
        //setting a title for the pdf
        doc.text("Last month inventory Report", { align: 'center' });
        //add the information of the machines
        machines.forEach(machine => {
            //add margins to the document
            doc.image(machine.image, {
                fit: [500, 200],
                align: 'center'
            });
            doc.text("BRAND: " + machine.brand);
            doc.text("MODEL: " + machine.model);
            doc.text("STORE: " + machine.location);
            doc.text("PURCHASE PRICE: " + machine.purchase_price);
            doc.text("CREATION DATE: " + machine.creation_date.toDateString());
            doc.text("SELLER: " + machine.seller);
            doc.text("QUANTITY: " + machine.quantity);
            doc.text("STATE: " + machine.state);
            doc.fillColor('blue').text("PURCHASE RECEIPT", { link: '/' + machine.purchase_receipt, underline: true, continued: false });
            doc.moveDown();
            doc.addPage({ margin: 50 }).text("Last month inventory Report", { align: 'center' });
        });
        //Finalize PDF file
        doc.end();
        res.redirect('/uploads/pdfs/report.pdf');
    });
};

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
}

module.exports = router;