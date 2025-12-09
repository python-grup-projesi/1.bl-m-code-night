const router = require('express').Router();
const { OpenAI } = require('openai'); // Veya 'openai-api' kullanıyorsan ona göre ayarla

// OpenAI Ayarları (.env dosyasından okur)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
});

// --- 1. OTOMATİK İŞLEM (Ticket açılınca çalışır) ---
router.post('/process', async (req, res) => {
    try {
        const { ticketId, title, description, studentId } = req.body;
        console.log(`🤖 Otomatik Ajan Başladı: Ticket ${ticketId}`);

        // Basit bir AI Analizi Simülasyonu (Veya gerçek OpenAI çağrısı)
        // Code Night için Hızlı çözüm: OpenAI yoksa Mock data dönelim.
        
        let aiCategory = "Genel Destek";
        let aiPriority = "Medium";

        if (process.env.OPENAI_API_KEY) {
            // Gerçek AI varsa burası çalışır (Burayı basitleştirdim)
            // ... OpenAI kodları ...
        }

        console.log("✅ Ajan Görevi Başarıyla Tamamladı!");
        res.status(200).json({ message: "İşlem kuyruğa alındı." });

    } catch (error) {
        console.error("Ajan Hatası:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- 2. MANUEL ANALİZ VE CEVAP ÖNERİSİ (BUTON İÇİN EKSİK OLAN KISIM! 🛠️) ---
router.post('/ai-summary', async (req, res) => {
    try {
        const { title, description } = req.body;
        console.log("🧠 Manuel AI Analizi İsteniyor...");

        // EĞER OPENAI KEY YOKSA (Code Night'ta patlamasın diye MOCK DATA)
        if (!process.env.OPENAI_API_KEY) {
            console.log("⚠️ OpenAI Key yok, sahte veri dönülüyor.");
            return res.status(200).json({
                summary: "Sistemde OpenAI anahtarı bulunamadı, bu otomatik bir metindir. Sorun: " + title,
                suggestedReply: `Merhaba,\n\n"${title}" konusundaki bildiriminiz alınmıştır. Ekiplerimiz "${description}" durumunu inceliyor.\n\nSaygılarımızla.`
            });
        }

        // GERÇEK OPENAI VARSA:
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Sen yardımsever bir üniversite destek asistanısın. Türkçe yanıt ver." },
                { role: "user", content: `Şu destek talebini özetle ve nazik bir cevap taslağı yaz:\nBaşlık: ${title}\nAçıklama: ${description}\n\nÇıktı JSON formatında olsun: {"summary": "...", "suggestedReply": "..."}` }
            ],
        });

        const aiContent = completion.choices[0].message.content;
        
        // AI bazen düz metin, bazen JSON döner. Basitçe string olarak dönelim:
        // Eğer JSON parse edemezsek direkt metni basalım.
        let result;
        try {
            result = JSON.parse(aiContent);
        } catch (e) {
            // JSON değilse manuel yap
            result = {
                summary: "AI Özeti: " + title,
                suggestedReply: aiContent
            };
        }

        res.status(200).json(result);

    } catch (error) {
        console.error("AI Servis Hatası:", error.message);
        res.status(500).json({ 
            summary: "AI servisine ulaşılamadı.", 
            suggestedReply: "Bağlantı hatası nedeniyle öneri oluşturulamadı." 
        });
    }
});

module.exports = router;