const express = require('express');
const router = express.Router();
const AdoptionRequest = require('../models/adoption');
const Notification = require('../models/notification');
const Pet = require('../models/Pet');

// 📥 Submit an adoption request
router.post('/', async (req, res) => {
  try {
    const request = new AdoptionRequest(req.body);
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// 🛠️ Get all adoption requests (Admin)
router.get('/admin', async (req, res) => {
  try {
    const requests = await AdoptionRequest.find()
      .populate('petId')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// 🔁 Update adoption status (Approve / Reject)
router.put('/:id/status', async (req, res) => {
  const { status, adminMessage } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const request = await AdoptionRequest.findById(req.params.id).populate('petId');
    if (!request) return res.status(404).json({ error: 'Request not found' });

    request.status = status;
    request.adminMessage = adminMessage || '';
    await request.save();

    // 🌍 Create global notification (no userId)
    const notif = new Notification({
      title: `Adoption Request ${status.toUpperCase()}`,
      message:
        status === 'approved'
          ? `${request.petId?.name || 'A pet'} has been adopted.`
          : `${request.petId?.name || 'A pet'}'s adoption was rejected.${adminMessage ? ` Reason: ${adminMessage}` : ''}`,
      type: 'adoption',
    });

    await notif.save();

    res.json({ message: `Adoption ${status}`, request });
  } catch (err) {
    res.status(500).json({ error: 'Error updating request' });
  }
});

// 📦 Get requests by pet
router.get('/pet/:petId', async (req, res) => {
  try {
    const requests = await AdoptionRequest.find({ petId: req.params.petId });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pet requests' });
  }
});

// ❌ Delete a request
router.delete('/:id', async (req, res) => {
  try {
    await AdoptionRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

module.exports = router;
