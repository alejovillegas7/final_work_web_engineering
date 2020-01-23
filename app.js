var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var TwitterStrategy = require("passport-twitter");
var FacebookStrategy = require("passport-facebook");
var multer = require("multer");
var pdfDocument = require('pdfkit');
var fs = require('fs');

var Machine = require("./models/machine");
var Sale = require("./models/sale");
var User = require("./models/user");
//var Config = require("./config");
var machineRoutes = require("./routes/machines");
var authRoutes = require("./routes/auth");

mongoose.connect("mongodb://localhost/confection_machines_store", { useUnifiedTopology: true, useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use('/uploads',express.static('uploads'));

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "we are the best group in the class",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next)=>{
    res.locals.currentUser = req.user;
    next();
});

app.use(machineRoutes);
app.use(authRoutes);

app.listen(3002, ()=>{
    console.log("confection machines server runnin at port 3002");
});