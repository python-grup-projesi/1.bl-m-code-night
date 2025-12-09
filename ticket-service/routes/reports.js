const router = require('express').Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');

// GENEL RAPORLARI GETİR
router.get('/', async (req, res) => {
    try {
        // 1. Genel Sayılar
        const totalTickets = await Ticket.countDocuments();
        const openTickets = await Ticket.countDocuments({ status: 'Open' });
        const resolvedTickets = await Ticket.countDocuments({ status: 'Resolved' });
        const closedTickets = await Ticket.countDocuments({ status: 'Closed' });

        // 2. Personel Performansı (Kimin üzerinde kaç iş var?)
        // MongoDB'nin "Aggregate" özelliği ile gruplama yapıyoruz
        const staffPerformance = await Ticket.aggregate([
            { $match: { assignedTo: { $ne: null } } }, // Sadece atanmışları al
            { $group: { _id: "$assignedTo", taskCount: { $sum: 1 } } }, // Kişiye göre grupla ve say
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } }, // İsimleri User tablosundan al
            { $unwind: "$user" },
            { $project: { name: "$user.name", count: "$taskCount" } } // Sadece isim ve sayıyı göster
        ]);

        res.status(200).json({
            stats: { totalTickets, openTickets, resolvedTickets, closedTickets },
            staffPerformance
        });

    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;