const router = require('express').Router();
const Comment = require('../models/Comment');

// 1. YORUM EKLEME (POST)
router.post('/', async (req, res) => {
    try {
        const newComment = new Comment(req.body);
        const savedComment = await newComment.save();
        // Yorum kaydedilince, yazan kişinin ismini de alıp geri gönderelim (Frontend için)
        const populatedComment = await Comment.findById(savedComment._id).populate('user', 'name role');
        res.status(200).json(populatedComment);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 2. BİR TICKET'A AİT YORUMLARI GETİRME (GET)
// Örnek: /api/comments/654abc... (Ticket ID'si ile çağıracağız)
router.get('/:ticketId', async (req, res) => {
    try {
        const comments = await Comment.find({ ticketId: req.params.ticketId })
                                      .populate('user', 'name role'); // Yazan kişinin ismini de getir
        res.status(200).json(comments);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;