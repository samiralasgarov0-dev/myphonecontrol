import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  AppState,
  Vibration,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Audio } from 'expo-av';

const MyPhoneControl = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [phoneId, setPhoneId] = useState(null);
  const [battery, setBattery] = useState(100);
  const [volume, setVolume] = useState(50);
  const [serverStatus, setServerStatus] = useState('Bağlantı bekleniyor...');
  const [wsRef, setWsRef] = useState(null);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [wifiSignal, setWifiSignal] = useState(-50);
  const [wifiNetwork, setWifiNetwork] = useState('HomeNetwork');
  const [wifiSpeed, setWifiSpeed] = useState(0);
  const [usageTime, setUsageTime] = useState(0);
  const appState = useRef(AppState.currentState);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const usageStartTime = useRef(Date.now());
  const heartbeatInterval = useRef(null);

  // ==================== İNİSİYALİZASYON ====================

  useEffect(() => {
    initializeAgent();
    setupEventListeners();
    setupAudio();
    startUsageTracking();

    return () => {
      if (wsRef) {
        wsRef.close();
      }
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      logUsageToServer();
    };
  }, []);

  const initializeAgent = () => {
    const deviceId = Application.androidId || Device.modelId || `phone_${Date.now()}`;
    setPhoneId(deviceId);
    connectToServer(deviceId);
  };

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (err) {
      console.error('Audio setup error:', err);
    }
  };

  // ==================== KULLANIM TAKIBI ====================

  const startUsageTracking = () => {
    usageStartTime.current = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = (Date.now() - usageStartTime.current) / 1000; // Saniye
      setUsageTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  };

  const logUsageToServer = async () => {
    if (!phoneId || !wsRef) return;

    const durationInSeconds = (Date.now() - usageStartTime.current) / 1000;

    try {
      await fetch('http://YOUR_SERVER:3001/api/usage/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_id: phoneId,
          date: new Date().toISOString().split('T')[0],
          duration_seconds: Math.floor(durationInSeconds),
          wifi_signal: wifiSignal,
          wifi_network: wifiNetwork,
          wifi_speed: wifiSpeed,
          battery: battery,
        }),
      });
      console.log('✅ Kullanım kaydedildi');
    } catch (err) {
      console.error('Usage log error:', err);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // ==================== WEBSOCKET BAĞLANTISI ====================

  const connectToServer = (phoneId) => {
    try {
      const SERVER_URL = 'ws://YOUR_SERVER:3001'; // DEĞİŞTİRİN!

      console.log(`🔌 ${SERVER_URL} adresine bağlanılıyor...`);

      const ws = new WebSocket(SERVER_URL);

      ws.onopen = () => {
        console.log('✅ Server-a bağlandı!');
        setIsConnected(true);
        setServerStatus('Bağlı ✅');
        reconnectAttempts.current = 0;

        // Telefonu kaydet
        ws.send(
          JSON.stringify({
            type: 'register-phone',
            phoneId: phoneId,
            phone: {
              name: `Phone-${phoneId.substring(0, 8)}`,
              type: Platform.OS === 'ios' ? 'iOS' : 'Android',
              battery: battery,
              manufacturer: Device.manufacturer,
              model: Device.modelName,
              wifi_enabled: wifiEnabled,
              wifi_signal: wifiSignal,
              wifi_network: wifiNetwork,
            },
          })
        );

        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleServerCommand(message);
        } catch (err) {
          console.error('Message parse error:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setServerStatus('Bağlantı Hatası');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('❌ Sunucudan ayrıldı');
        setIsConnected(false);
        setServerStatus('Bağlı Değil');
        attemptReconnect(phoneId);
      };

      setWsRef(ws);
    } catch (err) {
      console.error('Connection error:', err);
      setServerStatus('Bağlantı Başarısız');
      attemptReconnect(phoneId);
    }
  };

  const attemptReconnect = (phoneId) => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current += 1;
      const delay = Math.min(1000 * reconnectAttempts.current, 10000);

      setTimeout(() => {
        connectToServer(phoneId);
      }, delay);
    } else {
      setServerStatus('Bağlantı kurulamıyor');
    }
  };

  // ==================== SERVER KOMUTLARI ====================

  const handleServerCommand = async (command) => {
    console.log('📞 Komut alındı:', command.type);

    switch (command.type) {
      case 'command':
        await executeCommand(command.command, command.value);
        break;

      case 'registration-confirmed':
        console.log('✅ Telefon kaydedildi:', command.phoneId);
        break;
    }
  };

  const executeCommand = async (command, value) => {
    console.log(`⚡ Komut yürütülüyor: ${command}`);
    Vibration.vibrate(50);

    switch (command) {
      case 'set-volume':
        await setPhoneVolume(value);
        break;

      case 'unlock':
        await unlockPhone();
        break;

      case 'tap':
        await handleTap(value);
        break;

      case 'wifi-on':
        await toggleWiFi(true);
        break;

      case 'wifi-off':
        await toggleWiFi(false);
        break;

      case 'speed-test':
        await runSpeedTest();
        break;

      case 'screenshot':
        await takeScreenshot();
        break;

      case 'home':
        await pressHome();
        break;

      case 'back':
        await pressBack();
        break;

      default:
        console.warn(`Bilinmeyen komut: ${command}`);
    }
  };

  // ==================== CİHAZ İŞLEMLERİ ====================

  const setPhoneVolume = async (volumeLevel) => {
    try {
      const volume = Math.max(0, Math.min(100, volumeLevel));
      setVolume(volume);

      if (wsRef && wsRef.readyState === WebSocket.OPEN) {
        wsRef.send(
          JSON.stringify({
            type: 'volume-changed',
            phoneId: phoneId,
            volume: volume,
          })
        );
      }

      console.log(`🔊 Ses seviyesi: ${volume}%`);
    } catch (err) {
      console.error('Volume error:', err);
    }
  };

  const toggleWiFi = async (enabled) => {
    try {
      Vibration.vibrate(50);
      setWifiEnabled(enabled);
      console.log(`📶 WiFi ${enabled ? 'açıldı' : 'kapatıldı'}`);

      // Simulate WiFi toggle
      if (enabled) {
        setWifiSignal(-45);
        setWifiSpeed(85);
      } else {
        setWifiSignal(0);
        setWifiSpeed(0);
      }

      if (wsRef && wsRef.readyState === WebSocket.OPEN) {
        wsRef.send(
          JSON.stringify({
            type: 'wifi-toggled',
            phoneId: phoneId,
            wifi_enabled: enabled,
            timestamp: new Date(),
          })
        );
      }
    } catch (err) {
      console.error('WiFi toggle error:', err);
    }
  };

  const runSpeedTest = async () => {
    try {
      Vibration.vibrate([50, 30, 50]);
      console.log('⚡ Hız testi başladı...');

      // Simulate speed test (3 seconds)
      setTimeout(() => {
        const testSpeed = Math.floor(Math.random() * 100) + 20;
        setWifiSpeed(testSpeed);
        console.log(`📊 Hız testi tamamlandı: ${testSpeed} Mbps`);

        if (wsRef && wsRef.readyState === WebSocket.OPEN) {
          wsRef.send(
            JSON.stringify({
              type: 'speed-test-result',
              phoneId: phoneId,
              speed_mbps: testSpeed,
              timestamp: new Date(),
            })
          );
        }
      }, 3000);
    } catch (err) {
      console.error('Speed test error:', err);
    }
  };

  const unlockPhone = async () => {
    try {
      Vibration.vibrate([100, 50, 100]);
      console.log('🔓 Kilit açma komutu alındı');

      if (wsRef && wsRef.readyState === WebSocket.OPEN) {
        wsRef.send(
          JSON.stringify({
            type: 'unlock-triggered',
            phoneId: phoneId,
            timestamp: new Date(),
          })
        );
      }
    } catch (err) {
      console.error('Unlock error:', err);
    }
  };

  const handleTap = async (value) => {
    try {
      Vibration.vibrate(30);
      console.log(`👆 Tap komutu: (${value.x}, ${value.y})`);
    } catch (err) {
      console.error('Tap error:', err);
    }
  };

  const takeScreenshot = async () => {
    try {
      console.log('📸 Screenshot alındı');
    } catch (err) {
      console.error('Screenshot error:', err);
    }
  };

  const pressHome = async () => {
    try {
      Vibration.vibrate(50);
      console.log('🏠 Home düymesi basıldı');
    } catch (err) {
      console.error('Home error:', err);
    }
  };

  const pressBack = async () => {
    try {
      Vibration.vibrate(50);
      console.log('⬅️ Back düymesi basıldı');
    } catch (err) {
      console.error('Back error:', err);
    }
  };

  // ==================== HEARTBEAT ====================

  const startHeartbeat = () => {
    heartbeatInterval.current = setInterval(() => {
      if (wsRef && wsRef.readyState === WebSocket.OPEN) {
        wsRef.send(
          JSON.stringify({
            type: 'heartbeat',
            phoneId: phoneId,
            battery: battery,
            usage_time: usageTime,
            wifi_enabled: wifiEnabled,
            wifi_signal: wifiSignal,
            wifi_network: wifiNetwork,
            timestamp: new Date(),
          })
        );
      }
    }, 5000);
  };

  // ==================== EVENT LİSTENERS ====================

  const setupEventListeners = () => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  };

  const handleAppStateChange = (nextAppState) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('📱 Uygulama aktif hale geldi');
      if (!isConnected) {
        connectToServer(phoneId);
      }
    } else if (nextAppState.match(/inactive|background/)) {
      console.log('📱 Uygulama arka plana gitti');
      logUsageToServer();
    }

    appState.current = nextAppState;
  };

  // ==================== UI ====================

  const getWiFiSignalColor = (signal) => {
    if (signal > -50) return '#4ade80'; // Green
    if (signal > -70) return '#fbbf24'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎮 MyPhoneControl Agent</Text>
        <Text style={styles.subtitle}>v1.0.0 + WiFi + Usage</Text>
      </View>

      {/* Bağlantı Durumu */}
      <View style={[styles.card, styles.statusCard]}>
        <Text style={styles.cardLabel}>🌐 Bağlantı Durumu</Text>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? '#4ade80' : '#ef4444' },
            ]}
          />
          <Text style={styles.statusText}>{serverStatus}</Text>
        </View>
      </View>

      {/* Cihaz Bilgisi */}
      <View style={[styles.card, styles.infoCard]}>
        <Text style={styles.cardLabel}>📱 Cihaz Bilgisi</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Telefon ID:</Text>
          <Text style={styles.infoValue}>
            {phoneId ? phoneId.substring(0, 12) + '...' : 'Yükleniyor'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Platform:</Text>
          <Text style={styles.infoValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🔋 Batareya:</Text>
          <Text style={styles.infoValue}>{Math.round(battery)}%</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>⏱️ Kullanım:</Text>
          <Text style={styles.infoValue}>{formatDuration(usageTime)}</Text>
        </View>
      </View>

      {/* WiFi Kontrolü */}
      <View style={[styles.card, styles.wifiCard]}>
        <Text style={styles.cardLabel}>📶 WiFi Yönetimi</Text>

        <View style={styles.wifiToggle}>
          <Text style={styles.wifiLabel}>WiFi Durumu:</Text>
          <Switch
            value={wifiEnabled}
            onValueChange={(value) => toggleWiFi(value)}
            trackColor={{ false: '#e0e0e0', true: '#81c784' }}
            thumbColor={wifiEnabled ? '#4ade80' : '#bdbdbd'}
          />
          <Text style={styles.wifiStatus}>{wifiEnabled ? '🟢 Açık' : '🔴 Kapalı'}</Text>
        </View>

        {wifiEnabled && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ağ Adı:</Text>
              <Text style={styles.infoValue}>{wifiNetwork}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sinyal:</Text>
              <View style={styles.signalBar}>
                <View
                  style={[
                    styles.signalFill,
                    { 
                      width: `${Math.abs(wifiSignal / 1.2)}%`,
                      backgroundColor: getWiFiSignalColor(wifiSignal)
                    },
                  ]}
                />
              </View>
              <Text style={[styles.infoValue, { color: getWiFiSignalColor(wifiSignal) }]}>
                {wifiSignal} dBm
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hız:</Text>
              <Text style={styles.infoValue}>{wifiSpeed} Mbps</Text>
            </View>

            <TouchableOpacity style={styles.speedTestBtn} onPress={() => runSpeedTest()}>
              <Text style={styles.speedTestText}>⚡ Hız Testi Yap</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Test Düymələri */}
      <View style={[styles.card, styles.actionsCard]}>
        <Text style={styles.cardLabel}>🧪 Test İşlemleri</Text>

        <TouchableOpacity style={styles.testButton} onPress={() => unlockPhone()}>
          <Text style={styles.testButtonText}>🔓 Kilit Aç</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={() => pressHome()}>
          <Text style={styles.testButtonText}>🏠 Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={() => setPhoneVolume(50)}>
          <Text style={styles.testButtonText}>🔊 Səs 50%</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isConnected
            ? '✅ Sunucudan komut bekleniyor...'
            : '❌ Sunucuya bağlanmaya çalışılıyor...'}
        </Text>
      </View>
    </ScrollView>
  );
};

// ==================== STİLLƏR ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#667eea',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },

  card: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  statusCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#667eea',
  },

  cardLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },

  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  infoCard: {},

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  infoLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },

  infoValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },

  wifiCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#667eea',
  },

  wifiToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  wifiLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },

  wifiStatus: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    marginLeft: 10,
  },

  signalBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },

  signalFill: {
    height: '100%',
  },

  speedTestBtn: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },

  speedTestText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  actionsCard: {},

  testButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },

  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  footer: {
    marginHorizontal: 15,
    marginVertical: 20,
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },

  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default MyPhoneControl;
