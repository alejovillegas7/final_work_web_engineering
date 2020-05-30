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

//===========
//USER ROUTES
//===========

//INDEX ROUTE FOR THE USERS
router.get("/users", isLoggedIn, (req, res) => {
    //get all users from de DB
    User.find({}, (err, users) => {
        if (err) {
            console.log(err);
        } else {
            //render all the users in the template
            res.render("users/index", { users: users });
        }
    });
});

//SHOW THE USER'S PROFILE
router.get("/users/:id", isLoggedIn, (req, res) => {
    //find the user with provided ID
    User.findById(req.params.id, (err, foundUser) => {
        if (err) {
            req.flash("error", "Something happened, please try again");
            res.redirect("/machines");
        } else {
            return res.render("users/profile", { user: foundUser });
        }
    });
});

//EDIT USER ROUTE
router.get("/users/:id/edit", isLoggedIn, (req, res) => {
    //is user logged in
    if (req.isAuthenticated()) {
        User.findById(req.params.id, (err, foundUser) => {
            if (err) {
                req.flash("error", "Something happened, please try again");
                res.redirect("/machines");
            } else {
                //does user own profile?
                if (foundUser._id.equals(req.user._id) || req.user.contract.charge == "SYSTEMADMIN") {
                    res.render("users/edit", { user: foundUser });
                } else {
                    req.flash("error", "You dont have permission to do that!!");
                    res.redirect("/users");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("/login");
    }
    //otherwise redirect
    //if not redirect to login page 
});

//UPDATE USER ROUTE
router.put("/users/:id", upload.single('user_image'), (req, res) => {
    req.body.form = req.sanitize(req.body.form);
    //find and update the correct user
    if (req.file == undefined) {
        req.flash("error", "Please fill all the fields ");
        return res.redirect("back");
    }
    var newUser = {
        username: req.body.form.username,
        name: req.body.form.name,
        age: req.body.form.age,
        email: req.body.form.email,
        contract: {
            charge: req.body.form.charge,
            salary: req.body.form.salary,
            start_date: req.body.form.start_date,
            due_date: req.body.form.due_date,
            workplace: req.body.form.workplace
        },
        user_image: req.file.path
    };
    User.findByIdAndUpdate(req.params.id, newUser, (err, userUpdated) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/machines");
        } else {
            //redirect to the user´s profile
            req.flash("success", userUpdated.name + " profile successfully updated");
            res.redirect("/users/" + req.params.id);
        }
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
}


module.exports = router;