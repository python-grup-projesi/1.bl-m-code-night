const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
require('dotenv').config();
const { withRetry } = require('../utils/retry'); // <-- YENİ: Tekrar Deneme Mekanizması

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Shared Secret'i ortam değişkeninden al (Güvenlik İsteri 14)
const SHARED_SECRET = process.env.AGENT_SHARED_SECRET || "super_gizli_anahtar_42"; 

// --- 📅 MOCK CALENDAR (Sanal Takvim Verisi) ---
const mockCalendar = [
    { time: "09:00", available: true },
    { time: "10:00", available: false }, // Dolu
    { time: "11:00", available: true },
    { time: "14:00", available: false }, // Dolu
    { time: "15:00", available: true }
];

// --- 🤖 AI ANALİZ FONKSİYONU ---
async function analyzeWithAI(description, history) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `
            Sen bir Kampüs Destek Orkestratörüsün.
            
            Şikayet: "${description}"
            Kullanıcı Geçmişi: "${history}"
            
            Görevin:
            1. Bu sorunu çözecek EN DOĞRU sanal birimi seç: 
               ("Network Birimi", "LMS Destek", "Donanım Servisi", "Kampüs Yaşam", "Akademik Danışman").
            2. Öncelik belirle (Low, Medium, High).
            3. Kategori "Randevu" içeriyorsa belirt.
            
            Cevabı SADECE şu JSON formatında ver:
            { "assignedUnit": "Birim Adı", "priority": "Öncelik", "isAppointment": true/false }
        `;
        
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();
        return JSON.parse(text);
    } catch (err) {
        console.error("[LOG] AI Analiz Hatası:", err.message);
        return { assignedUnit: "Genel Destek (Fallback)", priority: "Medium", isAppointment: false };
    }
}

// --- ⚙️ ANA İŞLEM FONKSİYONU (PROCESS) ---
const processTicket = async (req, res) => {
    const { ticketId, description, studentId, title } = req.body;
    
    console.log(`\n🤖 Ajan Tetiklendi! Ticket ID: ${ticketId}`);

    // Cevabı hemen dönelim ki Ticket Service beklemesin
    res.status(200).json({ message: "İşlem başlatıldı" });

    try {
        // ADIM 1: Kullanıcı Geçmişini Sorgula
        let historyInfo = "İlk kayıt.";
        try {
            // GET isteğinde de güvenlik başlığı gönderiliyor
            const historyRes = await axios.get(`${process.env.TICKET_SERVICE_URL}/tickets?userId=${studentId}`, {
                headers: { 'Authorization': `Bearer ${SHARED_SECRET}` }
            });
            if (historyRes.data.length > 0) {
                historyInfo = `Kullanıcının ${historyRes.data.length} eski kaydı var.`;
            }
            console.log("[LOG] Kullanıcı geçmişi alındı.");
        } catch (err) {
            console.log("[LOG] Geçmiş alınamadı, devam ediliyor.");
        }

        // ADIM 2: AI Analizi Yap
        const aiDecision = await analyzeWithAI(description, historyInfo);
        console.log("🧠 AI Kararı:", aiDecision);

        // ADIM 3: Takvim Kontrolü
        let extraMessage = "";
        if (aiDecision.isAppointment || description.toLowerCase().includes("randevu")) {
            const slots = mockCalendar.filter(s => s.available).map(s => s.time).join(", ");
            extraMessage = `\n📅 MÜSAİT RANDEVU SAATLERİ: ${slots}. Lütfen birini seçip cevap yazınız.`;
            console.log("[LOG] Randevu slotları kontrol edildi.");
        }

        // ADIM 4: Ticket'ı Güncelle (PUT) - RETRY VE GÜVENLİK
        await withRetry(async () => {
            console.log(">> Ticket güncelleme işlemi başlatıldı.");
            await axios.put(`${process.env.TICKET_SERVICE_URL}/tickets/${ticketId}`, {
                priority: aiDecision.priority,
                department: aiDecision.assignedUnit,
                status: "In Progress"
            }, {
                headers: { 'Authorization': `Bearer ${SHARED_SECRET}` }
            });
            console.log(">> Ticket başarıyla güncellendi.");
        }, 3); 

        // ADIM 5: Yorum Olarak Bilgi Ver (POST) - RETRY VE GÜVENLİK
        const agentMessage = `Merhaba, ben Destek Ajanı 🤖.\nTalebiniz incelendi ve **${aiDecision.assignedUnit}** birimine yönlendirildi.\nÖncelik Seviyesi: ${aiDecision.priority}${extraMessage}`;

        await withRetry(async () => {
            console.log(">> Yorum ekleme işlemi başlatıldı.");
            await axios.post(`${process.env.TICKET_SERVICE_URL}/comments`, {
                ticketId: ticketId,
                text: agentMessage,
                user: studentId
            }, {
                headers: { 'Authorization': `Bearer ${SHARED_SECRET}` }
            });
            console.log(">> Yorum başarıyla eklendi.");
        }, 3); 

        console.log("✅ Ajan Görevi Başarıyla Tamamladı!");

    } catch (error) {
        // Retry denemelerinden sonra dahi hata olursa (Graceful Fail)
        console.error("❌ Ajan İşlem Hatası (GRACEFUL FAIL): Kritik adımlar başarısız oldu.");
        console.error("Hata Detayı:", error.message);
    }
};

module.exports = { processTicket };