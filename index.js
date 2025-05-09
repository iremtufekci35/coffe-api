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
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT),
});

pool.connect()
  .then(() => {
    console.log("PostgreSQL bağlantısı başarılı!");
  })
  .catch((err) => {
    console.error("Veritabanı bağlantısı hatası:", err);
  });
  
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  try {
    const checkUserQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(checkUserQuery, [email]);

    if (userResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi zaten kayıtlı',
      });
    }

  
    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hash]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı',
      user: {
        id: newUser.id,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error('Kayıt sırasında hata:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});


app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      console.log(`User ${user.email} logged in successfully`);

      res.json({
        success: true,
        message: 'Login successful',
        token: token,
      });
    } else {
      console.log(`Invalid credentials for user ${email}`);
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
