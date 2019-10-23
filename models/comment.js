// this is for comment model
var mongoose = require("mongoose");

var schema = mongoose.schema;

var CommentSchema = new schema({
    name: {
        type: String,
    },
    body: {
        type: String,
        required: true
    },
});

var Comment = mongoose.model("Comment", CommentSchema);
module.exports = Comment;