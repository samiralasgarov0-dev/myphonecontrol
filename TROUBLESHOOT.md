# 🔧 MyPhoneControl - Sorun Giderme

---

## ❌ BUILD HATALARI

### "npm: command not found"

**Neden:** Node.js yüklü değil

**Çözüm:**
```
https://nodejs.org adresine git
Node.js 16+ indir ve kur
Bilgisayarı yeniden başlat
node --version yaz (çalışmalı)
```

### "eas-cli: command not found"

**Neden:** EAS CLI yüklü değil

**Çözüm:**
```bash
npm install -g eas-cli
# Bekle (2-3 dakika)
eas --version (kontrol et)
```

### "npm install starts but hangs"

**Neden:** İnternet bağlantısı zayıf

**Çözüm:**
```bash
# Durdur (Ctrl+C)
npm cache clean --force
npm install --legacy-peer-deps
```

### "Module not found: expo"

**Neden:** Dependencies yüklenmedi

**Çözüm:**
```bash
rm -rf node_modules
npm install
```

### "Cannot find module 'react-native'"

**Neden:** Yanlış folder'dasın

**Çözüm:**
```bash
pwd  # Nerede olduğunu kontrol et
cd MyPhoneControl  # Doğru klasöre git
npm install
```

---

## ❌ BUILD BAŞARISIZILIK

### "Build failed after 20 minutes"

**Neden:** Sunucu hatası

**Çözüm:**
```bash
# Tekrar dene
npm run build:apk

# Hala başarısız ise:
rm -rf node_modules
npm install
npm run build:apk
```

### "ANDROID_HOME not set"

**Neden:** Android SDK dizini tanınmıyor

**Çözüm:**

**Windows:**
```
Ctrl+R → sysdm.cpl (Sistem Özellikleri)
Ortam Değişkenleri → Yeni
ANDROID_HOME
C:\Users\[Adınız]\AppData\Local\Android\sdk
OK → Bilgisayarı yeniden başlat
```

**Mac:**
```bash
nano ~/.zshrc
# Ekle:
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Kaydet: Ctrl+X → Y → Enter
source ~/.zshrc
```

**Linux:**
```bash
sudo nano ~/.bashrc
# Ekle:
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools

source ~/.bashrc
```

### "Gradle build failed"

**Neden:** Gradle versiyonu uyumsuz

**Çözüm:**
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### "Java version mismatch"

**Neden:** JDK versiyonu uygun değil

**Çözüm:**
```bash
# JDK 11 yükle
java -version  # JDK 11+ olmalı

# JDK yoksa:
# Windows: https://adoptopenjdk.net
# Mac: brew install openjdk@11
# Linux: sudo apt-get install openjdk-11-jdk
```

---

## ❌ APK HATALARI

### "APK file not found"

**Neden:** Build başarısız olmuş

**Çözüm:**
```bash
# Build loglarını kontrol et
npm run build:apk 2>&1 | tail -50  # Son 50 satırı gör

# Temizle ve tekrar
rm -rf android/app/build
npm run build:apk
```

### "APK install fails on phone"

**Neden:** APK uyumsuz veya bozuk

**Çözüm:**
```
1. Eski uygulamayı kaldır
   Ayarlar → Uygulamalar → MyPhoneControl → Kaldır

2. APK dosyasını yeniden yükle

3. Telefonun depolama alanı yeterli mi?
   Ayarlar → Depolama → Kontrol et
```

### "APK is too large (>100MB)"

**Neden:** Gereksiz dosyalar dahil

**Çözüm:**
```bash
# App.js'de unused imports kaldır
# node_modules temizle

rm -rf node_modules
npm install --production
npm run build:apk
```

---

## ❌ BAĞLANTI HATALARI

### "App connects then disconnects"

**Neden:** SERVER_URL yanlış veya server kapalı

**Çözüm:**
```javascript
// App.js satır ~60:
const SERVER_URL = 'ws://YOUR_IP:3001'; // Kontrol et!

# Sunucu çalışıyor mu?
node server.js  # Terminal'da çalıştır
```

