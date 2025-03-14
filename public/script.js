// Connect to the Socket.IO server
const socket = io('http://localhost:3000'); // Adjust the URL as needed

// DOM elements
const temperatureEl = document.getElementById('temperature');
const waterLevelEl = document.getElementById('waterLevel');
const phLevelEl = document.getElementById('phLevel');
const statusEl = document.getElementById('status');
const lastUpdateEl = document.getElementById('lastUpdate');

// Update display when new data is received
socket.on('sensorData', (data) => {
    temperatureEl.textContent = `${data.temperature} °C`;
    waterLevelEl.textContent = `${data.waterLevel} %`;
    phLevelEl.textContent = data.phLevel;
    statusEl.textContent = 'Connected';
    statusEl.style.color = '#27ae60';
    lastUpdateEl.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
});

// Handle connection status
socket.on('connect', () => {
    statusEl.textContent = 'Connected';
    statusEl.style.color = '#27ae60';
});

socket.on('disconnect', () => {
    statusEl.textContent = 'Disconnected';
    statusEl.style.color = '#c0392b';
});

// Error handling
socket.on('connect_error', (error) => {
    statusEl.textContent = 'Connection Error';
    statusEl.style.color = '#c0392b';
    console.error('Connection error:', error);
});