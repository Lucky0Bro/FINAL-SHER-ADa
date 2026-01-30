require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

// Setup database
const db = new sqlite3.Database('./data/database.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS config (
    guild_id TEXT PRIMARY KEY,
    ignored_words TEXT DEFAULT '[]',
    admin_roles TEXT DEFAULT '[]'
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Cleanup command
const cleanupCommand = {
  data: new SlashCommandBuilder()
    .setName('cleanup')
    .setDescription('Delete messages')
    .addIntegerOption(opt => opt.setName('limit').setDescription('Messages to check').setMaxValue(100)),
  
  async execute(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({ content: '❌ Admin only!', ephemeral: true });
    }
    
    const limit = interaction.options.getInteger('limit') || 50;
    
    const messages = await interaction.channel.messages.fetch({ limit });
    let deleted = 0;
    
    for (const [id, msg] of messages) {
      if (msg.author.bot) continue;
      await msg.delete();
      deleted++;
    }
    
    interaction.reply({ content: `✅ Deleted ${deleted} messages`, ephemeral: true });
  }
};

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  // Register command
  const commands = [cleanupCommand.data.toJSON()];
  await client.application.commands.set(commands);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  
  if (interaction.commandName === 'cleanup') {
    await cleanupCommand.execute(interaction);
  }
});

client.login(process.env.DISCORD_TOKEN);
