# 🎮 MyPhoneControl - Tam Sistem

> **50 Telefonun Merkezden Kontrolü + WiFi + Günlük Raporlama**
> 
> **Versiyon:** 2.0.0 (WiFi + Usage Tracking)
> **Hazırlayan:** Eldar Ovalli  
> **Email:** eldarovski91@gmail.com

---

## 📦 YARATILMIŞ DOSYALAR

### **Mobile App (Android/iOS)**
- ✅ **App.js** - Tam çalışan React Native kod
  - WebSocket bağlantısı
  - WiFi kontrol (Aç/Kapat)
  - WiFi sinyal ölçümü
  - Hız testi
  - Günlük kullanım takibi
  - Heartbeat sistemi

### **Backend Server**
- ✅ **server.js** - Node.js + Express + WebSocket
  - JWT Authentication
  - Phone registration & management
  - Usage logging API
  - WiFi logs API
  - Reports endpoints (daily/weekly/monthly)
  - Export (CSV/JSON)
  - WebSocket real-time updates

### **Dashboard**
- ✅ **Dashboard.jsx** - React UI
  - 4 Tab sistem (Live, Reports, WiFi, Settings)
  - Telefon siyahısı
  - Canlı kontrol
  - Rapor görüntüleme
  - WiFi yönetimi
  
- ✅ **Dashboard.css** - Modern tasarım
  - Responsive layout
  - Tab navigation
  - Report tables
  - WiFi cards

### **Konfigürasyon**
- ✅ **app.json** - Proje bilgisi
- ✅ **eas.json** - EAS build config
- ✅ **package.json** - Dependencies
- ✅ **build.sh** - Build script
- ✅ **build-workflow.yml** - GitHub Actions

---

## ✨ YENİ ÖZELLİKLER

### **WiFi Yönetimi**
```
✅ WiFi Aç/Kapat
✅ Sinyal Gücü (-50 dBm → Mükemmel)
✅ Ağ Adı Görüntüleme
✅ Hız Testi (Mbps)
✅ Hotspot Kontrolü
✅ WiFi Logları
```

### **Kullanım Takibi**
```
✅ Günlük saatler
✅ Başlangıç/Bitiş zamanı
✅ Toplam süre (saat/dakika/saniye)
✅ Son bağlantı zamanı
✅ Batareya seviyesi
✅ WiFi sinyal kaydı
```

### **Raporlama Sistemi**
```
✅ Günlük rapor
✅ Haftalık rapor  
✅ Aylık rapor
✅ Özet istatistikler
✅ Detaylı tablolar
✅ CSV/JSON export
```

---

## 🚀 BAŞLAMAK

### **1. Dosyaları İndir**
```
Sağ taraftaki tüm dosyaları indir:
- App.js
- server.js
- Dashboard.jsx
- Dashboard.css
- package.json
- app.json
- eas.json
- build.sh
```

### **2. Klasör Oluştur**
```bash
mkdir MyPhoneControl
cd MyPhoneControl
# Dosyaları buraya yapıştır
```

### **3. Dependencies Kur**
```bash
npm install
```

### **4. Server URL'nİ Güncelle**

**App.js'de (satır ~65):**
```javascript
const SERVER_URL = 'ws://YOUR_AWS_IP:3001'; // Değiştir!
```

**Dashboard.jsx'de (tüm fetch URL'leri):**
```javascript
'http://localhost:3001/api/...' // Değiştir!
```

### **5. Backend Başlat**
```bash
node server.js
```

### **6. Dashboard Aç**
```bash
npx create-react-app dashboard
cd dashboard
npm start
```

---

## 📊 DASHBOARD TABS

### **Tab 1: Canlı (📱)**
```
- Telefonlar listesi
- Online/Offline status
- Batareya %
- Kullanım süresi
- WiFi sinyal
- Kontrol paneli
```

### **Tab 2: Raporlar (📊)**
```
- Dönem seçimi (Günlük/Haftalık/Aylık)
- Özet kartları
  - Toplam telefon
  - Online sayısı
  - Ortalama kullanım
- Detaylı tablo
- CSV/JSON export
```

### **Tab 3: WiFi (📶)**
```
- Her telefon kartı
- WiFi Durum (Açık/Kapalı)
- Sinyal gücü (dBm)
- Ağ adı
- Hız (Mbps)
- Kontrol düymeleeri
  - WiFi Aç
  - WiFi Kapat
  - Hız Testi
```

### **Tab 4: Ayarlar (⚙️)**
```
- Sistem bilgisi
- Status gösterges
- Versiyon
```

---

## 📱 TELEFONDA NE OLUR?

```
MyPhoneControl Agent çalıştığında:

✅ Sunucuya bağlanır
✅ Telefonun ID'sini gönderir
✅ Her 5 saniyede heartbeat gönderir:
   - Batareya %
   - Kullanım süresi
   - WiFi durumu
   - WiFi sinyali
   - WiFi ağı

✅ Sunucudan komandaları alır:
   - WiFi aç/kapat
   - Hız testi
   - Ses kontrolü
   - Tap/Swipe
   - Kilit açma

✅ Loglar oluşturur:
   - Günlük kullanım
   - WiFi değişiklikleri
   - Hız test sonuçları
```

---

