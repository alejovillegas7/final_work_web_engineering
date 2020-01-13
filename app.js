var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

var machines = [
    {brand: "marca", image: "https://5.imimg.com/data5/KJ/BP/MY-48534858/merritt-popular-sewing-machine-500x500.jpg", model: "modelo", location: "punto de venta central", price: "5000", date: "05/08/1995", sale_date: "05/08/1995", seller: "Alejandro"},
    {brand: "marca2", image: "https://5.imimg.com/data5/KJ/BP/MY-48534858/merritt-popular-sewing-machine-500x500.jpg", model: "modelo", location: "punto de venta central", price: "5000", date: "05/08/1995", sale_date: "05/08/1995", seller: "Alejandro"},
    {brand: "marca3", image: "https://5.imimg.com/data5/KJ/BP/MY-48534858/merritt-popular-sewing-machine-500x500.jpg", model: "modelo", location: "punto de venta central", price: "5000", date: "05/08/1995", sale_date: "05/08/1995", seller: "Alejandro"}
];

app.get("/", (req, res)=>{
    res.render("landing");
});

app.get("/machines", (req, res)=>{
    res.render("machines", {machines:machines})
});

app.post("/machines", (req, res)=>{
    //get data from form and add to machines array
    var brand = req.body.brand;
    var image = req.body.image;
    var model = req.body.model;
    var location = req.body.location;
    var price = req.body.price;
    var date = req.body.date;
    var newMachine = {brand:brand, image:image, model:model, location:location, price:price, date:date};
    machines.push(newMachine);
    //redirect back to machines page
    res.redirect("/machines");
});

app.get("/machines/new", (req, res)=>{
    res.render("new");
});

app.listen(3002, ()=>{
    console.log("confection machines server runnin at port 3002");
})