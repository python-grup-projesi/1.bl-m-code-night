import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Home() {
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  
  // Form Verileri
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(""); 
  const [department, setDepartment] = useState(""); 

  const [loading, setLoading] = useState(false);

  // 🛠️ FİLTRELEME VE ARAMA STATE'LERİ
  const [filterStatus, setFilterStatus] = useState("All"); 
  const [searchTerm, setSearchTerm] = useState(""); 

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Sayfa ilk açıldığında verileri çek
      fetchTickets(parsedUser._id, "All", ""); 
    }
  }, [navigate]);

  // 🔄 FİLTRE DEĞİŞİNCE OTOMATİK ÇALIŞIR
  useEffect(() => {
    if (user) {
        fetchTickets(user._id, filterStatus, searchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]); // Sadece filterStatus değişince tetiklenir

  // --- API'YE İSTEK ATAN ANA FONKSİYON ---
  const fetchTickets = async (userId, status, search) => {
    try {
      // URL'i dinamik oluşturuyoruz
      let url = `http://localhost:5000/api/tickets?userId=${userId}`;
      
      // Eğer 'All' değilse status parametresini ekle
      if (status && status !== "All") {
        url += `&status=${status}`;
      }
      
      // Arama kelimesi varsa ekle
      if (search) {
        url += `&search=${search}`;
      }

      console.log("📡 İstek Atılıyor:", url); // Tarayıcı konsolunda (F12) görebilirsin
      const res = await axios.get(url);
      setTickets(res.data);
    } catch (err) {
      console.error("Ticketlar çekilemedi:", err);
    }
  };

  // 🔍 ARA BUTONUNA BASINCA
  const handleSearchClick = () => {
    if (user) {
        fetchTickets(user._id, filterStatus, searchTerm);
    }
  };

  // Yeni Talep Oluşturma
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setLoading(true); 

    try {
      await axios.post("http://localhost:5000/api/tickets", {
        student: user._id,
        title,
        description,
        priority, 
        department 
      });

      alert("Ticket Başarıyla Oluşturuldu! " + ((department === "" || priority === "") ? "(AI Tarafından Analiz Edildi 🤖)" : "✅"));
      
      // Listeyi güncelle (Mevcut filtreleri koruyarak)
      fetchTickets(user._id, filterStatus, searchTerm);
      
      // Formu Temizle
      setTitle("");
      setDescription("");
      setPriority("");
      setDepartment("");
      
    } catch (err) {
      alert("Hata oluştu! Lütfen tekrar deneyin.");
      console.error(err);
    } finally {
      setLoading(false); 
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="container">
      
      {/* ÜST BAŞLIK */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{margin: 0}}>Hoş Geldin, {user.name} 👋</h1>
          <span style={{color: "#666", fontSize: "14px"}}>Rol: <strong>{user.role}</strong></span>
        </div>
        
        <div style={{display:"flex", gap:"10px"}}>
            {(user.role === 'admin' || user.role === 'support' || user.role === 'department') && (
              <button onClick={() => navigate("/analytics")} className="btn-primary" style={{background:"#6f42c1"}}>
                  📊 Raporlar
              </button>
            )}
            <button onClick={handleLogout} className="btn-danger">Çıkış Yap</button>
        </div>
      </div>

      {/* TICKET FORMU */}
      <div style={{ background: "#f8f9fa", padding: "25px", borderRadius: "12px", marginBottom: "30px", border: "1px solid #e9ecef" }}>
        <h3 style={{marginTop:0, marginBottom: "15px", color: "#333"}}>🤖 AI Destekli Yeni Talep</h3>
        
        <div style={{fontSize:"13px", background:"#e3f2fd", color:"#0d47a1", padding:"10px", borderRadius:"5px", marginBottom:"15px"}}>
           ℹ️ <strong>İpucu:</strong> Departman veya Öncelik seçmezseniz, Yapay Zeka (AI) yazdığınız soruna göre otomatik belirleyecektir.
        </div>

        <form onSubmit={handleCreateTicket}>
          <input 
            type="text" placeholder="Konu Başlığı (Örn: İnternet yok)" 
            value={title} onChange={(e) => setTitle(e.target.value)} required 
          />
          
          <div style={{display: "flex", gap: "15px", marginBottom:"15px"}}>
            <div style={{flex:1}}>
                <label style={{fontSize:"12px", fontWeight:"bold"}}>İlgili Departman:</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{margin:0}}>
                    <option value="">✨ Otomatik (AI Karar Versin)</option>
                    <option value="Bilgi İşlem">Bilgi İşlem (IT)</option>
                    <option value="Öğrenci İşleri">Öğrenci İşleri</option>
                    <option value="Yapı İşleri">Yapı İşleri / Teknik</option>
                    <option value="Kütüphane">Kütüphane</option>
                    <option value="Yemekhane">Yemekhane</option>
                </select>
            </div>
            
            <div style={{flex:1}}>
                <label style={{fontSize:"12px", fontWeight:"bold"}}>Öncelik:</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{margin:0}}>
                    <option value="">✨ Otomatik (AI)</option>
                    <option value="Low">Düşük</option>
                    <option value="Medium">Orta</option>
                    <option value="High">Yüksek 🔴</option>
                </select>
            </div>
          </div>

          <textarea 
            placeholder="Sorunu detaylı anlatın... (AI burayı okuyarak karar verecek)" 
            value={description} onChange={(e) => setDescription(e.target.value)} required 
            style={{ height: "100px", resize: "vertical" }} 
          />

          <button type="submit" className="btn-success" style={{width: "100%"}} disabled={loading}>
            {loading ? "🤖 AI Analiz Ediyor..." : "TALEBİ GÖNDER"}
          </button>
        </form>
      </div>

      {/* 🛠️ YENİ: FİLTRELEME ALANI */}
      <h3 style={{borderBottom: "2px solid #eee", paddingBottom: "10px", marginBottom: "15px"}}>📋 Taleplerim</h3>
      
      <div style={{ 
          display: "flex", 
          gap: "10px", 
          marginBottom: "20px", 
          background: "#fff", 
          padding: "15px", 
          borderRadius: "8px", 
          border: "1px solid #ddd",
          alignItems: "center"
      }}>
        
        {/* Durum Filtresi */}
        <div>
            <span style={{fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "5px"}}>Durum Filtresi:</span>
            <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: "160px", margin: 0, padding: "8px" }}
            >
                <option value="All">Tüm Durumlar</option>
                <option value="Open">Aktif (Open)</option>
                <option value="Solved">Çözüldü (Solved)</option>
                {/* Veritabanına göre Türkçe seçenekler */}
                <option value="Çözüldü">Çözüldü (TR)</option> 
                <option value="Beklemede">Beklemede</option>
            </select>
        </div>

        {/* Arama Kutusu */}
        <div style={{flex: 1}}>
            <span style={{fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "5px"}}>Arama Yap:</span>
            <div style={{display: "flex", gap: "5px"}}>
                <input 
                    type="text" 
                    placeholder="Başlık veya içerikte ara..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, margin: 0, padding: "8px" }}
                />
                <button className="btn-primary" onClick={handleSearchClick} style={{ margin: 0, padding: "8px 20px" }}>
                    🔍 Ara
                </button>
            </div>
        </div>
      </div>

      {/* LİSTELEME */}
      {tickets.length === 0 ? (
        <div style={{textAlign:"center", color:"#888", padding:"40px", background: "#f9f9f9", borderRadius: "8px"}}>
            <h4>🔍 Kayıt Bulunamadı</h4>
            <p>Filtre kriterlerinize uygun talep yok.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {tickets.map((ticket) => (
            <div key={ticket._id} className="ticket-card">
              <div className="ticket-header">
                <h4 style={{ margin: "0", fontSize: "18px" }}>{ticket.title}</h4>
                <span className={`status-badge status-${ticket.priority}`}>{ticket.priority}</span>
              </div>
              <p style={{fontSize:"13px", color:"#666"}}>Departman: <strong>{ticket.department}</strong></p>
              <p style={{ margin: "10px 0 20px 0", color: "#555" }}>{ticket.description}</p>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #eee", paddingTop: "15px" }}>
                <span style={{ fontSize: "13px", color: "#555" }}>
                    Durum: <strong style={{
                        color: (ticket.status === 'Solved' || ticket.status === 'Çözüldü') ? '#28a745' : '#ffc107',
                        border: "1px solid #ddd",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        backgroundColor: "#fff"
                    }}>
                        {ticket.status}
                    </strong>
                </span>
                <button className="btn-primary" onClick={() => navigate(`/ticket/${ticket._id}`)}>
                    <span>İncele & Cevapla</span> 👉
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}