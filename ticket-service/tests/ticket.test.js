const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Server dosyamızı çağırıyoruz
const User = require('../models/User');

// Testten önce veritabanına bağlan
beforeAll(async () => {
    // Eğer bağlantı kapalıysa aç (server.js zaten açıyor olabilir, kontrol ediyoruz)
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
    }
});

// Test bitince bağlantıyı kapat ki terminal asılı kalmasın
afterAll(async () => {
    await mongoose.connection.close();
});

describe('Ticket API Testleri', () => {
    
    let studentToken;
    let studentId;

    // 1. Önce test için sahte bir öğrenci oluşturup giriş yapalım
    test('Kullanıcı Kaydı ve Girişi (Token Alma)', async () => {
        const uniqueEmail = `test_${Date.now()}@test.com`; // Her seferinde farklı mail
        
        // Kayıt Ol
        await request(app).post('/api/auth/register').send({
            name: "Test Öğrenci",
            email: uniqueEmail,
            password: "123",
            role: "student"
        });

        // Giriş Yap
        const res = await request(app).post('/api/auth/login').send({
            email: uniqueEmail,
            password: "123"
        });

        expect(res.statusCode).toEqual(200); // Başarılı olmalı
        expect(res.body).toHaveProperty('token'); // Token dönmeli
        
        studentToken = res.body.token;
        studentId = res.body._id;
    });

    // 2. Ticket Oluşturma Testi
    test('Yeni Ticket Oluşturabilmeli', async () => {
        const res = await request(app)
            .post('/api/tickets')
            .send({
                student: studentId,
                title: "Test Ticket Başlığı",
                description: "Test açıklama metni",
                // Departman ve Öncelik göndermiyoruz, AI doldurmalı
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.title).toBe("Test Ticket Başlığı");
        
        // AI Çalıştı mı kontrolü? (Varsayılan değerler atanmış olmalı)
        expect(res.body).toHaveProperty('department');
        expect(res.body).toHaveProperty('priority');
    });

});
