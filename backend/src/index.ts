import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import characterRoutes from './routes/characters';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://pathfinder-manager-v2-production.up.railway.app",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../../frontend/out')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Pathfinder Manager API is running!' });
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/out/index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
    console.log(`User ${socket.id} joined session ${sessionId}`);
  });
  
  socket.on('leave-session', (sessionId) => {
    socket.leave(sessionId);
    console.log(`User ${socket.id} left session ${sessionId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/pathfinder-manager';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 8080;

const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

export { io };