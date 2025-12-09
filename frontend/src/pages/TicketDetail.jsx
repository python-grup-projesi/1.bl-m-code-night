import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);

  // Yönetim State'leri
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [supportStaff, setSupportStaff] = useState([]); 

  // AI Asistan State'leri (YENİ)
  const [aiSummary, setAiSummary] = useState("");
  const [aiDraft, setAiDraft] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    
    fetchTicketAndComments();
    fetchSupportStaff();
  }, [id]);

  const fetchTicketAndComments = async () => {
    try {
      const ticketRes = await axios.get(`http://localhost:5000/api/tickets/${id}`);
      setTicket(ticketRes.data);
      setStatus(ticketRes.data.status);
      setPriority(ticketRes.data.priority);
      setAssignedTo(ticketRes.data.assignedTo?._id || ""); // Düzeltme: ID'yi al

      const commentRes = await axios.get(`http://localhost:5000/api/comments/${id}`);
      setComments(commentRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSupportStaff = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users?role=support");
      setSupportStaff(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment) return;
    try {
      await axios.post("http://localhost:5000/api/comments", {
        ticketId: id,
        user: user._id,
        text: newComment
      });
      setNewComment("");
      fetchTicketAndComments();
    } catch (err) { alert("Yorum gönderilemedi!"); }
  };

  const handleUpdateTicket = async () => {
    try {
        await axios.put(`http://localhost:5000/api/tickets/${id}`, {
            status, priority, assignedTo
        });
        alert("Ticket Güncellendi! ✅");
        fetchTicketAndComments();
    } catch (err) { alert("Güncelleme başarısız!"); }
  };

  // --- AI ASİSTAN FONKSİYONU (YENİ) ---
  const handleAiAssist = async () => {
    setAiLoading(true);
    try {
        const res = await axios.post("http://localhost:5000/api/tickets/ai-assist", {
            description: ticket.description
        });
        setAiSummary(res.data.summary);
        setAiDraft(res.data.draftReply);
    } catch (err) {
        alert("AI Analizi yapılamadı.");
    } finally {
        setAiLoading(false);
    }
  };

  // Taslağı yorum kutusuna kopyala
  const copyDraftToComment = () => {
      setNewComment(aiDraft);
  };

  if (!ticket) return <div className="container" style={{textAlign:"center"}}>Yükleniyor...</div>;

  // Yetkili mi? (Öğrenci değilse yetkilidir)
  const isStaff = user && user.role !== 'student';

  return (
    <div className="container">
      <button onClick={() => navigate("/")} style={{ marginBottom: "20px", background: "transparent", color: "#666", padding: 0, textDecoration:"underline" }}>⬅ Geri Dön</button>
      
      <div style={{display:"flex", gap:"20px", flexWrap:"wrap"}}>
        
        {/* SOL TARAFTAKİ TICKET DETAYI */}
        <div style={{flex: 2, minWidth: "300px"}}>
            <div className="ticket-card" style={{ borderLeft: `5px solid ${ticket.priority === 'High' ? 'red' : '#007bff'}` }}>
                <div className="ticket-header">
                    <h2 style={{marginTop:0}}>{ticket.title}</h2>
                    <span className={`status-badge status-${ticket.priority}`}>{ticket.priority}</span>
                </div>
                <p style={{color: "#666"}}>Departman: <strong>{ticket.department}</strong></p>
                <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#333" }}>{ticket.description}</p>
                <div style={{fontSize:"13px", color:"#888", borderTop:"1px solid #eee", paddingTop:"10px", marginTop:"10px"}}>
                    Oluşturan: {ticket.student?.name} | Durum: <strong style={{color:"black"}}>{ticket.status}</strong>
                </div>
            </div>

            {/* --- AI ASİSTAN KUTUSU (Sadece Yetkililere) --- */}
            {isStaff && (
                <div style={{background: "#e8f5e9", border: "1px solid #c8e6c9", padding: "15px", borderRadius: "8px", marginTop: "20px"}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                        <h4 style={{margin:0, color:"#2e7d32"}}>🤖 AI Destek Asistanı</h4>
                        <button onClick={handleAiAssist} className="btn-success" style={{fontSize:"12px", padding:"5px 10px"}} disabled={aiLoading}>
                            {aiLoading ? "Analiz Ediliyor..." : "✨ Analiz Et & Cevap Öner"}
                        </button>
                    </div>

                    {aiSummary && (
                        <div style={{marginTop:"15px", animation:"fadeIn 0.5s"}}>
                            <p><strong>📝 Özet:</strong> {aiSummary}</p>
                            <div style={{background:"white", padding:"10px", borderRadius:"5px", border:"1px solid #ddd", marginTop:"10px"}}>
                                <strong>💡 Önerilen Cevap:</strong>
                                <p style={{fontStyle:"italic", color:"#555"}}>{aiDraft}</p>
                                <button onClick={copyDraftToComment} style={{background:"#2e7d32", color:"white", border:"none", padding:"5px 10px", borderRadius:"4px", cursor:"pointer", fontSize:"12px"}}>
                                    ⬇️ Bu Cevabı Aşağıya Kopyala
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MESAJLAR */}
            <h3 style={{marginTop:"30px"}}>💬 Mesajlar</h3>
            <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "12px", minHeight:"200px" }}>
                {comments.length === 0 ? <p style={{color:"#999"}}>Henüz mesaj yok.</p> : (
                    comments.map((c) => (
                        <div key={c._id} className="message-bubble" style={{ alignSelf: c.user?._id === user?._id ? "flex-end" : "flex-start", background: c.user?._id === user?._id ? "#dcf8c6" : "white", border: "1px solid #eee" }}>
                            <span className="message-user">{c.user?.name} <small>({c.user?.role})</small></span>
                            <p style={{margin:"5px 0", color: "#333"}}>{c.text}</p>
                            <small style={{color:"#aaa", fontSize:"11px", display:"block", textAlign:"right"}}>{new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSendComment} style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <textarea 
                    placeholder="Bir mesaj yazın..." 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)} 
                    style={{ flex: 1, height: "60px" }} 
                />
                <button type="submit" className="btn-primary" style={{ borderRadius: "8px", padding: "0 25px" }}>GÖNDER ➤</button>
            </form>
        </div>

        {/* SAĞ TARAFTAKİ YÖNETİM PANELİ (Sadece Yetkililere) */}
        {isStaff && (
            <div style={{flex: 1, minWidth: "250px", height: "fit-content", background: "#fff3cd", padding: "20px", borderRadius: "8px", border: "1px solid #ffeeba"}}>
                <h4 style={{margin: "0 0 15px 0", color: "#856404"}}>⚙ Yönetim Paneli</h4>
                
                <label style={{display:"block", fontSize:"12px", fontWeight:"bold", marginBottom:"5px"}}>Durum:</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={{width:"100%", marginBottom:"15px"}}>
                    <option value="Open">Açık</option>
                    <option value="In Progress">İşlemde</option>
                    <option value="Resolved">Çözüldü</option>
                    <option value="Closed">Kapandı</option>
                </select>

                <label style={{display:"block", fontSize:"12px", fontWeight:"bold", marginBottom:"5px"}}>Öncelik:</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{width:"100%", marginBottom:"15px"}}>
                    <option value="Low">Düşük</option>
                    <option value="Medium">Orta</option>
                    <option value="High">Yüksek</option>
                </select>

                <label style={{display:"block", fontSize:"12px", fontWeight:"bold", marginBottom:"5px"}}>Personel Ata:</label>
                <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={{width:"100%", marginBottom:"15px"}}>
                    <option value="">-- Atanmadı --</option>
                    {supportStaff.map((staff) => (
                        <option key={staff._id} value={staff._id}>{staff.name}</option>
                    ))}
                </select>

                <button onClick={handleUpdateTicket} className="btn-success" style={{width:"100%"}}>KAYDET</button>
            </div>
        )}

      </div>
    </div>
  );
}