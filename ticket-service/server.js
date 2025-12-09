const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan'); // 1. LOGLAMA PAKETİ
const swaggerUI = require('swagger-ui-express'); // 2. SWAGGER UI
const swaggerDocs = require('./swaggerConfig');  // 3. SWAGGER AYARLARI

// --- ROTA DOSYALARINI İÇERİ AL ---
const authRoute = require('./routes/auth');
const ticketRoute = require('./routes/tickets');
const userRoute = require('./routes/users');
const commentRoute = require('./routes/comments');
const reportRoute = require('./routes/reports');

dotenv.config();

const app = express();

// --- MIDDLEWARE (Ara Yazılımlar) ---
app.use(express.json());
app.use(cors());
app.use(morgan('dev')); // 4. HER İSTEĞİ TERMİNALE LOGLA (Renkli)

// --- SWAGGER DOKÜMANTASYON ROTASI ---
// Tarayıcıda /api-docs adresine gidince doküman çıkacak
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// --- VERİTABANI BAĞLANTISI ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Veritabanina Baglandi! 🟢"))
    .catch((err) => console.log("Veritabanı Hatası:", err));

// --- ROTALARI KULLAN ---
app.use('/api/auth', authRoute);
app.use('/api/tickets', ticketRoute);
app.use('/api/users', userRoute);
app.use('/api/comments', commentRoute);
app.use('/api/reports', reportRoute);

// --- SUNUCUYU BAŞLAT ---
if (require.main === module) {
    app.listen(5000, () => {
        console.log("Sunucu 5000 portunda calisiyor...");
        console.log("📄 API Dokümantasyonu: http://localhost:5000/api-docs");
    });
}

module.exports = app;