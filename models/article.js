// model for article collection 
var mongoose = require('mongoose');

var schema = mongoose.schema;
var ArticleSchema = new schema({
    title: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    comment: [{
        type: schema.Types.ObjectId,
        ref: "Comment"
    }]
})

var Article = mongoose.model("Article", ArticleSchema);
module.exports = Article;