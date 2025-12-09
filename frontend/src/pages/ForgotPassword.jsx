import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleReset = (e) => {
    e.preventDefault();
    // Buraya ileride backend kodu gelecek
    alert(`Şifre sıfırlama linki ${email} adresine gönderildi! (Simülasyon)`);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Şifremi Unuttum</h2>
        <p style={{color:"#666", marginBottom:"20px", fontSize:"14px"}}>
          E-posta adresinizi girin, size sıfırlama linki gönderelim.
        </p>
        <form onSubmit={handleReset}>
          <input 
            type="email" placeholder="E-posta Adresi" className="auth-input"
            onChange={(e) => setEmail(e.target.value)} required 
          />
          <button type="submit" className="auth-btn">LİNK GÖNDER</button>
        </form>
        <Link to="/login" className="auth-link">
          Giriş ekranına <span>Geri Dön</span>
        </Link>
      </div>
    </div>
  );
}