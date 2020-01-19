var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var multer = require("multer");
var pdfDocument = require('pdfkit');
var fs = require('fs');

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


mongoose.connect("mongodb://localhost/confection_machines_store", { useUnifiedTopology: true, useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use('/uploads',express.static('uploads'));

//SCHEMAS SETUP

var machineSchema = new mongoose.Schema({
    brand: String,
    model: String,
    location: String,
    purchase_price: Number,
    purchase_receipt: String,
    creation_date: {type: Date, default: Date.now()},
    sale_date: {type: Date, default: Date.now()},
    seller: String,
    quantity: Number,
    image: String,
    state: String
});


var Machine = mongoose.model("Machine", machineSchema);

app.get("/", (req, res)=>{
    res.render("landing");
});

//---------------------INVENTORY--------------------------------------

//INDEX ROUTE FOR THE INVENTORY
app.get("/machines", (req, res)=>{
    //get all machines from de DB
    Machine.find({}, (err, machines)=>{
        if(err){
            console.log(err);
        }else{
            //render all the machines in the template
            res.render("index", {machines:machines})
        }
    });
});

//CREATE ROUTE OR THE INVENTORY--ADD NEW MACHINE
app.post("/machines", upload.fields([{name: 'image', maxCount: 1},{name: 'purchase_receipt', maxCount: 1}]),(req, res)=>{
    //get data from form and add to machines array
    var today = new Date();
    var brand = req.body.brand;
    var state = req.body.state;
    var model = req.body.model;
    var location = req.body.location;
    var purchase_price = req.body.purchase_price;
    var purchase_receipt = req.files.purchase_receipt[0].path;
    var image = req.files.image[0].path;
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var creation_date = new Date(date);
    creation_date.setDate(creation_date.getDate());
    var sale_date = req.body.sale_date;
    var seller = req.body.seller;
    var quantity = req.body.quantity;
    var newMachine = {state:state, brand:brand, quantity:quantity, image: image, model:model, location:location, purchase_price:purchase_price, creation_date:creation_date, sale_date: sale_date, seller:seller, purchase_receipt:purchase_receipt};
    // Create a new machine and save to DB
    Machine.create(newMachine, (err, machine)=>{
        if(err){
            console.log(err);
        }else{
            //redirect back to machines page
            res.redirect("/machines");
        }
    });
});

//GENERATE PDF METHOD AS A PROMISE
function generatePDF(){
//initialize a pdf document
    var doc = new pdfDocument();
    //save the pdf file in a root directory
    doc.pipe(fs.createWriteStream('./uploads/pdfs/report.pdf'));
    //get all the machines from db in the last month
    var date = new Date();
    date.setMonth(date.getMonth() - 1);
    Machine.find({creation_date: {$gte:date}},(err, machines)=>{
        //setting a title for the pdf
        doc.text("Last month inventory Report", {align: 'center'});
        //add the information of the machines
        machines.forEach(machine => {
            //add margins to the document
            doc.image(machine.image, {
                fit: [500, 200],
                align: 'center'
            });
            doc.text("BRAND: "+machine.brand);
            doc.text("MODEL: "+machine.model);
            doc.text("STORE: "+machine.location);
            doc.text("PURCHASE PRICE: "+machine.purchase_price);
            doc.text("CREATION DATE: "+machine.creation_date.getDate()+"/"+machine.creation_date.getMonth()+1+"/"+machine.creation_date.getFullYear());
            doc.text("SELLER: "+machine.seller);
            doc.text("QUANTITY: "+machine.quantity);
            doc.text("STATE: "+machine.state);
            doc.fillColor('blue').text("PURCHASE RECEIPT",{link: '/'+machine.purchase_receipt, underline: true, continued: true});
            doc.addPage({margin: 50}).text("Last month inventory Report", {align: 'center'});
        });
        //Finalize PDF file
        doc.end();
    });
};

//open the pdf Report
app.get('/machines/generatePdf', (req, res)=>{
    generatePDF();
    res.redirect('/uploads/pdfs/report.pdf');
});

//NEW-- SHOW FORM TO CREATE A NEW MACHINE
app.get("/machines/new", (req, res)=>{
    res.render("new");
});

//SWOW-- SHOWS MORE INFO ABOUT A MACHINE
app.get("/machines/:id", (req, res)=>{
    //find the machine with provided ID
    Machine.findById(req.params.id, (err, foundMachine)=>{
        if(err){
            console.log(err);
        }
        else{
            //render the show template
            res.render("show_machine", {machine:foundMachine});
        }
    });
});

app.listen(3002, ()=>{
    console.log("confection machines server runnin at port 3002");
});