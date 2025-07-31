const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/notification');

// ✅ Admin creates notification (user-specific or global via null userId)
router.post('/', async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    const notif = new Notification({
      userId: userId || null,
      title,
      message,
      type: type || 'announcement',
    });

    await notif.save();

    const io = req.app.get('io');
    if (userId) {
      io.to(userId).emit('new-notification', notif);
    } else {
      io.emit('new-notification', notif); // Broadcast to all
    }

    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// ✅ Broadcast a global notification (no userId)
router.post('/broadcast', async (req, res) => {
  const { title, message } = req.body;

  try {
    const globalNotif = new Notification({
      title,
      message,
      type: 'announcement',
      userId: null,
    });

    await globalNotif.save();
    res.status(201).json({ message: 'Broadcast sent as global notification' });
  } catch (err) {
    res.status(500).json({ error: 'Broadcast failed', details: err.message });
  }
});

// ✅ Admin: Get all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ✅ Get personal + global notifications for a user (fixed with ObjectId conversion)
router.get('/user/:userId', async (req, res) => {
  try {
    let userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    userId = mongoose.Types.ObjectId(userId);

    const notifs = await Notification.find({
      $or: [
        { userId: userId },
        { userId: null },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user notifications' });
  }
});

// ✅ Mark as read
router.patch('/:id/read', async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    const io = req.app.get('io');
    if (updated.userId) {
      io.to(updated.userId.toString()).emit('notification-read', updated);
    }

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// ✅ Update notification
router.put('/:id', async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// ✅ Delete notification
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