### "Connection timeout"

**Neden:** Firewall engel veriyor

**Çözüm:**
```
AWS Security Group kontrol et:
- Port 3001: İnbound açık mı?
- WiFi: Port 3001 bloke edilmiş mi?

Lokal test et:
SERVER_URL = 'ws://localhost:3001'
```

### "WebSocket connection refused"

**Neden:** Backend server çalışmıyor

**Çözüm:**
```bash
# Terminal 1: Backend başlat
node server.js
# Çıktı: "Server listening on port 3001" olmalı

# Terminal 2: APK'yı çalıştır
```

### "Phone shows offline immediately"

**Neden:** Bağlantı kararsız

**Çözüm:**
```
1. WiFi sinyali güçlü mü?
   Ayarlar → WiFi → Sinyal Seviyesi

2. Firewall devre dışı bırak (test için)

3. VPN kapalı mı?

4. Sunucunun IP doğru mu?
```

---

## ❌ PERFORMANS SORUNU

### "App is slow"

**Neden:** Çok fazla komut

**Çözüm:**
```bash
# App.js'deki logging kaldır
# Gereksiz renders optimize et

# Release build yapıl
npm run build:apk  # (Debug değil)
```

### "Crashes on large operations"

**Neden:** Bellek yetersiz

**Çözüm:**
```javascript
// App.js
// Büyük arrayi küçük parçalara böl
// Gereksiz referans temizle

useEffect(() => {
  return () => {
    // Cleanup
  };
}, []);
```

### "Battery drains fast"

**Neden:** Arka planda sürekli bağlantı

**Çözüm:**
```javascript
// Heartbeat intervali artır
setInterval(() => {
  // Her 10 saniye yerine her 30 saniye
}, 30000);  // 30 saniye

// Location tracking kapat (app.json)
```

---

## ✅ TEST ETME

### APK Test

```bash
# Emulator'da test et
npm run android

# Fiziksel telefonda
# Kable bağlı ve USB debug açık
npm run android
```

### Bağlantı Test

```bash
# Server çalışıyor mu?
curl http://localhost:3001/health
# {"status":"ok"} gelmelidir

# WebSocket çalışıyor mu?
# Browser DevTools → Network → WS
```

### App Logları

```bash
# Android logları görmek
adb logcat | grep MyPhoneControl

# İOS logları görmek
# Xcode → Product → Scheme → Edit Scheme → Run → Pre-actions
```

---

## 🔍 DEBUG MOD

### Verbose Logging

**App.js'de:**
```javascript
// En başına ekle
const DEBUG = true;

if (DEBUG) console.log('Debug:', message);
```

### Browser DevTools

```
1. Android phone: Ayarlar → Hakkında → Build No. 7x tap
2. Geliştirici Seçenekleri açılır
3. USB Debugging → AÇ
4. Chrome → chrome://inspect
```

### Server Logları

```bash
# Verbose mod
DEBUG=* node server.js

# Sadece hatalar
node server.js 2>&1 | grep error
```

---

## 📞 HALA ÇÖZEMEDIĞINIZ VARSA?

Bana yazın (tüm bilgiyi ekleyin):

```
Email: eldarovski91@gmail.com

Mesaj örneği:
─────────────────
Sorun: [Sorun nedir?]
Hata: [Tam hata mesajı]
Adımlar: [Ne yaptığınız]
OS: [Windows/Mac/Linux]
Node: [node --version çıktısı]
npm: [npm --version çıktısı]
─────────────────
```

---

## 💡 İPUÇLARI

1. **Hak denetimi:** Admin olarak çalıştırmayı dene
2. **VPN:** VPN kapalı olsun test ederken
3. **Antivirus:** npm yükleme engel ediyorsa devre dışı bırak
4. **İnternet:** Mobil hotspot yerine WiFi kul
5. **Zaman:** Bilgisayar saati doğru mu? (SSL sertifikaları kontrol eder)

---

**Başarılar!** 🚀
