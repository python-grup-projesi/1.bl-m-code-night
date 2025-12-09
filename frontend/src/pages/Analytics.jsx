import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Analytics() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Sadece yetkili kişiler görebilsin (Basit güvenlik)
    const storedUser = localStorage.getItem("user");
    if (!storedUser) navigate("/login");
    
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/reports");
      setData(res.data);
    } catch (err) {
      console.error("Raporlar alınamadı", err);
    }
  };

  if (!data) return <div className="container" style={{textAlign:"center"}}>Veriler hesaplanıyor...</div>;

  return (
    <div className="container">
       <button onClick={() => navigate("/")} style={{ marginBottom: "20px", background: "transparent", color: "#666", padding: 0, textDecoration:"underline" }}>⬅ Ana Sayfaya Dön</button>
       
       <h2 style={{borderBottom:"2px solid #eee", paddingBottom:"10px"}}>📊 Sistem Analiz Raporu</h2>

       {/* İSTATİSTİK KARTLARI */}
       <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px"}}>
          
          <div style={cardStyle("#e3f2fd", "#0d47a1")}>
            <h3>Toplam Talep</h3>
            <span style={{fontSize: "30px", fontWeight: "bold"}}>{data.stats.totalTickets}</span>
          </div>

          <div style={cardStyle("#fff3cd", "#856404")}>
            <h3>Açık (Open)</h3>
            <span style={{fontSize: "30px", fontWeight: "bold"}}>{data.stats.openTickets}</span>
          </div>

          <div style={cardStyle("#d4edda", "#155724")}>
            <h3>Çözülen</h3>
            <span style={{fontSize: "30px", fontWeight: "bold"}}>{data.stats.resolvedTickets}</span>
          </div>

          <div style={cardStyle("#f8d7da", "#721c24")}>
            <h3>Kapanan</h3>
            <span style={{fontSize: "30px", fontWeight: "bold"}}>{data.stats.closedTickets}</span>
          </div>

       </div>

       {/* PERSONEL PERFORMANS TABLOSU */}
       <h3>🏆 Personel Performansı (Atanan İşler)</h3>
       {data.staffPerformance.length === 0 ? <p>Henüz iş ataması yapılmamış.</p> : (
         <table style={{width: "100%", borderCollapse: "collapse", marginTop: "10px"}}>
           <thead>
             <tr style={{background: "#f8f9fa", textAlign: "left"}}>
               <th style={thStyle}>Personel Adı</th>
               <th style={thStyle}>Üzerindeki İş Sayısı</th>
             </tr>
           </thead>
           <tbody>
             {data.staffPerformance.map((staff, index) => (
               <tr key={index} style={{borderBottom: "1px solid #ddd"}}>
                 <td style={tdStyle}>{staff.name}</td>
                 <td style={tdStyle}><strong>{staff.count}</strong> Adet Ticket</td>
               </tr>
             ))}
           </tbody>
         </table>
       )}

    </div>
  );
}

// Basit stiller
const cardStyle = (bg, color) => ({
  background: bg, color: color, padding: "20px", borderRadius: "10px", textAlign: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
});
const thStyle = { padding: "12px", borderBottom: "2px solid #ddd" };
const tdStyle = { padding: "12px" };