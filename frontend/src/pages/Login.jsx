import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("user", JSON.stringify(res.data));
      navigate("/");
    } catch (err) {
      alert("Hata: Şifre veya Email yanlış!");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">CampuSupport Giriş</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="email" placeholder="E-posta" className="auth-input"
            onChange={(e) => setEmail(e.target.value)} required 
          />
          <input 
            type="password" placeholder="Şifre" className="auth-input"
            onChange={(e) => setPassword(e.target.value)} required 
          />
          
          <div style={{textAlign: "right", marginBottom: "15px"}}>
            <Link to="/forgot-password" style={{fontSize: "13px", color: "#666", textDecoration: "none"}}>
              Şifremi Unuttum?
            </Link>
          </div>

          <button type="submit" className="auth-btn">GİRİŞ YAP</button>
        </form>

        <Link to="/register" className="auth-link">
          Hesabın yok mu? <span>Kayıt Ol</span>
        </Link>
      </div>
    </div>
  );
}