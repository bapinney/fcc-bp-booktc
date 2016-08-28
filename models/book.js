var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var Schema = mongoose.Schema;

/*  Pin owner schema will be used as a Mongo sub-doc
    inside of the Pin doc */
var bookOwnerSchema = new Schema({
    userProvider    : String,
    userId          : Number,
    userName        : String
});


var bookSchema = new Schema({
    dateCreated     : { type: Date, default: Date.now },
    pinOwner        : [bookOwnerSchema],
    imgUrl          : String,
    title           : String,
    likes           : Array
    },
    {collection: 'fccbooktc-books'} //The collection will be created if it does not exist
);

module.exports = mongoose.model('Pin', bookSchema);