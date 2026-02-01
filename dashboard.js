// dashboard.js

let refreshInterval;

// Check if user already logged in
if (!localStorage.getItem('token')) {
    // Redirect to login page if not logged in
    window.location.href = '/login.html';
}

// Load stats on page load and set auto-refresh
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    refreshInterval = setInterval(loadStats, 30000); // Auto-refresh every 30 seconds
});

// Function to load bot stats
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in first.');
            window.location.href = '/login.html'; // Redirect to login page
            return;
        }

        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.status === 401) {
            alert('Session expired. Please log in again.');
            logout();
            return;
        }

        const stats = await response.json();

        // Render stats dynamically
        document.getElementById('stats-container').innerHTML = `
            ${renderStatCard('Servers', stats.guilds)}
            ${renderStatCard('Users', stats.users)}
            ${renderStatCard('Commands', stats.commands)}
            ${renderStatCard('Messages', stats.messages)}
            ${renderStatCard('Uptime', stats.uptime)}
            ${renderStatCard('Last Updated', new Date(stats.timestamp).toLocaleTimeString())}
        `;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Helper to create a stat card
function renderStatCard(label, value) {
    return `
        <div class="stat-card">
            <div class="stat-label">${label}</div>
            <div class="stat-value">${value}</div>
        </div>
    `;
}

// Function to refresh stats manually
function refreshStats() {
    loadStats();
}

// Function to send commands (placeholder)
function sendCommand(command) {
    alert('Sending command: ' + command);
    // Here you can implement WebSocket or API call to send commands to your bot
}

// Logout function
function logout() {
    clearInterval(refreshInterval);
    localStorage.removeItem('token');
    window.location.href = '/login.html'; // Redirect to login page
}
