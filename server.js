var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

// req Note and Article models
var models = require("./models");
// Scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

//Establish port and initiate express
var port = process.env.PORT || 3000
var app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));

app.use(bodyParser.urlencoded({
  extended: false
}));

// Make the public folder a static directory
app.use(express.static("public"));

// Set up handlebars view
var expHandlebars = require("express-handlebars");

app.engine("handlebars", expHandlebars({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

// -----------------------------------------------Mongoose/MongoDB Connection----------------------------------------------------

// Database configuration with mongoose
// mongoose.connect("mongodb://localhost/mongoHeadlines", { useNewUrlParser: true });

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
console.log('Mongo URI', MONGODB_URI)
mongoose.connect(MONGODB_URI,{ useNewUrlParser: true });
var db = mongoose.connection;
// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

// --------------------------------------------------------Routes----------------------------------------------------------------

//GET requests to render Handlebars pages
app.get("/", function(req, res) {
  models.Article.find({"saved": false}, function(error, data) {
    var hsbObject = {
      article: data
    };
    console.log(hsbObject);
    res.render("home", hsbObject);
  });
});

app.get("/saved", function(req, res) {
  models.Article.find({"saved": true}).populate("notes").exec(function(error, articles) {
    var hsbObject = {
      article: articles
    };
    res.render("saved", hsbObject);
  });
});

// A GET request to scrape the greenmedinfo website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("http://www.espn.com/espn/latestnews").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    // Now, we grab each selector within the views-row tag, and do the following:
    var holder = [];
    $(".inline-list").each(function(i, element) {
        
        // Save an empty result object
        var result = {};
        
        // Add the title and summary of every link, and save them as properties of the result object
        result.title = $(this).children('li').children("a").attr('title');
        result.summary = $(this).children('li').children("a").text();
        var link = $(this).children("li").children("a").attr("href");           
        result.link = "http://www.espn.com" + link;
        
        // Using our Article model, create a new entry
        // This effectively passes the result object to the entry (and the title and link)
        holder.push(result);
        // Create a new Article using the `result` object built from scraping

    });
    console.log(holder)
       models.Article.create(holder);
      res.redirect("/");
  });
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  models.Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the document to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, find the matching query in our db...
  models.Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our function
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the document to the browser as a json object
    else {
      res.json(doc);
    }
  });
});


// Save an article
app.post("/articles/save/:id", function(req, res) {
      // Use the article id to find and update its saved boolean
      models.Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true})
      // Execute the above query
      .exec(function(error, doc) {
        // Log any errors
        if (error) {
          console.log(error);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
});

// Delete an article
app.post("/articles/delete/:id", function(req, res) {
      // Use the article id to find and update its saved boolean
      models.Article.findOneAndUpdate({ "_id": req.params.id }, {"saved": false, "notes": []})
      // Execute the above query
      .exec(function(error, doc) {
        // Log any errors
        if (error) {
          console.log(error);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
});


// Create a new note
app.post("/notes/save/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note({
    body: req.body.text,
    article: req.params.id
  });
  console.log(req.body)
  // And save the new note the db
  newNote.save(function(error, note) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's notes
      models.Article.findOneAndUpdate({ "_id": req.params.id }, {$push: { "notes": note } })
      // Execute the above query
      .exec(function(error) {
        // Log any errors
        if (error) {
          console.log(error);
          res.send(error);
        }
        else {
          // Or send the note to the browser
          res.send(note);
        }
      });
    }
  });
});

// Delete a note
app.delete("/notes/delete/:note_id/:article_id", function(req, res) {
  // Use the note id to find and delete it
  Note.findOneAndRemove({ "_id": req.params.note_id }, function(error) {
    // Log any errors
    if (error) {
      console.log(error);
      res.send(error);
    }
    else {
      models.Article.findOneAndUpdate({ "_id": req.params.article_id }, {$pull: {"notes": req.params.note_id}})
       // Execute the above query
        .exec(function(error) {
          // Log any errors
          if (error) {
            console.log(error);
            res.send(error);
          }
          else {
            // Or send the note to the browser
            res.send("Note Deleted");
          }
        });
    }
  });
});

// Listen on port
app.listen(port, function() {
  console.log("App running on port " + port);
});