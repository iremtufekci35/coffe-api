const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

const dataFilePath = path.join(__dirname, 'coffees.json');

const readData = () => {
  try {
    const data = fs.readFileSync(dataFilePath);
    return JSON.parse(data);
  } catch (err) {
    console.error('Veri okunurken hata oluştu:', err);
    return [];
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Veri yazılırken hata oluştu:', err);
  }
};

app.get('/', (req, res) => {
  res.send('Kahve Şurubu API\'sine Hoşgeldiniz!');
});

app.get('/api/coffees', (req, res) => {
  const syrups = readData(); // JSON dosyasından veriyi oku
  res.json(syrups);
});

app.post('/api/coffees', (req, res) => {
  const { name, flavor, description, price } = req.body;
  
  if (!name || !flavor || !description || !price) {
    return res.status(400).send('Eksik bilgi!');
  }

  const syrups = readData(); 
  const newSyrup = {
    id: syrups.length + 1,
    name,
    flavor,
    description,
    price
  };

  syrups.push(newSyrup);
  writeData(syrups); 
  res.status(201).json(newSyrup);
});

app.put('/api/coffees/:id', (req, res) => {
  const { id } = req.params;
  const { name, flavor, description, price } = req.body;

  const syrups = readData(); 
  let syrup = syrups.find(s => s.id === parseInt(id));

  if (!syrup) {
    return res.status(404).send('Kahve şurubu bulunamadı.');
  }

  syrup.name = name || syrup.name;
  syrup.flavor = flavor || syrup.flavor;
  syrup.description = description || syrup.description;
  syrup.price = price || syrup.price;

  writeData(syrups); 
  res.json(syrup);
});

app.delete('/api/coffees/:id', (req, res) => {
  const { id } = req.params;

  const syrups = readData(); 
  const index = syrups.findIndex(s => s.id === parseInt(id));

  if (index === -1) {
    return res.status(404).send('Kahve şurubu bulunamadı.');
  }

  syrups.splice(index, 1);
  writeData(syrups); 
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
