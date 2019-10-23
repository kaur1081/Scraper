// require our dependencies
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var logger = require("morgan");

// to initialize express app
var express = require("express");
var app = express();


// installing logger for developing area
app.use(logger("dev"));
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);
// require public route
app.use(express.static(process.cwd() + "/public"));

var exphbs =require("express-handlebars");
app.engine("handlebars",exphbs({defaultLayout: "main"}));
app.set("view engine","handlebars");

mongoose.connect("mongodb://localhost/newsScrapper");
var db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function(){
    console.log("connected to Mongoose!");
});


var port = process.env.Port || 3000;
app.listen(port,function(){
    console.log("listening on PORT " + port);
});