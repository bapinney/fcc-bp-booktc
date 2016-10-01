var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var Schema = mongoose.Schema;
var User = require('../models/user.js');
var ObjectId = Schema.ObjectId;
var Book = require('../models/book.js');

var tradeSchema = new Schema({
    dateAdded     : { type: Date, default: Date.now },
    book          : [Book],
    fromUser      : [{
        userProvider : String,
        userId       : Number,
        userName     : String}],
    toUser        : [{
        userProvider : String,
        userId       : Number,
        userName     : String}],
    isCompleted   : Boolean
    },
    {collection: 'fccbooktc-trades'} //The collection will be created if it does not exist
);

module.exports = mongoose.model('Trade', tradeSchema);