import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Sayfaları içeri alıyoruz (Import)
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import TicketDetail from './pages/TicketDetail';
import Analytics from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ana Sayfa (Sadece giriş yapmışlar görebilir) */}
        <Route path="/" element={<Home />} />
        
        {/* Giriş ve Kayıt Sayfaları */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/analytics" element={<Analytics />} />
        
        {/* Ticket Detay Sayfası */}
        <Route path="/ticket/:id" element={<TicketDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;