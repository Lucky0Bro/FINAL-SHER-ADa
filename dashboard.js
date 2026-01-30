require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database('./data/database.db');
app.use(express.json());

// Simple login
app.post('/api/login', async (req, res) => {
  const { password } = req.body;
  
  if (password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

// Protected route
app.get('/api/config/:guildId', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    
    db.get('SELECT * FROM config WHERE guild_id = ?', [req.params.guildId], (err, row) => {
      res.json(row || { ignored_words: '[]', admin_roles: '[]' });
    });
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Update config
app.post('/api/config/:guildId', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    
    const { ignored_words, admin_roles } = req.body;
    db.run(
      'INSERT OR REPLACE INTO config (guild_id, ignored_words, admin_roles) VALUES (?, ?, ?)',
      [req.params.guildId, JSON.stringify(ignored_words), JSON.stringify(admin_roles)]
    );
    
    res.json({ success: true });
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Serve simple HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Discord Bot Dashboard</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        input, textarea { display: block; margin: 10px 0; padding: 8px; width: 300px; }
        button { padding: 10px 20px; background: #5865F2; color: white; border: none; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>Bot Dashboard</h1>
      <div id="login">
        <h2>Login</h2>
        <input type="password" id="password" placeholder="Admin Password">
        <button onclick="login()">Login</button>
      </div>
      <div id="dashboard" style="display: none;">
        <h2>Configuration</h2>
        <input id="guildId" placeholder="Server ID">
        <textarea id="ignoredWords" placeholder="Ignored words (one per line)" rows="5"></textarea>
        <input id="adminRoles" placeholder="Admin roles (comma separated)">
        <button onclick="saveConfig()">Save</button>
      </div>
      <script>
        let token = '';
        
        async function login() {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: document.getElementById('password').value })
          });
          
          if (res.ok) {
            const data = await res.json();
            token = data.token;
            document.getElementById('login').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
          } else {
            alert('Wrong password!');
          }
        }
        
        async function saveConfig() {
          const guildId = document.getElementById('guildId').value;
          const ignoredWords = document.getElementById('ignoredWords').value.split('\\n');
          const adminRoles = document.getElementById('adminRoles').value.split(',');
          
          await fetch('/api/config/' + guildId, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ ignored_words: ignoredWords, admin_roles: adminRoles })
          });
          
          alert('Saved!');
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Dashboard running on port ${process.env.PORT || 3000}`);
});
