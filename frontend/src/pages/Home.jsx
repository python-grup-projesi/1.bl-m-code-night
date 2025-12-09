import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Home() {
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  
  // Form verileri (Varsayılan olarak boş bırakıyoruz ki AI devreye girsin)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(""); // Boş = AI
  const [department, setDepartment] = useState(""); // Boş = AI

  // Yükleniyor durumu (AI çalışırken butonu kilitlemek için)
  const [loading, setLoading] = useState(false);

  // Filtreleme State'leri
  const [filterStatus, setFilterStatus] = useState("All"); 
  const [sortOrder, setSortOrder] = useState("Newest");    

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchTickets(parsedUser._id); 
    }
  }, [navigate]);

  const fetchTickets = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tickets?userId=${userId}`);
      setTickets(res.data);
    } catch (err) {
      console.error("Ticketlar çekilemedi:", err);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setLoading(true); // Yükleniyor başlat

    try {
      // Backend'e gönderirken boş alanlar otomatik gidecek
      await axios.post("http://localhost:5000/api/tickets", {
        student: user._id,
        title,
        description,
        priority, // Eğer "" ise Backend'deki AI dolduracak
        department // Eğer "" ise Backend'deki AI dolduracak
      });

      alert("Ticket Başarıyla Oluşturuldu! " + ((department === "" || priority === "") ? "(AI Tarafından Analiz Edildi 🤖)" : "✅"));
      
      fetchTickets(user._id);
      
      // Formu Temizle
      setTitle("");
      setDescription("");
      setPriority("");
      setDepartment("");
      
    } catch (err) {
      alert("Hata oluştu! Lütfen tekrar deneyin.");
      console.error(err);
    } finally {
      setLoading(false); // İşlem bitince yükleniyor durdur
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // --- FİLTRELEME MANTIĞI ---
  const filteredTickets = tickets
    .filter((ticket) => {
      if (filterStatus === "All") return true;
      return ticket.status === filterStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "Priority") {
        const priorityMap = { High: 3, Medium: 2, Low: 1 };
        return priorityMap[b.priority] - priorityMap[a.priority];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

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

      {/* LİSTELEME */}
      <h3 style={{borderBottom: "2px solid #eee", paddingBottom: "10px"}}>📋 Taleplerim</h3>
      {/* ... Filtreler aynı kalıyor ... */}
      
      {filteredTickets.length === 0 ? <p style={{textAlign:"center", color:"#888", padding:"20px"}}>Ticket yok.</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {filteredTickets.map((ticket) => (
            <div key={ticket._id} className="ticket-card">
              <div className="ticket-header">
                <h4 style={{ margin: "0", fontSize: "18px" }}>{ticket.title}</h4>
                <span className={`status-badge status-${ticket.priority}`}>{ticket.priority}</span>
              </div>
              <p style={{fontSize:"13px", color:"#666"}}>Departman: <strong>{ticket.department}</strong></p>
              <p style={{ margin: "10px 0 20px 0", color: "#555" }}>{ticket.description}</p>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #eee", paddingTop: "15px" }}>
                <span style={{ fontSize: "13px", color: "#888" }}>
                    Durum: <strong style={{color:"black"}}>{ticket.status}</strong>
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