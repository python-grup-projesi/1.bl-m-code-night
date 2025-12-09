import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Varsayılan rol öğrenci
  const [role, setRole] = useState("student"); 
  // Varsayılan departman (Sadece personel seçerse kullanılacak)
  const [department, setDepartment] = useState("Bilgi İşlem"); 
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Backend'e gönderilecek veriyi hazırlayalım
      const registerData = {
        name,
        email,
        password,
        role,
        // Eğer rol 'student' ise departman bilgisi gönderme (null olsun)
        // Değilse seçilen departmanı gönder
        department: role === 'student' ? null : department
      };

      await axios.post("http://localhost:5000/api/auth/register", registerData);
      
      alert("Kayıt Başarılı! ✅ Giriş yapabilirsiniz.");
      navigate("/login"); 
    } catch (err) {
      console.error(err);
      alert("Kayıt olunamadı! (E-posta kullanılıyor olabilir veya sunucu kapalı)");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Hesap Oluştur</h2>
        
        {/* BİLGİLENDİRME NOTU */}
        <div style={{fontSize:"13px", color:"#856404", background:"#fff3cd", padding:"10px", borderRadius:"5px", marginBottom:"15px", border:"1px solid #ffeeba"}}>
           📢 <strong>Not:</strong> Test amaçlı olarak rol seçimi açıktır. Normalde sadece öğrenci kaydı alınır.
        </div>

        <form onSubmit={handleRegister}>
          
          <input 
            type="text" 
            placeholder="Adınız Soyadınız" 
            className="auth-input"
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          
          <input 
            type="email" 
            placeholder="E-posta Adresi" 
            className="auth-input"
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          
          <input 
            type="password" 
            placeholder="Şifre Belirleyin" 
            className="auth-input"
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />

          {/* ROL SEÇİMİ */}
          <div style={{textAlign:"left", marginBottom:"15px"}}>
            <label style={{fontSize:"12px", fontWeight:"bold", color:"#555", marginBottom:"5px", display:"block"}}>Rolünüz:</label>
            <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="auth-input"
                style={{background:"#f0f8ff", border:"1px solid #007bff", cursor:"pointer"}}
            >
                <option value="student">Öğrenci (Student)</option>
                <option value="support">Destek Personeli (Support)</option>
                <option value="department">Departman Yetkilisi</option>
                <option value="admin">Yönetici (Admin)</option>
            </select>
          </div>

          {/* DEPARTMAN SEÇİMİ (Sadece Öğrenci Değilse Görünür) */}
          {role !== 'student' && (
             <div style={{textAlign:"left", marginBottom:"15px", animation: "fadeIn 0.5s"}}>
                <label style={{fontSize:"12px", fontWeight:"bold", color:"#555", marginBottom:"5px", display:"block"}}>Çalıştığınız Departman:</label>
                <select 
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)} 
                    className="auth-input" 
                    style={{background:"#fff3cd", border:"1px solid #ffc107", cursor:"pointer"}}
                >
                    <option value="Bilgi İşlem">Bilgi İşlem (IT)</option>
                    <option value="Öğrenci İşleri">Öğrenci İşleri</option>
                    <option value="Yapı İşleri">Yapı İşleri / Teknik</option>
                    <option value="Kütüphane">Kütüphane</option>
                    <option value="Yemekhane">Yemekhane</option>
                </select>
             </div>
          )}

          <button type="submit" className="auth-btn">KAYIT OL</button>
        </form>

        <Link to="/login" className="auth-link">
          Zaten hesabın var mı? <span>Giriş Yap</span>
        </Link>
      </div>
    </div>
  );
}