const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// === Ensure 'uploads' folder exists ===
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// === Serve static uploads ===
app.use('/uploads', express.static(uploadDir));

// === Routes ===
const petRoutes = require('./routes/petRoutes');
const userRoutes = require('./routes/userRoutes');
const adoptionRoutes = require('./routes/adoptionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/pets', petRoutes);
app.use('/api/users', userRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/notifications', notificationRoutes);

// === MongoDB Connect ===
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// === Optional: Error handler ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// === Start server ===
// Replace your existing app.listen with this:
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http, {
  cors: {
    origin: '*',
  },
});

app.set('io', io); // Attach to app so you can use in routes

io.on('connection', (socket) => {
  console.log('🟢 A user connected');

  socket.on('join', (userId) => {
    console.log(`🔗 User joined: ${userId}`);
    socket.join(userId); // Join room for private notifications
  });

  socket.on('disconnect', () => {
    console.log('🔴 A user disconnected');
  });
});

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


