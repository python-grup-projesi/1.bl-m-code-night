const router = require('express').Router();
const User = require('../models/User');

// Sadece belirli bir roldeki kullanıcıları getir (Örn: ?role=support)
router.get('/', async (req, res) => {
    const role = req.query.role;
    try {
        // Eğer rol belirtildiyse filtrele, yoksa hepsini getir
        const query = role ? { role: role } : {};
        
        // Şifreleri gönderme! Sadece isim, email ve ID yeterli via .select()
        const users = await User.find(query).select('name email role');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;