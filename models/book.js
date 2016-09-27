var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');


/*  Pin owner schema will be used as a Mongo sub-doc
    inside of the Pin doc */
var bookOwnerSchema = new Schema({
    userProvider    : String,
    userId          : Number,
    userName        : String
});


var bookSchema = new Schema({
    dateAdded     : { type: Date, default: Date.now },
    bookOwner       : [bookOwnerSchema],
    imgUrl          : String,
    title           : String,
    likes           : Array,
    tradePending    : Boolean
    },
    {collection: 'fccbooktc-books'} //The collection will be created if it does not exist
);

bookSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Book', bookSchema);