## 📊 RAPOR ÖRNEĞİ

### **Günlük Rapor**
```json
{
  "date": "2024-01-15",
  "total_phones": 50,
  "online_phones": 48,
  "offline_phones": 2,
  "average_usage": 30600,
  "phones": {
    "phone_001": {
      "name": "Phone-001",
      "type": "Android",
      "usage_seconds": 31500,
      "wifi_signal": -45,
      "wifi_network": "HomeNetwork",
      "wifi_speed": 85,
      "battery": 92,
      "last_seen": "2024-01-15T17:45:00Z"
    },
    ...
  }
}
```

---

## 🔧 API ENDPOINTS

### **Authentication**
```
POST /api/auth/login
  Body: { email, password }
  Response: { token, user }
```

### **Phones**
```
GET /api/phones
GET /api/phones/:phoneId
PUT /api/phones/:phoneId (rename)
POST /api/commands/:phoneId (command)
```

### **Usage Tracking**
```
POST /api/usage/log
  {phone_id, date, duration_seconds, wifi_signal, wifi_speed, battery}
```

### **Reports**
```
GET /api/reports/daily
GET /api/reports/weekly
GET /api/reports/monthly
GET /api/reports/export?format=csv&period=daily
```

### **WiFi**
```
POST /api/wifi/log
GET /api/wifi/logs/:phoneId
```

---

## 🌐 GITHUB AUTOMATION

### **Workflow Dosyası**
```
.github/workflows/build.yml
```

### **Otomatik Build**
```
1. Kod GitHub'a push et
2. Actions otomatik başlar
3. APK build olur (20 dakika)
4. Desktop app build olur
5. Release oluşturulur
```

### **EAS Token Setup**
```
1. GitHub → Settings → Secrets
2. New secret: EAS_TOKEN
3. Expo EAS token'ını yapıştır
4. Bitti! Otomatik build başlar
```

---

## 📥 APK ALMAK

### **Seçenek 1: EAS Build (Tavsiye)**
```bash
chmod +x build.sh
./build.sh
# Seç: 1 (EAS Build)
# Login: eldarovski91@gmail.com
# 20 dakika bekle
# APK indir: https://expo.dev/builds
```

### **Seçenek 2: GitHub Actions**
```
1. Kodu GitHub'a push et
2. Actions tab'ı
3. Build workflow'u gözle
4. Build bitince → Release
5. APK indir
```

### **Seçenek 3: Lokal Build**
```bash
./build.sh
# Seç: 2 (Lokal Build)
# Android Studio gerekli
```

---

## 🔄 DƏYIŞDIRMƏ PROSESI

### **Örnek: Səs Kontrolu Ekle**

```
1. App.js aç
2. setPhoneVolume() fonksiyonunu güncelle
3. Save et
4. GitHub'a push et
5. Otomatik build başlar
6. 20 dakika sonra APK hazır
7. İndir ve telefona yükle
```

### **Örnek: Rapor Filtrelemesi**

```
1. Dashboard.jsx aç
2. filterReport() ekle
3. Save et
4. GitHub'a push et
5. Otomatik build
6. Dashboard güncellenir
```

---

## 📈 İZLEYEBİLECEĞİNİZ VERÎLER

```
Her telefon için:
├─ Günlük açılma süresi
├─ Başlangıç/Bitiş zamanı
├─ Toplam harcanan süre
├─ WiFi durumu
├─ WiFi sinyal gücü
├─ WiFi ağ adı
├─ Hız test sonuçları
├─ Batareya seviyesi
├─ Son bağlantı zamanı
└─ Uygulama istifadəsi
```

---

## 🎯 TEKNİK ÖZET

```
Frontend:
├─ React Dashboard
├─ 4 Tabs
├─ Real-time WebSocket
└─ Report exports

Mobile:
├─ React Native
├─ WebSocket client
├─ WiFi integration
└─ Usage tracking

Backend:
├─ Node.js + Express
├─ WebSocket server
├─ SQLite / In-Memory DB
├─ Report generation
└─ CSV/JSON export

DevOps:
├─ GitHub Actions
├─ EAS Build (APK)
├─ Electron Build (Desktop)
└─ Auto Release
```

---

## ⚙️ YAPILACAKLAR (Future)

```
✅ Multi-user support
✅ Grup kontrol
✅ Advanced analytics
✅ Machine learning
✅ Mobile app (native)
✅ Cloud sync
✅ Offline mode
✅ Blockchain logging
```

---

## 📞 DESTEK

**Sorun varsa:**
- 📧 Email: eldarovski91@gmail.com
- 📖 Dosya: BUILD_INSTRUCTIONS.md
- 🔧 Dosya: TROUBLESHOOT.md

---

## 🎉 BAŞLAMAĞA HAZIR!

```
1. Dosyaları indir ✅
2. npm install ✅
3. Server URL'nİ güncelle ✅
4. node server.js ✅
5. npm start (Dashboard) ✅
6. APK build et ✅
7. 50 telefona yükle ✅
8. Kontrol etmeye başla! 🚀
```

---

**Versiyon:** 2.0.0  
**Status:** ✅ Üretime Hazır  
**Özellikler:** WiFi + Reports + Usage Tracking  
**Lisans:** MIT

---

**Başarılar!** 🚀
