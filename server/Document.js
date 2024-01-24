const { Schema, model } = require('mongoose');

const Document = new Schema({
    _id: String,
    data: Object // Data from Quill
});

module.exports = model('Document', Document);