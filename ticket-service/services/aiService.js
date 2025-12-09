const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// API Anahtarı ile kurulum
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Kategori ve Öncelik Tahmin Eden Fonksiyon
async function suggestCategoryAndPriority(description) {
  try {
    // Gemini modelini seçiyoruz
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Yapay Zekaya ne yapması gerektiğini söylüyoruz (Prompt)
    const prompt = `
      Sen bir teknik destek asistanısın. Aşağıdaki kullanıcı şikayetini analiz et.
      
      Şikayet: "${description}"
      
      Görevin:
      1. Bu şikayet için en uygun departmanı seç: "Bilgi İşlem", "Yemekhane", "Öğrenci İşleri", "Yapı İşleri", "Kütüphane".
      2. Öncelik seviyesini belirle: "Low", "Medium", "High".
      
      Cevabı SADECE şu JSON formatında ver, başka hiçbir şey yazma:
      {
        "department": "Seçilen Departman",
        "priority": "Seçilen Öncelik"
      }
    `;

    // AI'dan cevap al
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Gelen cevabı temizleyip (bazen tırnak işareti ekler) JSON'a çeviriyoruz
    const cleanedText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("AI Hatası:", error);
    // Hata olursa varsayılan değer dönelim ki sistem çökmesin
    return { department: "Bilgi İşlem", priority: "Medium" };
  }
}

module.exports = { suggestCategoryAndPriority };