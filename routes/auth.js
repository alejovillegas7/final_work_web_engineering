var express = require("express");
var router = express.Router({ mergeParams: true });
var Machine = require("../models/machine");
var Sale = require("../models/sale");
var User = require("../models/user");
var passport = require("passport");
var multer = require("multer");
var pdfDocument = require('pdfkit');
var fs = require('fs');

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

router.get("/", (req, res) => {
    res.render("landing");
});

//===========
//AUTH ROUTES
//===========

//show the register form
router.get("/register", isLoggedIn, (req, res) => {
    if (req.user.contract.charge == "SYSTEMADMIN" || req.user.contract.charge == "Administrator") {
        res.render("register");
    } else {
        req.flash("error", "You don't have permission to do that, please contact your administrator");
        res.redirect("/machines")
    }
});

//handle sign up logic!
router.post("/register", upload.single('user_image'), (req, res) => {
    if (req.file == undefined) {
        req.flash("error", "Please fill all the fields");
        return res.redirect("back");
    }
    var newUser = new User({
        username: req.body.username,
        name: req.body.name,
        age: req.body.age,
        email: req.body.email,
        contract: {
            charge: req.body.charge,
            salary: req.body.salary,
            start_date: req.body.start_date,
            due_date: req.body.due_date,
            workplace: req.body.workplace
        },
        user_image: req.file.path
    });
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            return res.render("register");
        }
        req.flash("success", "New user created");
        res.redirect("/machines");
    });
});

//show login form
router.get("/login", (req, res) => {
    res.render("login");
});

//handling login logic
router.post("/login", passport.authenticate("local", { successRedirect: "/machines", failureRedirect: "/login", failureFlash: "Username or password incorrect", successFlash: "Welcome" }), (req, res) => {
    req.flash("success", "Welcome " + req.user.username);
    res.redirect("/machines");
    res.send("login logic happens here!");
});

//logout route
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "logged you out!");
    res.redirect("/machines");
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
}

module.exports = router;