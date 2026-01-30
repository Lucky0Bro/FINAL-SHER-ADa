require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');

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
    
    // Update stats
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
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Increment message counter
    botStats.messages++;
    
    // Basic ping command
    if (message.content === '!ping') {
        const latency = Date.now() - message.createdTimestamp;
        message.reply(`🏓 Pong! Latency: ${latency}ms`);
        botStats.commands++;
    }
    
    // Stats command
    if (message.content === '!stats') {
        const uptime = Math.floor(botStats.uptime / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        
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
    
    // Dashboard info
    if (message.content === '!dashboard') {
        message.reply(`🌐 Dashboard: ${process.env.DASHBOARD_URL || 'Not deployed yet'}`);
    }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

// Export for dashboard access
module.exports = { client, botStats };
