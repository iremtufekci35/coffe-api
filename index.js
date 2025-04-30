const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const app = express();

app.use(cors());
app.use(express.json());


const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).send('Username and password are required.');
        }
        const hash = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hash]);
        res.status(201).send('User registered successfully');
    } catch (err) {
        console.error('Error occurred during registration:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (user && await bcrypt.compare(password, user.password_hash)) {
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);  // Veritabanından gelen kullanıcıları JSON formatında gönderiyoruz
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('An error occurred while fetching users');
    }
});
app.get('/', async (req, res) => {
    try {
       res.send("Welcome To The CoffeApp")
    } catch (err) {
        console.error('Error fetching users:', err);
    }
});
//192.168.5.99
app.listen(3000, () => console.log('API running on port 3000'));
