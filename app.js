var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var flash = require('connect-flash');
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");
const dotenv = require('dotenv');
dotenv.config();
var expressSanitizer = require('express-sanitizer');
//var TwitterStrategy = require("passport-twitter");
//var FacebookStrategy = require("passport-facebook");
var multer = require("multer");
var pdfDocument = require('pdfkit');
var fs = require('fs');

var Machine = require("./models/machine");
var Sale = require("./models/sale");
var User = require("./models/user");
//var Config = require("./config");
var machineRoutes = require("./routes/machines");
var authRoutes = require("./routes/auth");
var userRoutes = require("./routes/user");
var salesRoutes = require("./routes/sales");


//MONGODB CONNECTIONS - LOCAL AND MONGO ATLAS FOR DEPLOY

//mongoose.connect(process.env.DATABASEURL, { useFindAndModify: false, useUnifiedTopology: true, useNewUrlParser: true }).then(() => console.log("connected to localDB"));
mongoose.connect("mongodb+srv://alejovillegas7:alejo5983812@machinestorecluster-cvmcp.mongodb.net/test?retryWrites=true&w=majority", { useFindAndModify: false, useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true }).then(() => {
    console.log("connected to DB!");
}).catch(err => {
    console.log("ERROR ", err.message);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSanitizer());
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use('/uploads', express.static('uploads'));
app.use(methodOverride("_method"));
app.use(flash());

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

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(machineRoutes);
app.use(authRoutes);
app.use(userRoutes);
app.use(salesRoutes);

//process.env.PORT
app.listen(3002, "0.0.0.0", () => {
    console.log("confection machines server runnin at port 3002");
});