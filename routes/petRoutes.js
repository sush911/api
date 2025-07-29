const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Pet = require('../models/Pet');

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Create a new pet with image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const pet = new Pet({
      ...req.body,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
    });
    await pet.save();
    res.status(201).json(pet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create pet' });
  }
});

// Get all pets (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { type, minAge, maxAge, sex, search } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (sex) filter.sex = sex;
    if (minAge || maxAge) filter.age = {};
    if (minAge) filter.age.$gte = Number(minAge);
    if (maxAge) filter.age.$lte = Number(maxAge);
    if (search) filter.name = new RegExp(search, 'i');

    const pets = await Pet.find(filter);
    res.json(pets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pets' });
  }
});

// Get a single pet by ID
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    res.json(pet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pet' });
  }
});


module.exports = router;




