const router = require('express').Router();
const axios = require('axios'); // Agent Service ile iletişim için
const Ticket = require('../models/Ticket');
const User = require('../models/User');

// Servisleri Çağırıyoruz
const { sendNotificationEmail } = require('../services/emailService');

/**
 * @swagger
 * tags:
 * name: Tickets
 * description: Destek talebi yönetim işlemleri
 */

// 1. YENİ TICKET OLUŞTURMA (AGENT SERVICE TETİKLEMELİ 🤖)
router.post('/', async (req, res) => {
    try {
        let { student, title, description, priority, department } = req.body;

        // 1. Ticket'ı "Ham" haliyle kaydet 
        const newTicket = new Ticket({
            student,
            title,
            description,
            priority: priority || "Low", 
            department: department || "İşleniyor..." 
        });

        const savedTicket = await newTicket.save();

        // 2. Yanıtı hemen kullanıcıya dön (Hızlı tepki için)
        res.status(200).json(savedTicket);

        // 3. ARKA PLANDA: Ajan Servisini Tetikle 🔥
        const AGENT_URL = process.env.AGENT_SERVICE_URL || "http://localhost:5001/api/agent/process";
        const SHARED_SECRET = process.env.AGENT_SHARED_SECRET || "super_gizli_anahtar_42"; // <-- Shared Secret alınıyor

        console.log(`📡 Ajan servisine iş gönderiliyor... ID: ${savedTicket._id}`);

        // Güvenlik Başlığı Eklendi (Authorization header)
        axios.post(AGENT_URL, {
            ticketId: savedTicket._id,
            description: description,
            title: title,
            studentId: student
        }, {
            headers: { 
                'Authorization': `Bearer ${SHARED_SECRET}` // <-- Güvenlik Anahtarı ile iletişim
            }
        }).catch(err => {
            console.error("⚠️ Ajan servisine ulaşılamadı:", err.message);
        });

    } catch (err) {
        console.error("Ticket Oluşturma Hatası:", err);
        res.status(500).json(err);
    }
});

/**
 * @swagger
 * /api/tickets:
 * get:
 * summary: Ticketları listeler (Role göre filtrelenmiş)
 * tags: [Tickets]
 * parameters:
 * - in: query
 * name: userId
 * schema:
 * type: string
 * required: true
 * description: İstek yapan kullanıcının ID'si
 * responses:
 * 200:
 * description: Ticket listesi
 */
// 2. TICKETLARI LİSTELE (Kişiye, Role ve Departmana Göre)
router.get('/', async (req, res) => {
    const userId = req.query.userId; 

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json("Kullanıcı bulunamadı");

        let tickets;

        if (user.role === 'student') {
            // ÖĞRENCİ: Sadece kendi ticketları
            tickets = await Ticket.find({ student: userId })
                                  .populate('student', 'name email');
        
        } else if (user.role === 'department' || user.role === 'support') {
            // PERSONEL: Sadece kendi DEPARTMANINA gelenler
            tickets = await Ticket.find({ department: user.department })
                                  .populate('student', 'name email');
        
        } else {
            // ADMIN: Hepsi
            tickets = await Ticket.find()
                                  .populate('student', 'name email');
        }

        res.status(200).json(tickets);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 3. TEK BİR TICKET GETİR
router.get('/:id', async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
                                   .populate('student', 'name email')
                                   .populate('assignedTo', 'name'); 
        res.status(200).json(ticket);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 4. TICKET GÜNCELLEME (BİLDİRİM SİSTEMİ DAHİL 📧)
router.put('/:id', async (req, res) => {
    try {
        // Eski halini bul (Durum değişti mi kontrolü için)
        const oldTicket = await Ticket.findById(req.params.id);

        // Güncelle
        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id, 
            { $set: req.body }, 
            { new: true }
        ).populate('student', 'name email'); // Mail atmak için öğrenci bilgisini al

        // BİLDİRİM MANTIĞI: Durum değiştiyse VE (Resolved veya Closed) olduysa
        if (oldTicket.status !== updatedTicket.status && 
           (updatedTicket.status === 'Resolved' || updatedTicket.status === 'Closed')) {
            
            console.log("🔔 Durum 'Çözüldü' olarak değişti, mail atılıyor...");
            
            // Mail gönder
            await sendNotificationEmail(
                updatedTicket.student.email,
                updatedTicket.title,
                updatedTicket._id,
                updatedTicket.status
            );
        }

        res.status(200).json(updatedTicket);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// 5. AI ASİSTAN (Özet ve Cevap Taslağı) - Bu rota artık Agent Service'e yönlendirilmelidir
router.post('/ai-assist', async (req, res) => {
    try {
        // AI Asistan işini de Agent Service'e delege ediyoruz (Daha temiz bir mimari)
        const AGENT_ASSIST_URL = process.env.AGENT_SERVICE_URL ? 
                                 process.env.AGENT_SERVICE_URL.replace('/process', '/ai-summary') : 
                                 "http://localhost:5001/api/agent/ai-summary";

        const SHARED_SECRET = process.env.AGENT_SHARED_SECRET || "super_gizli_anahtar_42";

        // Güvenli şekilde Agent Service'e isteği yönlendir
        const response = await axios.post(AGENT_ASSIST_URL, req.body, {
            headers: { 
                'Authorization': `Bearer ${SHARED_SECRET}`
            }
        }); 

        res.status(200).json(response.data);

    } catch (err) {
        console.error("AI Asistan Hatası:", err.message);
        // Fallback: Ajan çökerse, basit bir hata mesajı dön.
        res.status(500).json({ summary: "Ajan hizmeti meşgul.", reply: "Lütfen manuel olarak özetleyin." });
    }
});

module.exports = router;