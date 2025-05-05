const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Kullanıcı adı ve şifre kontrolü
  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  try {
    // Kullanıcı adı veritabanında var mı kontrol et
    const checkUserQuery = 'SELECT * FROM users WHERE username = $1';
    const userResult = await pool.query(checkUserQuery, [username]);

    if (userResult.rows.length > 0) {
      // Kullanıcı zaten varsa, uygun mesajla dön
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı adı zaten mevcut',
      });
    }

    // Kullanıcı adı mevcut değilse, şifreyi hashle
    const hash = await bcrypt.hash(password, 10);

    // Yeni kullanıcıyı veritabanına ekle
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hash]
    );

    const newUser = result.rows[0];
    console.log(`User ${newUser.username} registered successfully`);

    // Başarılı kayıt mesajı dön
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: newUser.id, username: newUser.username },
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      console.log(`User ${user.username} logged in successfully`);

      res.json({
        success: true,
        message: 'Login successful',
        token: token,
      });
    } else {
      console.log(`Invalid credentials for user ${username}`);
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to the CoffeeApp API!');
});

app.listen(3000, () => {
  console.log('API running on port 3000');
});
