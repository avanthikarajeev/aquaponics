const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Serve static files from 'public' directory

// Store sensor data
let sensorData = {
    temperature: 0,
    waterLevel: 0,
    phLevel: 0
};

io.on('connection', (socket) => {
    console.log('Client connected');
    
    // Send initial data to new clients
    socket.emit('sensorData', sensorData);

    // Simulate ESP32 data (replace this with actual ESP32 connection)
    setInterval(() => {
        // Simulated sensor readings
        sensorData = {
            temperature: (Math.random() * 10 + 20).toFixed(1), // 20-30°C
            waterLevel: (Math.random() * 100).toFixed(1),      // 0-100%
            phLevel: (Math.random() * 7 + 4).toFixed(1)       // 4-11 pH
        };
        io.emit('sensorData', sensorData);
    }, 2000); // Update every 2 seconds

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});