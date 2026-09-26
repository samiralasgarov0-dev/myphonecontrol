# 📱 MyPhoneControl - APK Build Talimatı

> **50 Telefonunuz İçin Hazır Uygulama Oluşturma**
> 
> **Versiyon:** 1.0.0  
> **Hazırlayan:** Eldar Ovalli  
> **Email:** eldarovski91@gmail.com

---

## ✅ BAŞLAMADAN ÖNCE KONTROL ET

```
☑️ Node.js 16+ yüklü mü? (node --version)
☑️ npm 7+ yüklü mü? (npm --version)
☑️ İnternet bağlantısı var mı?
☑️ Tüm dosyaları indirdin mi?
```

---

## 🚀 HIZLI BAŞLAMA (3 ADIM)

### Adım 1: Klasöre Git

```bash
cd MyPhoneControl
```

### Adım 2: Build Et

**Mac/Linux:**
```bash
chmod +x build.sh
./build.sh
```

**Windows:**
```cmd
npm run build:apk
```

### Adım 3: Seçim Yap

```
1 → EAS Build (Bulut - TAVSIYE)
2 → Lokal Build (Bilgisayarında)
```

---

## 🌐 SEÇENEK 1: EAS BUILD (Bulut - TAVSİYE)

**Avantajları:**
- ✅ En kolay
- ✅ Hiçbir şey kurmanıza gerek yok
- ✅ Hızlı (10-20 dakika)
- ✅ Güvenli (otomatik signing)

### Adım 1: Expo Hesabı Aç

```
https://expo.dev/signup
Email: eldarovski91@gmail.com
```

### Adım 2: Terminal-da Login

```bash
eas login
```

```
Email: eldarovski91@gmail.com
Password: [girdin]
```

### Adım 3: Build Başlat

```bash
./build.sh
# veya
npm run build:apk
```

**Seçin:** `1` (EAS Build)

### Adım 4: Bekle

```
Build yapılıyor... ⏳
(10-20 dakika sürebilir)
```

### Adım 5: İndir

```
Tarayıcı aç: https://expo.dev/builds
APK dosyasını indir
```

---

## 💻 SEÇENEK 2: LOKAL BUILD (Bilgisayarında)

**Gereklilikler:**
- Android Studio yüklü
- Android SDK
- JDK 11+

### Adım 1: Android Studio Kur

```
https://developer.android.com/studio
İndir ve kur
```

### Adım 2: ANDROID_HOME Ayarla

**Windows:**
```
Ortam Değişkenleri → ANDROID_HOME
Değer: C:\Users\[Adınız]\AppData\Local\Android\sdk
```

**Mac/Linux:**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
# ~/.bashrc veya ~/.zshrc içine ekle
```

### Adım 3: Build Başlat

```bash
./build.sh
# veya
npm run build:apk
```

**Seçin:** `2` (Lokal Build)

### Adım 4: Bekle

```
Build yapılıyor... ⏳
(30-60 dakika sürebilir)
```

### Adım 5: APK Bul

```
Dosya: android/app/build/outputs/apk/release/app-release.apk
```

---

## 📁 DOSYA YAPISI

```
MyPhoneControl/
│
├── 📱 app.json           # Proje bilgisi
├── 📱 eas.json           # EAS konfigürasyonu
├── 📱 App.js             # Uygulama kodu
├── 📱 package.json       # Dependencies
├── 🔧 build.sh           # Build script
│
├── 📖 BUILD_INSTRUCTIONS.md  # Bu dosya
├── 📖 TROUBLESHOOT.md        # Sorun giderme
│
├── 📁 assets/            # Uygulamanın görselleri
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
│
└── 📁 node_modules/      # Kütüphaneler (npm install sonrası)
```

---

## ⚙️ AYARLAR (Build Öncesi)

### app.json'da Değişiklikler

**Proje adı:**
```json
"name": "MyPhoneControl"
```

**Uygulama ID (Package Name):**
```json
"android": {
  "package": "com.eldarovski.myphonecontrol"
}
```

**Versiyon:**
```json
"version": "1.0.0"
```

### SUNUCU URL'İNİ AYARLA ⚠️

**App.js dosyasını aç (satır ~60):**

```javascript
const SERVER_URL = 'ws://192.168.1.100:3001'; // DEĞİŞTİRİN!
```

**Değiştir:**
```javascript
const SERVER_URL = 'ws://YOUR_AWS_IP:3001'; // AWS IP'niz
// veya
const SERVER_URL = 'ws://localhost:3001'; // Lokal test için
```

---

## 🎯 HIZLI KOMUTLAR

### Build Options

```bash
# APK build (Android)
npm run build:apk

