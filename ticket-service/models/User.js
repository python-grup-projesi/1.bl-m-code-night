const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'support', 'department', 'admin'], 
        default: 'student'
    },
    // YENİ ALAN: Kullanıcının çalıştığı departman (Öğrenciyse boş kalabilir)
    department: {
        type: String, 
        default: null 
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);