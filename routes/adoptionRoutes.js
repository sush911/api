const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AdoptionRequest = require('../models/Adoption');
const Pet = require('../models/Pet');

// Create a new adoption request
router.post('/:petId', auth, async (req, res) => {
  try {
    const petId = req.params.petId;
    const existing = await AdoptionRequest.findOne({ user: req.userId, pet: petId });
    if (existing) return res.status(400).json({ message: 'Request already exists' });

    const request = new AdoptionRequest({ user: req.userId, pet: petId });
    await request.save();
    res.status(201).json({ message: 'Adoption request sent', request });
  } catch (err) {
    console.error('Adoption error:', err);
    res.status(500).json({ error: 'Failed to create adoption request' });
  }
});

// Get all requests for the current user
router.get('/user', auth, async (req, res) => {
  try {
    const requests = await AdoptionRequest.find({ user: req.userId })
      .populate('pet')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Fetch user requests error:', err);
    res.status(500).json({ error: 'Failed to fetch user requests' });
  }
});

// Admin: Get all adoption requests
router.get('/', async (req, res) => {
  try {
    const requests = await AdoptionRequest.find()
      .populate('user')
      .populate('pet')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Fetch all requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Admin: update request status
router.put('/:requestId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const request = await AdoptionRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = status;
    request.updatedAt = new Date();
    await request.save();

    // Optionally mark pet as adopted
    if (status === 'approved') {
      const pet = await Pet.findById(request.pet);
      if (pet) {
        pet.adopted = true;
        await pet.save();
      }
    }

    res.json(request);
  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

module.exports = router;
