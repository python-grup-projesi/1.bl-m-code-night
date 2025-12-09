const router = require('express').Router();
const axios = require('axios');
const nodemailer = require('nodemailer');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

// --- MAIL AYARLARI ---
// NOT: Bu ayarlar daha önce gönderdiğin Gmail/Mock ayarlarına göre düzenlenmiştir.
// Gerçek projede bu bilgileri .env dosyasından okumalısın.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'seninmailin@gmail.com', // ⚠️ Placeholder
        pass: 'gmail_uygulama_sifresi' // ⚠️ Placeholder
    }
});

// 🛠️ YENİ: MAIL TEST ROTASI
// Sadece geliştirme ortamında mail ayarlarını test etmek için kullanılır.
router.get('/test-mail', async (req, res) => {
    try {
        await transporter.sendMail({
            from: 'Test Sistemi',
            to: 'seninmailin@gmail.com',
            subject: 'Sistem Test Maili',
            text: 'Eğer bunu görüyorsan mail ayarların DOĞRU çalışıyor demektir. ✅'
        });
        res.send("Mail başarıyla gönderildi!");
    } catch (error) {
        console.error("❌ Mail Hatası:", error);
        res.status(500).send("Mail gönderilemedi. Hata: " + error.message);
    }
});

// --- 1. TICKET OLUŞTURMA (POST) - 🔥 KRİTİK BAĞLANTI 🔥 ---
// --- 1. YENİ TICKET OLUŞTURMA (Gelişmiş Hata Logu) ---
router.post('/', async (req, res) => {
    // ⭐️ LOG 1: İsteğin ulaştığını onayla
    console.log("🚀 POST /api/tickets isteği alındı."); 
    try {
        const { student, title, description, priority, department } = req.body;

        // Gerekli alanların varlığını kontrol et (Ekstra güvenlik)
        if (!student || !title || !description) {
             console.error("❌ VALIDASYON HATASI: Başlık, Açıklama veya Öğrenci ID'si eksik.");
             return res.status(400).json({ message: "Başlık, Açıklama ve Öğrenci ID'si zorunludur." });
        }

        const newTicket = new Ticket({
            student: student, 
            title,
            description,
            priority: priority || "Low",
            department: department || "Genel",
            status: "Open"
        });

        const savedTicket = await newTicket.save();
        
        // 1. Yanıtı hemen dön (Kullanıcı beklemesin)
        res.status(201).json(savedTicket);

        // 2. ARKA PLAN: Otomatik Ajan Tetikleme (Fire & Forget)
        try {
            const AGENT_URL = "http://localhost:5001/api/agent/process";
            axios.post(AGENT_URL, {
                ticketId: savedTicket._id,
                title, description, studentId: student
            }).catch(err => console.log("⚠️ Arka plan ajanı çalışmadı (Önemli değil):", err.message));
        } catch (e) { /* Yoksay */ }

    } catch (err) {
        // 🚨 KRİTİK: Detaylı hata çıktısı
        console.error('------------------------------------------');
        console.error(`🚨 HATA TİPİ: ${err.name}`); 
        console.error(`🚨 HATA MESAJI: ${err.message}`);
        console.error('------------------------------------------');
        
        res.status(500).json({ message: "Talep kaydedilemedi. Lütfen sunucu loglarını kontrol edin." });
    }
});


// --- 2. TICKET LİSTELEME (GET /) - Rol Bazlı Filtreleme ---
router.get('/', async (req, res) => {
    try {
        const { userId, status, search } = req.query; 

        if (!userId) return res.status(400).json({ message: "userId zorunludur!" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Kullanıcı yok" });

        let query = {};

        // Rol Kontrolleri
        if (user.role === 'student') query.student = userId;
        else if ((user.role === 'support' || user.role === 'department') && user.department) {
            query.department = user.department.trim();
        }

        // Filtreleme
        if (status && status !== 'All' && status !== 'Tümü') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const tickets = await Ticket.find(query)
            .populate('student', 'name email')
            .sort({ createdAt: -1 });
        
        res.status(200).json(tickets);

    } catch (err) {
        console.error("HATA:", err);
        res.status(500).json({ message: err.message });
    }
});


// --- 3. TICKET GÜNCELLEME (PUT /:id) - Mail Tetikleme ---
router.put('/:id', async (req, res) => {
    try {
        const originalTicket = await Ticket.findById(req.params.id).populate('student');
        if (!originalTicket) return res.status(404).json({ message: "Talep yok" });

        const oldStatus = originalTicket.status;
        const newStatus = req.body.status;

        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id, 
            { $set: req.body }, 
            { new: true }
        ).populate('student');

        // Mail Tetikleme Mantığı: Eğer durum Çözüldü'ye geçerse mail at
        const isSolved = (newStatus === 'Resolved' || newStatus === 'Çözüldü');
        const wasSolved = (oldStatus === 'Resolved' || oldStatus === 'Çözüldü');

        if (isSolved && !wasSolved && updatedTicket.student && updatedTicket.student.email) {
            console.log("🚀 Durum 'Çözüldü' oldu! Mail gönderiliyor...");
            
            transporter.sendMail({
                from: 'Destek Ekibi',
                to: updatedTicket.student.email,
                subject: `Destek Talebiniz Çözüldü ✅`,
                text: `Merhaba, #${updatedTicket.title} konulu talebiniz çözüldü.`
            }, (err, info) => {
                if (err) console.error("❌ Mail Gönderilemedi:", err);
                else console.log("✅ Mail Başarıyla Gitti:", info.response);
            });
        }

        res.status(200).json(updatedTicket);
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- 4. TICKET DETAYI GETİR (GET /:id) ---
router.get('/:id', async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('student', 'name email')
            .populate('assignedTo', 'name email');
            
        if (!ticket) return res.status(404).json({ message: "Ticket bulunamadı" });
        res.status(200).json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// --- 5. MANUEL AI ASSIST ROTASI (FRONTEND İÇİN - 🔥 KRİTİK EKLEME 🔥) ---
router.post('/ai-assist', async (req, res) => {
    try {
        const { description } = req.body;
        
        // Agent Service'e manuel analiz isteği atıyoruz
        const agentResponse = await axios.post(`${process.env.AGENT_SERVICE_URL}/ai-summary`, {
            title: "Manuel Analiz İsteği",
            description: description
        }, {
            headers: { 'Authorization': `Bearer ${process.env.AGENT_SHARED_SECRET}` }
        });

        // Frontend'e beklediği formatta cevap dönüyoruz
        res.status(200).json({
            summary: agentResponse.data.summary,
            draftReply: agentResponse.data.suggestedReply
        });
    } catch (error) {
        console.error("AI Assist Hatası:", error.message);
        res.status(200).json({ 
            summary: "AI servisine ulaşılamadı.", 
            draftReply: "Manuel inceleme gerekiyor." 
        });
    }
});


module.exports = router;