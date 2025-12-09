const router = require('express').Router();
const { OpenAI } = require('openai'); // Eğer 'openai' paketi yüklüyse

// OpenAI Ayarları (.env'den okur, yoksa null)
const apiKey = process.env.OPENAI_API_KEY;
let openai = null;

if (apiKey) {
    openai = new OpenAI({ apiKey: apiKey });
}

// --- 1. OTOMATİK İŞLEM (Ticket açılınca arka planda çalışan) ---
router.post('/process', async (req, res) => {
    try {
        const { ticketId, title, description } = req.body;
        console.log(`🤖 Otomatik Ajan Tetiklendi: Ticket ${ticketId}`);

        // Buraya otomatik kategori/öncelik atama kodları gelir.
        // Şimdilik sadece log basıp geçiyoruz.

        res.status(200).json({ message: "İşlem kuyruğa alındı." });
    } catch (error) {
        console.error("Ajan Hatası:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- 2. MANUEL ANALİZ (Web sitesindeki BUTON için) ---
router.post('/ai-summary', async (req, res) => {
    try {
        const { title, description } = req.body;
        console.log("🧠 Manuel AI Analizi İsteniyor...");

        // SENARYO A: OpenAI Anahtarı YOKSA (Hata vermesin, sahte veri dönsün)
        if (!openai) {
            console.log("⚠️ OpenAI Key bulunamadı, Mock Data dönülüyor.");
            
            // Sanki AI cevap vermiş gibi davranıyoruz:
            return res.status(200).json({
                summary: "Otomatik Özet: " + title + " (OpenAI anahtarı eksik olduğu için bu bir demo metnidir.)",
                suggestedReply: `Sayın Öğrenci,\n\n"${description}" konusundaki talebiniz alınmıştır. İlgili birimlerimiz duruma en kısa sürede müdahale edecektir.\n\nSaygılarımızla, Destek Ekibi.`
            });
        }

        // SENARYO B: OpenAI Anahtarı VARSA (Gerçek Zeka)
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Sen yardımsever bir üniversite destek asistanısın. Türkçe yanıt ver." },
                { role: "user", content: `Şu destek talebini özetle ve cevap taslağı yaz. JSON formatında olsun: {"summary": "...", "suggestedReply": "..."}\n\nBaşlık: ${title}\nAçıklama: ${description}` }
            ],
        });

        const content = completion.choices[0].message.content;
        
        // Gelen veriyi JSON'a çevirmeyi dene
        let result;
        try {
            result = JSON.parse(content);
        } catch (e) {
            result = { summary: "AI Yanıtı", suggestedReply: content };
        }

        res.status(200).json(result);

    } catch (error) {
        console.error("AI Servis Hatası:", error.message);
        res.status(500).json({ 
            summary: "Hata oluştu.", 
            suggestedReply: "AI servisine bağlanılamadı. Lütfen manuel yanıtlayın." 
        });
    }
});

module.exports = router;