var express = require("express");
var router = express.Router({mergeParams: true});
var Machine = require("../models/machine");
var Sale = require("../models/sale");
var User = require("../models/user");

//===========
//USER ROUTES
//===========

//INDEX ROUTE FOR THE USERS
router.get("/users", (req, res)=>{
    //get all users from de DB
    User.find({}, (err, users)=>{
        if(err){
            console.log(err);
        }else{
            //render all the users in the template
            res.render("users/index", {users:users});
        }
    });
});

//SHOW THE USER'S PROFILE
router.get("/users/:id", isLoggedIn, (req, res)=>{
    //find the user with provided ID
    User.findById(req.params.id, (err, foundUser)=>{
        if(err){
            console.log(err);
        }
        else{
            if(req.user._id.toString() === req.params.id){
              //render the show template
                return res.render("users/profile", {user:foundUser});  
            }
            //render the show template
            res.redirect("/machines");
        }
    });
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}


module.exports = router;