const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

// Rota dosyasını içeri alıyoruz
const agentRoute = require('./routes/agent');

// .env dosyasını oku
dotenv.config();

const app = express();

// --- MIDDLEWARE (Ara Yazılımlar) ---
app.use(express.json()); // Gelen JSON verilerini okumak için şart
app.use(cors());         // Erişim izinleri
app.use(morgan('dev'));  // İstekleri terminale renkli logla

// --- SAĞLIK KONTROLÜ (Health Check) ---
// Docker veya Kubernetes bu adrese bakarak servisin çöküp çökmediğini anlar (İster 11)
app.get('/health', (req, res) => {
    res.status(200).json({ 
        service: 'Agent Service 🤖', 
        status: 'Active', 
        uptime: process.uptime(), // Ne kadar süredir açık?
        port: process.env.PORT 
    });
});

// --- ANA ROTALAR ---
// Ticket Service'den gelen istekler buraya yönlendirilir
// URL: http://localhost:5001/api/agent/process
app.use('/api/agent', agentRoute);

// --- SUNUCUYU BAŞLAT ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🤖 Agent Service (Yapay Zeka Ajanı) ${PORT} portunda çalışıyor...`);
});