const { Client } = require('pg');
require('dotenv').config();

let client;

if (process.env.NODE_ENV === 'production') {
  client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
} else {
  client = new Client({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'coffedb',
    password: process.env.PGPASSWORD || 'irem35',
    port: process.env.PGPORT || 5432,
  });
}

client.connect()
  .then(() => {
    console.log('Veritabanına başarıyla bağlanıldı');
    return client.query('SELECT * FROM users');
  })
  .then(res => {
    console.log('Users tablosu:', res.rows);
  })
  .catch(err => {
    console.error('Veritabanı bağlantı hatası:', err);
  })
  .finally(() => {
    client.end();
  });
