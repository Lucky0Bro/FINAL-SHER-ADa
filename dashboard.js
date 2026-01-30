require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { botStats } = require('./bot.js'); // Import bot stats

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// ========== AUTHENTICATION ==========
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    
    if (password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign(
            { user: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: 'Incorrect password' });
    }
});

// Auth middleware
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// ========== BOT STATS API ==========
app.get('/api/stats', requireAuth, (req, res) => {
    const uptime = Math.floor(botStats.uptime / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    
    res.json({
        guilds: botStats.guilds,
        users: botStats.users,
        commands: botStats.commands,
        messages: botStats.messages,
        uptime: `${hours}h ${minutes}m ${seconds}s`,
        timestamp: new Date().toISOString()
    });
});

// ========== ADMIN DASHBOARD ==========
app.get('/admin', requireAuth, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Discord Bot Dashboard</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: #1a1a1a; 
                    color: #fff; 
                }
                .container { max-width: 1200px; margin: 0 auto; }
                .header { 
                    background: linear-gradient(135deg, #7289da, #5865f2); 
                    padding: 30px; 
                    border-radius: 15px; 
                    margin-bottom: 30px; 
                }
                .stats-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                    gap: 20px; 
                    margin-bottom: 30px; 
                }
                .stat-card { 
                    background: #2c2f33; 
                    padding: 25px; 
                    border-radius: 10px; 
                    text-align: center; 
                    transition: transform 0.3s; 
                }
                .stat-card:hover { transform: translateY(-5px); }
                .stat-value { 
                    font-size: 2.5em; 
                    font-weight: bold; 
                    color: #7289da; 
                    margin: 10px 0; 
                }
                .stat-label { color: #99aab5; font-size: 0.9em; }
                .btn { 
                    background: #7289da; 
                    color: white; 
                    padding: 12px 24px; 
                    border: none; 
                    border-radius: 5px; 
                    cursor: pointer; 
                    font-size: 16px; 
                    margin: 5px; 
                }
                .btn:hover { background: #5b6eae; }
                .btn-danger { background: #ed4245; }
                .btn-danger:hover { background: #c03537; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🤖 Discord Bot Dashboard</h1>
                    <p>Real-time bot statistics and management</p>
                </div>
                
                <div id="stats-container" class="stats-grid">
                    <!-- Stats will be loaded here -->
                </div>
                
                <div style="background: #2c2f33; padding: 20px; border-radius: 10px;">
                    <h2>Bot Controls</h2>
                    <button class="btn" onclick="refreshStats()">🔄 Refresh Stats</button>
                    <button class="btn" onclick="sendCommand('ping')">🏓 Ping Bot</button>
                    <button class="btn btn-danger" onclick="logout()">🚪 Logout</button>
                </div>
                
                <div style="margin-top: 30px; color: #99aab5; font-size: 0.9em;">
                    <p>Token expires in 24 hours | Auto-refresh every 30 seconds</p>
                </div>
            </div>
            
            <script>
                let refreshInterval;
                
                // Load stats on page load
                document.addEventListener('DOMContentLoaded', () => {
                    loadStats();
                    refreshInterval = setInterval(loadStats, 30000); // Auto-refresh every 30s
                });
                
                async function loadStats() {
                    try {
                        const token = localStorage.getItem('token');
                        const response = await fetch('/api/stats', {
                            headers: {
                                'Authorization': 'Bearer ' + token
                            }
                        });
                        
                        if (response.status === 401) {
                            logout();
                            return;
                        }
                        
                        const stats = await response.json();
                        
                        document.getElementById('stats-container').innerHTML = `
                            <div class="stat-card">
                                <div class="stat-label">Servers</div>
                                <div class="stat-value">${stats.guilds}</div>
                                <div class="stat-label">Guilds</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Users</div>
                                <div class="stat-value">${stats.users}</div>
                                <div class="stat-label">Cached Users</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Commands</div>
                                <div class="stat-value">${stats.commands}</div>
                                <div class="stat-label">Total Executed</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Messages</div>
                                <div class="stat-value">${stats.messages}</div>
                                <div class="stat-label">Processed</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Uptime</div>
                                <div class="stat-value">${stats.uptime}</div>
                                <div class="stat-label">HH:MM:SS</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Last Updated</div>
                                <div class="stat-value">${new Date(stats.timestamp).toLocaleTimeString()}</div>
                                <div class="stat-label">Time</div>
                            </div>
                        `;
                    } catch (error) {
                        console.error('Error loading stats:', error);
                    }
                }
                
                function refreshStats() {
                    loadStats();
                }
                
                function sendCommand(cmd) {
                    alert('Command sent to bot: ' + cmd);
                    // You can add WebSocket or API call to send commands to bot
                }
                
                function logout() {
                    clearInterval(refreshInterval);
                    localStorage.removeItem('token');
                    window.location.href = '/';
                }
            </script>
        </body>
        </html>
    `);
});

// ========== PUBLIC ROUTES ==========
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        bot: 'Running', 
        dashboard: 'Running',
        timestamp: new Date().toISOString() 
    });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Dashboard running on port ${PORT}`);
    console.log(`🔒 Password protection: ENABLED`);
    console.log(`📊 Bot stats available at /admin`);
});
