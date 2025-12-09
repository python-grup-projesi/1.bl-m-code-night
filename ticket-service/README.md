# 🎓 CampuSupport - Kampüs Destek ve Bilet Yönetim Sistemi

CampuSupport, üniversite/kampüs ortamında öğrencilerin teknik veya idari sorunlar için destek talebi (ticket) oluşturmasını, departmanların ve personelin bu talepleri yönetmesini sağlayan tam kapsamlı bir web uygulamasıdır.

## 🚀 Proje Özellikleri

* **Rol Tabanlı Giriş:** Öğrenci, Destek Personeli, Departman Yetkilisi ve Yönetici rolleri.
* **Ticket Yönetimi:** Talep oluşturma, durum takibi (Açık, İşlemde, Çözüldü, Kapalı).
* **Departman İzolasyonu:** Personeller sadece kendi departmanlarına (Örn: Bilgi İşlem) gelen talepleri görür.
* **Akıllı Atama:** Yetkililer, talepleri uygun personele atayabilir.
* **Mesajlaşma:** Her ticket altında yorum/mesajlaşma alanı.
* **Raporlama & Analiz:** Yetkililer için görsel istatistik paneli (Dashboard).
* **Filtreleme & Sıralama:** Öncelik ve duruma göre listeleme.

## 🛠️ Kullanılan Teknolojiler (MERN Stack)

* **Frontend:** React (Vite), React Router DOM, Axios
* **Backend:** Node.js, Express.js
* **Veritabanı:** MongoDB (Mongoose)
* **Güvenlik:** JWT (JSON Web Token), BCryptJS (Şifreleme)

---

## ⚙️ Kurulum ve Çalıştırma

Projeyi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin.

### 1. Hazırlık
Bu projeyi indirin ve terminalde ana klasöre gelin.

### 2. Backend Kurulumu
Yeni bir terminal açın ve şu komutları girin:

```bash
cd backend
npm install