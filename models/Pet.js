const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['Cat', 'Dog', 'Bird'] },
  age: Number,
  sex: { type: String, enum: ['Male', 'Female'] },
  breed: String,
  location: String,
  imageUrl: String,
  ownerPhoneNumber: String,
  description: String, // 👈 NEW FIELD
});

module.exports = mongoose.model('Pet', petSchema);

