require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', apiRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Simulate real-time data for demo purposes
  // In a real scenario, this would come from your ESP32
  const simulateData = () => {
    return {
      temperature: parseFloat((Math.random() * 5 + 25).toFixed(1)),
      ph: parseFloat((Math.random() * 2 + 6).toFixed(2)),
      waterLevel: parseInt(Math.random() * 100),
      tankPump: Math.random() > 0.5,
      plantPump: Math.random() > 0.5,
      timestamp: new Date().toISOString()
    };
  };
  
  // Send initial data immediately
  socket.emit('sensorData', simulateData());
  
  // Then send data every 5 seconds
  const dataInterval = setInterval(() => {
    socket.emit('sensorData', simulateData());
  }, 5000);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clearInterval(dataInterval);
  });
  
  // Handle manual pump controls
  socket.on('togglePump', (data) => {
    console.log(`Toggling pump: ${data.pump} to state: ${data.state}`);
    // In a real scenario, this would trigger your ESP32 relay
    // For now, we'll just echo back confirmation
    socket.emit('pumpStatus', data);
  });
});

// Serve the main HTML file for all routes not matched
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});