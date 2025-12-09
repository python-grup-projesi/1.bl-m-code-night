const nodemailer = require("nodemailer");

// E-posta Gönderme Fonksiyonu
const sendNotificationEmail = async (to, ticketTitle, ticketId, status) => {
  try {
    // 1. Test hesabı oluştur (Ethereal Email - Sahte Sunucu)
    // Gerçek projede buraya Gmail/Outlook SMTP ayarları girilir.
    let testAccount = await nodemailer.createTestAccount();

    // 2. Taşıyıcıyı (Postacıyı) ayarla
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // Ethereal otomatik kullanıcı
        pass: testAccount.pass, // Ethereal otomatik şifre
      },
    });

    // 3. Maili Gönder
    let info = await transporter.sendMail({
      from: '"CampuSupport Sistemi" <destek@campusupport.com>', // Gönderen
      to: to, // Alıcı (Öğrencinin maili)
      subject: `📢 Ticket Durum Güncellemesi: ${status}`, // Konu
      text: `Merhaba,\n\n"${ticketTitle}" başlıklı (ID: ${ticketId}) destek talebinizin durumu güncellendi.\n\nYeni Durum: ${status}\n\nDetaylar için sisteme giriş yapabilirsiniz.\n\nCampuSupport Ekibi`, // İçerik
      html: `
        <h3>Ticket Güncellemesi</h3>
        <p>Merhaba,</p>
        <p><strong>"${ticketTitle}"</strong> başlıklı destek talebinizin durumu değişti.</p>
        <p>Yeni Durum: <strong style="color:blue">${status}</strong></p>
        <p><i>Ticket ID: ${ticketId}</i></p>
        <br>
        <p>CampuSupport Ekibi</p>
      `,
    });

    console.log("📨 Mail Gönderildi! ID: %s", info.messageId);
    // ÖNEMLİ: Test mailini görebilmen için terminale link basıyoruz
    console.log("🔗 Maili Görüntülemek İçin Tıkla: %s", nodemailer.getTestMessageUrl(info));

  } catch (error) {
    console.error("Mail Gönderme Hatası:", error);
  }
};

module.exports = { sendNotificationEmail };