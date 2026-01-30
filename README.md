# Discord Content Manager Bot

Simple bot to delete messages with a web dashboard.

## Setup
1. `npm install`
2. Create `.env` file (copy from `.env.example`)
3. Add your Discord bot token to `.env`
4. `node bot.js` - start the bot
5. `node dashboard.js` - start dashboard (port 3000)

## Features
- `/cleanup` command (admin only)
- Web dashboard to configure settings
- Stores config in SQLite database

## Dashboard
Visit `http://localhost:3000`
Default password: `admin123` (change in .env)