# AAB build (Google Play)
npm run build:aab

# iOS build
npm run build:ios

# Her şey
npm run build:all

# Lokal build
eas build --platform android --local
```

### Geliştirme

```bash
# Test etmek için çalıştır
npm start

# Android'de test et
npm run android

# iOS'da test et
npm run ios

# Web'de test et
npm run web
```

---

## 🆘 SORUN GIDERME

### Problem 1: "eas-cli: command not found"

```bash
# Çözüm
npm install -g eas-cli
```

### Problem 2: "ANDROID_HOME not set"

```bash
# Windows
setx ANDROID_HOME "C:\Users\[Adınız]\AppData\Local\Android\sdk"

# Mac/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk
```

### Problem 3: "Build başarısız"

```bash
# Temizle ve yeniden kur
rm -rf node_modules
npm install
npm run build:apk
```

### Problem 4: "npm install çalışmıyor"

```bash
# Node.js cache temizle
npm cache clean --force

# Yeniden kur
npm install
```

### Problem 5: "Telefon uygulamaya bağlanmıyor"

**App.js içinde SERVER_URL kontrol et:**
```javascript
const SERVER_URL = 'ws://YOUR_SERVER_IP:3001'; // Doğru mu?
```

---

## 📱 TELEFONA YÜKLEME

### Android

1. **APK dosyasını telefonunuza kopyala**
   ```
   APK → Telefonun Downloads klasörü
   ```

2. **Ayarlar → Bilinmeyen Kaynaklar → AÇ**

3. **APK dosyasına tap et → İnstall**

4. **Uygulama açıl → Otomatik bağlanır**

### iOS

1. **TestFlight'a Upload et**
   ```
   Xcode → Organizer → Distribute
   ```

2. **Tester davet et**

3. **TestFlight'tan indir**

4. **Uygulama açıl → Otomatik bağlanır**

---

## ✅ KONTROL LİSTESİ

Build öncesi:

- [ ] Node.js yüklü (16+)
- [ ] npm yüklü (7+)
- [ ] Expo hesabı oluşturuldu
- [ ] SERVER_URL değiştirildi
- [ ] Dosyaların hepsi indirildimi
- [ ] package.json doğru

Build sonrası:

- [ ] APK dosyası oluşturuldu
- [ ] APK boyutu 50-100MB
- [ ] Telefona yüklendi
- [ ] Uygulama açılıyor
- [ ] Dashboard'a bağlandı

---

## 🔄 GÜNCELLEME

**Yeni APK yapmak:**

```bash
# Kodu değiştir (App.js vb)
# Ardından:
npm run build:apk
```

**Telefonda güncellemek:**

1. Eski uygulamayı kaldır
2. Yeni APK yükle
3. İnstall et
4. Açıl

---

## 📊 VERSİYON YÖNETİMİ

**Her yeni build'de versiyon artır:**

```json
// app.json
"version": "1.0.1"  // 1.0.0 → 1.0.1

// Android
"android": {
  "versionCode": 2  // 1 → 2
}
```

---

## 🎯 NEXT STEPS (Sonraki)

1. ✅ APK build et
2. ✅ 50 telefona yükle
3. ✅ MyPhoneControl Dashboard aç
4. ✅ Telefonlar bağlansın
5. ✅ Kontrol etmeye başla!

---

## 📞 YARDIM

**Sorun varsa:**
- 📧 Email: eldarovski91@gmail.com
- 📖 Dosya: TROUBLESHOOT.md
- 🌐 Expo Docs: https://docs.expo.dev

---

## 🎉 BIR DAHA KOLAY!

Şimdi sadece şu komut yeterli:

```bash
npm run build:apk
```

**Ve 20 dakika sonra APK hazır!** ✅

---

**Başarılar!** 🚀
