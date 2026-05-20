const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const mongoose = require('mongoose');
const pem = require('@metcoder95/https-pem');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT_HTTPS = 3443;
const PORT_HTTP = 3000;
const HOST = '0.0.0.0';

// Подключение к MongoDB 
mongoose.connect('mongodb://localhost:27017/BD', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully to BD database'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// обеспеч.
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static(path.join(__dirname, '../public')));

// API маршруты
app.use('/api/tasks', taskRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// HTTP сервер (порт 3000 работает овновной)
const httpApp = express();
httpApp.use(cors());
httpApp.use(express.json());
httpApp.use(express.urlencoded({ extended: true }));
httpApp.use(express.static(path.join(__dirname, '../public')));
httpApp.use('/api/tasks', taskRoutes);
httpApp.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

http.createServer(httpApp).listen(PORT_HTTP, HOST, () => {
  console.log(`\n🔓 HTTP Server running on:`);
  console.log(`   http://localhost:${PORT_HTTP}`);
  console.log(`   http://${getLocalIp()}:${PORT_HTTP}`);
});

// HTTPS сервер (порт 3443 не работает надо домен. оставлю на будующее)
https.createServer(pem, app).listen(PORT_HTTPS, HOST, () => {
  console.log(`\n🔒 HTTPS Server running on:`);
  console.log(`   https://localhost:${PORT_HTTPS}`);
  console.log(`   https://${getLocalIp()}:${PORT_HTTPS}`);
});