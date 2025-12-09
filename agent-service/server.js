// agent-service/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

dotenv.config();

const app = express();
app.use(express.json());

// CORS – frontend portunu .env’den al (yoksa hepsine izin verir)
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: false,
  })
);

// ----- OpenAI -----
const apiKey = process.env.OPENAI_API_KEY;
let openai = null;
if (apiKey) {
  openai = new OpenAI({ apiKey });
  console.log('🧠 OpenAI etkin.');
} else {
  console.log('⚠️ OpenAI anahtarı yok. Heuristic (mock) modda çalışılacak.');
}

// ----- Basit log middleware -----
app.use((req, _res, next) => {
  console.log(`📩 ${req.method} ${req.url}`);
  next();
});

// ----- Health -----
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ----- Heuristic sınıflandırma (OpenAI yoksa kullanılır) -----
function heuristicClassify(description = '') {
  const t = (description || '').toLowerCase();

  let category = 'general';
  let unit = 'Helpdesk';

  if (t.includes('wifi') || t.includes('internet') || t.includes('ağ')) {
    category = 'network';
    unit = 'Network';
  } else if (t.includes('lms') || t.includes('ödev') || t.includes('ders')) {
    category = 'lms';
    unit = 'LMS';
  } else if (t.includes('donanım') || t.includes('bilgisayar') || t.includes('printer')) {
    category = 'hardware';
    unit = 'Donanım';
  } else if (t.includes('randevu') || t.includes('danışman')) {
    category = 'advising';
    unit = 'StudentAffairs';
  }

  const priority =
    t.includes('acil') || t.includes('urgent') || t.includes('çok yavaş') ? 'High' : 'Medium';

  const summary = `Kategori: ${category}, Öncelik: ${priority}, Birim: ${unit}`;
  const draftReply = `Talebiniz ${unit} birimine yönlendirildi (kategori: ${category}). Öngörülen SLA: ${
    priority === 'High' ? '12 saat' : '24 saat'
  }.`;

  return { category, priority, unit, summary, draftReply };
}

// ----- OpenAI tabanlı sınıflandırma -----
async function aiClassify(description = '', title = '') {
  // OpenAI yoksa heuristic
  if (!openai) return heuristicClassify(description);

  // Model adı değiştirilebilir
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const prompt = `
Aşağıdaki destek talebini sınıflandır ve JSON döndür.
Alanlar: category (network|lms|hardware|advising|general), priority (High|Medium|Low),
unit (Network|LMS|Donanım|StudentAffairs|Helpdesk), summary (kısa Türkçe),
draftReply (Türkçe, nazik, SLA belirt).

Sadece geçerli JSON ver:
{
  "category": "...",
  "priority": "...",
  "unit": "...",
  "summary": "...",
  "draftReply": "..."
}

Başlık: ${title || '-'}
Açıklama: ${description}
`.trim();

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'Kıdemli bir destek ajanısın. Sadece geçerli JSON döndür.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
  });

  const content = completion.choices?.[0]?.message?.content || '';
  try {
    const parsed = JSON.parse(content);
    // Alan adlarını garanti altına al
    const { category, priority, unit, summary, draftReply } = parsed;
    if (!category || !priority || !unit) throw new Error('Eksik alan');
    return {
      category,
      priority,
      unit,
      summary: summary || `Kategori: ${category}, Öncelik: ${priority}, Birim: ${unit}`,
      draftReply:
        draftReply ||
        `Talebiniz ${unit} birimine yönlendirildi (kategori: ${category}). Öngörülen SLA: 24 saat.`,
    };
  } catch (e) {
    console.warn('⚠️ OpenAI JSON parse edilemedi, heuristic kullanılacak. İçerik:', content);
    return heuristicClassify(description);
  }
}

// ----- ROTA 1: Otomatik işlem (ack) -----
app.post('/api/agent/process', (req, res) => {
  console.log('🤖 Otomatik ajan tetiklendi (arka plan simülasyon).');
  // Burada isterseniz kuyruğa job atabilirsiniz.
  res.status(200).json({ ok: true, message: 'İşlem kuyruğa alındı.' });
});

// ----- ROTA 2: Manuel analiz (classify) – FRONTEND/PROXY için ana endpoint -----
app.post('/api/agent/classify', async (req, res) => {
  try {
    const { description, title } = req.body || {};
    if (!description || !String(description).trim()) {
      return res.status(400).json({ error: 'description zorunlu' });
    }

    const result = await aiClassify(description, title);

    // Frontend/ticket-service proxy’nin beklediği alan adları
    return res.json({
      summary: result.summary,
      draftReply: result.draftReply,
      category: result.category,
      priority: result.priority,
      unit: result.unit,
    });
  } catch (err) {
    console.error('❌ classify error:', err?.message || err);
    return res.status(500).json({ error: 'AI sınıflandırma hatası' });
  }
});

// ----- ROTA 3: Senin eski isminle uyumluluk (/ai-summary) -----
app.post('/api/agent/ai-summary', async (req, res) => {
  try {
    const { title, description } = req.body || {};
    if (!description || !String(description).trim()) {
      return res.status(400).json({ error: 'description zorunlu' });
    }

    const result = await aiClassify(description, title);

    // Geriye uyumluluk: suggestedReply + draftReply birlikte
    return res.json({
      summary: result.summary,
      suggestedReply: result.draftReply,
      draftReply: result.draftReply,
      category: result.category,
      priority: result.priority,
      unit: result.unit,
    });
  } catch (error) {
    console.error('❌ ai-summary error:', error?.message || error);
    return res
      .status(500)
      .json({ summary: 'Hata', suggestedReply: 'AI servisine ulaşılamadı.', error: true });
  }
});

// ----- Sunucu -----
const PORT = Number(process.env.PORT || 5001);
app.listen(PORT, () => {
  console.log(`✅ Agent Service çalışıyor: http://localhost:${PORT}`);
});
