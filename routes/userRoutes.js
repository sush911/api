const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const User = require('../models/User');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;

// === Multer config ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// === Register ===
router.post('/register', upload.single('profileImage'), async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address,
    } = req.body;

    const profileImage = req.file ? `/uploads/${req.file.filename}` : null;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber: phoneNumber ? Number(phoneNumber) : null,
      address,
      profileImage,
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        address: user.address,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// === Login ===
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        address: user.address,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// === Get authenticated user's profile ===
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('favorites');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// === Update authenticated user's profile ===
router.put('/profile', auth, upload.single('profileImage'), async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, address } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phoneNumber = phoneNumber ? Number(phoneNumber) : user.phoneNumber;
    user.address = address || user.address;

    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// === Now define routes with :userId (after /profile routes) ===

// Get profile by userId (only if same as auth user)
router.get('/:userId', auth, async (req, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await User.findById(req.params.userId).populate('favorites');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('Get profile by ID error:', err.message);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile by userId
router.put('/:userId/profile', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { firstName, lastName, phoneNumber, address } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phoneNumber = phoneNumber ? Number(phoneNumber) : user.phoneNumber;
    user.address = address || user.address;

    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.error('Update profile by ID error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Toggle favorite
router.post('/:userId/favorites/:petId', auth, async (req, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const petId = req.params.petId;
    const index = user.favorites.indexOf(petId);

    if (index === -1) {
      user.favorites.push(petId);
    } else {
      user.favorites.splice(index, 1);
    }

    await user.save();
    res.json(user.favorites);
  } catch (err) {
    console.error('Toggle favorite error:', err.message);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Adopt pet (send notification)
router.post('/:userId/adopt/:petId', auth, async (req, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { userId, petId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.notifications.push({
      pet: petId,
      message: 'We will contact you soon regarding this adoption.',
    });

    await user.save();
    res.json({
      message: 'Adoption request sent',
      notifications: user.notifications,
    });
  } catch (err) {
    console.error('Adopt pet error:', err.message);
    res.status(500).json({ error: 'Failed to send adoption request' });
  }
});

module.exports = router;
