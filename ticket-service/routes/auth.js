const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- KAYIT OLMA (REGISTER) ---
router.post('/register', async (req, res) => {
    try {
        // 1. Gelen verileri kontrol et
        if (!req.body.name || !req.body.email || !req.body.password) {
            return res.status(400).json("Eksik bilgi girdiniz!");
        }

        // 2. Şifreleme (Hashing)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // 3. Yeni Kullanıcı Oluşturma
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            
            // ROL SEÇİMİ: Frontend'den gelen rolü al, yoksa 'student' yap
            role: req.body.role || 'student',

            // DEPARTMAN SEÇİMİ (YENİ): 
            // Eğer personel departman seçtiyse kaydet, seçmediyse (öğrenciyse) null olsun.
            department: req.body.department || null
        });

        // 4. Veritabanına Kaydetme
        const user = await newUser.save();
        res.status(200).json(user);

    } catch (err) {
        console.log("KAYIT HATASI:", err);
        // Eğer email zaten varsa Mongo hata verir (code 11000)
        if (err.code === 11000) {
            return res.status(500).json("Bu email adresi zaten kullanılıyor.");
        }
        res.status(500).json(err);
    }
});

// --- GİRİŞ YAPMA (LOGIN) ---
router.post('/login', async (req, res) => {
    try {
        // 1. Kullanıcıyı bul
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json("Kullanıcı bulunamadı!");

        // 2. Şifreyi kontrol et
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).json("Şifre yanlış!");

        // 3. Token oluştur (Kimlik Kartı)
        // Token içine ID ve ROL bilgisini gizliyoruz
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || "gizlisifre", // .env dosyası yoksa yedek şifre
            { expiresIn: "3d" }
        );

        // 4. Kullanıcı bilgilerini (şifre hariç) ve token'ı gönder
        // Frontend tarafında kullanıcının departmanını da bilmesi için user bilgilerini tam gönderiyoruz
        const { password, ...others } = user._doc;
        res.status(200).json({ ...others, token });
        
    } catch (err) {
        console.log("GİRİŞ HATASI:", err);
        res.status(500).json(err);
    }
});

module.exports = router;