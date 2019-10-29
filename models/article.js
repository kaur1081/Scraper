// Require mongoose
var mongoose = require("mongoose");
// Create Schema class
var Schema = mongoose.Schema;

// Create article schema
var articleSchema = new Schema({
  title: {
    unique: { index: { unique: true } },
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  saved: {
    type: Boolean,
    default: false
  }
  
});

// Create the Article model with the ArticleSchema
var Article = mongoose.model("Article", articleSchema);

// Export the model
module.exports = Article;
