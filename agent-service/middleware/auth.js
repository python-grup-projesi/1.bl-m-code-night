// agent-service/middleware/auth.js

const requireSecret = (req, res, next) => {
    const providedSecret = req.headers['authorization'];
    const expectedSecret = `Bearer ${process.env.AGENT_SHARED_SECRET}`;

    if (!providedSecret || providedSecret !== expectedSecret) {
        console.warn("❌ Yetkisiz Servis Erişimi Denemesi!");
        return res.status(401).json({ error: "Unauthorized Service Access" });
    }
    next();
};

module.exports = { requireSecret };