require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');

// Initialize Express app
const app = express();

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Store bot stats for dashboard
global.botStats = {
    uptime: Date.now(),
    guilds: 0,
    users: 0,
    commands: 0,
    messages: 0
};

// Commands collection
client.commands = new Collection();

// Bot ready event
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`🌐 Serving ${client.guilds.cache.size} servers`);
    console.log(`👥 ${client.users.cache.size} users cached`);
    
    // Update stats initially
    updateBotStats();

    // Update stats every 30 seconds
    setInterval(updateBotStats, 30000);
});

// Update bot statistics
function updateBotStats() {
    botStats.guilds = client.guilds.cache.size;
    botStats.users = client.users.cache.size;
    botStats.uptime = Date.now() - botStats.uptime;
}

// Message handler
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Increment message count
    botStats.messages++;

    if (message.content === '!ping') {
        const latency = Date.now() - message.createdTimestamp;
        message.reply(`🏓 Pong! Latency: ${latency}ms`);
        botStats.commands++;
    }

    if (message.content === '!stats') {
        const uptimeSeconds = Math.floor(botStats.uptime / 1000);
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        message.reply(`
📊 **Bot Statistics:**
• Servers: ${botStats.guilds}
• Users: ${botStats.users}
• Commands: ${botStats.commands}
• Messages: ${botStats.messages}
• Uptime: ${hours}h ${minutes}m
        `);
        botStats.commands++;
    }

    if (message.content === '!dashboard') {
        message.reply(`🌐 Dashboard: ${process.env.DASHBOARD_URL || 'Not deployed yet'}`);
    }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

// Express server to keep the app alive
const PORT = process.env.PORT || 3000;

// Basic route
app.get('/', (req, res) => {
    res.send('Discord bot is running!');
});

// Start the web server
app.listen(PORT, () => {
    console.log(`Web server listening on port ${PORT}`);
});

// Exporting for testing or further use if needed
module.exports = { client, botStats };
