document.addEventListener('DOMContentLoaded', function() {
    // Connect to Socket.IO server
    const socket = io();
    
    // DOM elements for real-time data
    const temperatureValue = document.getElementById('temperature-value');
    const phValue = document.getElementById('ph-value');
    const waterLevelValue = document.getElementById('water-level-value');
    const tankPumpStatus = document.getElementById('tank-pump-status');
    const plantPumpStatus = document.getElementById('plant-pump-status');
    const lastUpdateTime = document.getElementById('last-update-time');
    
    // Control panel elements
    const tankPumpIndicator = document.getElementById('tank-pump-indicator');
    const plantPumpIndicator = document.getElementById('plant-pump-indicator');
    
    // Navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    const dashboardSection = document.getElementById('dashboard-section');
    const controlsSection = document.getElementById('controls-section');
    
    // Initialize charts
    let temperatureChart;
    
    // Data history for charts
    const historyData = {
      labels: Array(24).fill('').map((_, i) => ${23-i}h ago),
      temperature: Array(24).fill(null),
      ph: Array(24).fill(null),
      waterLevel: Array(24).fill(null)
    };
    
    // Initialize the dashboard
    initializeDashboard();
    
    // Socket events for real-time data
    socket.on('connect', () => {
      console.log('Connected to server');
      updateSystemStatus(true);
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      updateSystemStatus(false);
    });
    
    socket.on('sensorData', (data) => {
      updateDashboard(data);
    });
    
    socket.on('pumpStatus', (data) => {
      updatePumpStatus(data.pump, data.state);
    });
    
    // Initialize fetch historical data
    fetchHistoricalData();
    
    // Event listeners for control buttons
    document.querySelectorAll('.btn-control').forEach(button => {
      button.addEventListener('click', function() {
        const pump = this.getAttribute('data-pump');
        const action = this.getAttribute('data-action');
        const state = action === 'on';
        
        // Emit control command to server
        socket.emit('togglePump', { pump, state });
        
        // Update UI immediately for better responsiveness
        updatePumpStatus(pump, state);
      });
    });
    
    // Navigation event listeners
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active class from all links
        navLinks.forEach(link => link.parentElement.classList.remove('active'));
        
        // Add active class to clicked link
        this.parentElement.classList.add('active');
        
        // Show/hide sections based on clicked link
        const href = this.getAttribute('href');
        
        if (href === '#dashboard') {
          dashboardSection.style.display = 'block';
          controlsSection.style.display = 'none';
        } else if (href === '#controls') {
          dashboardSection.style.display = 'none';
          controlsSection.style.display = 'block';
        }
        
        // Add handling for other sections as needed
        // (history and settings sections would need to be added to the HTML)
      });
    });
    
    // Functions
    function initializeDashboard() {
      // Initialize temperature chart
      const ctx = document.getElementById('temperatureChart').getContext('2d');
      temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: historyData.labels,
          datasets: [
            {
              label: 'Temperature (°C)',
              data: historyData.temperature,
              borderColor: '#f6c343',
              backgroundColor: 'rgba(246, 195, 67, 0.1)',
              tension: 0.3,
              fill: true
            },
            {
              label: 'pH Level',
              data: historyData.ph,
              borderColor: '#39afd1',
              backgroundColor: 'rgba(57, 175, 209, 0.1)',
              tension: 0.3,
              fill: true
            },
            {
              label: 'Water Level (%)',
              data: historyData.waterLevel,
              borderColor: '#2c7be5',
              backgroundColor: 'rgba(44, 123, 229, 0.1)',
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                boxWidth: 6,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(18, 38, 63, 0.8)',
              padding: 10,
              cornerRadius: 4,
              titleFont: {
                size: 13
              },
              bodyFont: {
                size: 12
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                font: {
                  size: 11
                }
              },
              grid: {
                color: 'rgba(227, 235, 246, 0.5)'
              }
            },
            x: {
              ticks: {
                font: {
                  size: 11
                }
              },
              grid: {
                display: false
              }
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          },
          elements: {
            point: {
              radius: 2,
              hoverRadius: 4
            },
            line: {
              borderWidth: 2
            }
          }
        }
      });
  
      // Set initial status
      updateSystemStatus(false);
    }
    
    function updateDashboard(data) {
      // Update metrics values
      temperatureValue.textContent = data.temperature;
      phValue.textContent = data.ph;
      waterLevelValue.textContent = data.waterLevel;
      
      // Update status indicators based on value ranges
      updateMetricStatus('temperature', data.temperature);
      updateMetricStatus('ph', data.ph);
      updateMetricStatus('water-level', data.waterLevel);
      
      // Update pumpg status
      updatePumpStatus('tank', data.tankPump);
      updatePumpStatus('plant', data.plantPump);
      
      // Update last update time
      const now = new Date();
      lastUpdateTime.textContent = now.toLocaleTimeString();
      
      // Update chart data
      updateChartData(data);
    }
    
    function updateMetricStatus(metric, value) {
      const statusElement = document.querySelector(.${metric} .metric-status);
      
      if (!statusElement) return;
      
      // Remove all status classes
      statusElement.classList.remove('normal', 'warning', 'danger');
      
      let status = 'normal';
      let statusText = 'Normal Range';
      
      // Set status based on value ranges
      switch (metric) {
        case 'temperature':
          if (value < 24) {
            status = 'warning';
            statusText = 'Below Ideal';
          } else if (value > 28) {
            status = 'danger';
            statusText = 'Above Ideal';
          }
          break;
        case 'ph':
          if (value < 6.5) {
            status = 'warning';
            statusText = 'Too Acidic';
          } else if (value > 7.5) {
            status = 'danger';
            statusText = 'Too Alkaline';
          }
          break;
        case 'water-level':
          if (value < 50) {
            status = 'warning';
            statusText = 'Low Level';
          } else if (value < 20) {
            status = 'danger';
            statusText = 'Critical Level';
          }
          break;
      }
      
      // Update status class and text
      statusElement.classList.add(status);
      statusElement.textContent = statusText;
    }
    
    function updatePumpStatus(pump, state) {
      const statusElement = document.getElementById(${pump}-pump-status);
      const indicatorElement = document.getElementById(${pump}-pump-indicator);
      
      if (statusElement) {
        statusElement.textContent = state ? 'ACTIVE' : 'INACTIVE';
        statusElement.className = 'status-badge ' + (state ? 'active' : 'inactive');
      }
      
      if (indicatorElement) {
        indicatorElement.textContent = state ? 'ACTIVE' : 'INACTIVE';
        indicatorElement.className = 'control-status ' + (state ? 'active' : '');
      }
    }
    
    function updateSystemStatus(online) {
      const statusIndicator = document.querySelector('.status-indicator');
      const statusText = document.querySelector('.status-text');
      
      if (online) {
        statusIndicator.classList.remove('offline');
        statusIndicator.classList.add('online');
        statusText.textContent = 'System Online';
      } else {
        statusIndicator.classList.remove('online');
        statusIndicator.classList.add('offline');
        statusText.textContent = 'System Offline';
      }
    }
    
    function updateChartData(data) {
      // Add new data points
      historyData.temperature.push(data.temperature);
      historyData.ph.push(data.ph);
      historyData.waterLevel.push(data.waterLevel);
      
      // Remove oldest data points to maintain 24 hours of data
      if (historyData.temperature.length > 24) {
        historyData.temperature.shift();
        historyData.ph.shift();
        historyData.waterLevel.shift();
      }
      
      // Update chart datasets
      temperatureChart.data.datasets[0].data = historyData.temperature;
      temperatureChart.data.datasets[1].data = historyData.ph;
      temperatureChart.data.datasets[2].data = historyData.waterLevel;
      
      // Update the chart
      temperatureChart.update();
    }
    
    function fetchHistoricalData() {
      fetch('/api/history')
        .then(response => response.json())
        .then(data => {
          // Process and populate historical data
          for (let i = 0; i < Math.min(data.length, 24); i++) {
            const entry = data[i];
            historyData.temperature[23-i] = entry.temperature;
            historyData.ph[23-i] = entry.ph;
            historyData.waterLevel[23-i] = entry.waterLevel;
          }
          
          // Update the chart with historical data
          temperatureChart.update();
        })
        .catch(error => {
          console.error('Error fetching historical data:', error);
        });
    }
    
    // Add animation for smooth transitions
    function addSmoothTransition() {
      document.querySelectorAll('.metric-card, .control-card').forEach(card => {
        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
      });
    }
    
    // Call smooth transition setup
    addSmoothTransition();
  });
  