const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema({
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true,
  },

  petName: String,
  petType: {
    type: String,
    enum: ['Cat', 'Dog', 'Bird'],
  },

  fullName: String,
  citizenshipNumber: String,
  phoneNumber: String,
  email: String,
  homeAddress: String,
  reason: String,
  date: Date,

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminMessage: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AdoptionRequest', adoptionSchema);
