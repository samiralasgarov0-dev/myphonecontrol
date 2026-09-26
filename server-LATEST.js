// MyPhoneControl - Backend Server (WiFi + Usage Tracking + Reports)

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'myphonecontrol-secret-key-2024';

// ==================== IN-MEMORY DATABASE ====================

const users = {
  'eldarovski91@gmail.com': {
    id: '1',
    email: 'eldarovski91@gmail.com',
    password: bcryptjs.hashSync('password123', 10),
    role: 'admin'
  }
};

const phones = new Map();
const usageLogs = []; // Günlük kullanım logları
const wifiLogs = []; // WiFi kontrol logları

// ==================== AUTH ====================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users[email];

  if (!user || !bcryptjs.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, email: user.email } });
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ==================== PHONES API ====================

app.get('/api/phones', verifyToken, (req, res) => {
  const phonesList = Array.from(phones.values()).map(phone => ({
    id: phone.id,
    name: phone.name,
    type: phone.type,
    battery: phone.battery,
    isOnline: phone.isOnline,
    volume: phone.volume,
    lastSeen: phone.lastSeen,
    connectedTime: phone.connectedTime,
    wifi_enabled: phone.wifi_enabled,
    wifi_signal: phone.wifi_signal,
    wifi_network: phone.wifi_network,
    usage_time: phone.usage_time,
  }));

  res.json(phonesList);
});

app.get('/api/phones/:phoneId', verifyToken, (req, res) => {
  const phone = phones.get(req.params.phoneId);

  if (!phone) {
    return res.status(404).json({ error: 'Phone not found' });
  }

  res.json({
    id: phone.id,
    name: phone.name,
    type: phone.type,
    battery: phone.battery,
    isOnline: phone.isOnline,
    volume: phone.volume,
    lastSeen: phone.lastSeen,
    wifi_enabled: phone.wifi_enabled,
    wifi_signal: phone.wifi_signal,
    wifi_network: phone.wifi_network,
    usage_time: phone.usage_time,
  });
});

app.put('/api/phones/:phoneId', verifyToken, (req, res) => {
  const { name } = req.body;
  const phone = phones.get(req.params.phoneId);

  if (!phone) {
    return res.status(404).json({ error: 'Phone not found' });
  }

  phone.name = name;
  res.json({ success: true, message: 'Phone name updated' });
});

// ==================== USAGE TRACKING ====================

app.post('/api/usage/log', verifyToken, (req, res) => {
  const { phone_id, date, duration_seconds, wifi_signal, wifi_network, wifi_speed, battery } = req.body;

  const log = {
    id: usageLogs.length + 1,
    phone_id,
    date,
    duration_seconds,
    wifi_signal,
    wifi_network,
    wifi_speed,
    battery,
    timestamp: new Date(),
  };

  usageLogs.push(log);
  console.log(`📊 Kullanım kaydedildi: ${phone_id} - ${duration_seconds}s`);

  res.json({ success: true, log });
});

// ==================== REPORTS ====================

app.get('/api/reports/daily', verifyToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = usageLogs.filter(log => log.date === today);

  // Phone'ları groupla
  const report = {};
  Array.from(phones.values()).forEach(phone => {
    const phoneLog = todayLogs.find(log => log.phone_id === phone.id);
    report[phone.id] = {
      name: phone.name,
      type: phone.type,
      usage_seconds: phoneLog ? phoneLog.duration_seconds : 0,
      wifi_signal: phoneLog ? phoneLog.wifi_signal : 0,
      wifi_network: phoneLog ? phoneLog.wifi_network : 'N/A',
      wifi_speed: phoneLog ? phoneLog.wifi_speed : 0,
      battery: phoneLog ? phoneLog.battery : 0,
      last_seen: phone.lastSeen,
    };
  });

  const summary = {
    date: today,
    total_phones: phones.size,
    online_phones: Array.from(phones.values()).filter(p => p.isOnline).length,
    offline_phones: Array.from(phones.values()).filter(p => !p.isOnline).length,
    average_usage: Math.floor(
      todayLogs.reduce((sum, log) => sum + log.duration_seconds, 0) / (phones.size || 1)
    ),
    phones: report,
  };

  res.json(summary);
});

app.get('/api/reports/weekly', verifyToken, (req, res) => {
  const weekLogs = usageLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  });

  const report = {};
  Array.from(phones.values()).forEach(phone => {
    const phoneLogs = weekLogs.filter(log => log.phone_id === phone.id);
    report[phone.id] = {
      name: phone.name,
      total_usage_seconds: phoneLogs.reduce((sum, log) => sum + log.duration_seconds, 0),
      logs_count: phoneLogs.length,
      average_wifi_signal: Math.floor(
        phoneLogs.reduce((sum, log) => sum + log.wifi_signal, 0) / (phoneLogs.length || 1)
      ),
    };
  });

  res.json({
    period: '7 days',
    total_logs: weekLogs.length,
    phones: report,
  });
});

app.get('/api/reports/monthly', verifyToken, (req, res) => {
  const monthLogs = usageLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return logDate >= monthAgo;
  });

  const report = {};
  Array.from(phones.values()).forEach(phone => {
    const phoneLogs = monthLogs.filter(log => log.phone_id === phone.id);
    report[phone.id] = {
      name: phone.name,
      total_usage_seconds: phoneLogs.reduce((sum, log) => sum + log.duration_seconds, 0),
      logs_count: phoneLogs.length,
      average_battery: Math.floor(
        phoneLogs.reduce((sum, log) => sum + log.battery, 0) / (phoneLogs.length || 1)
      ),
    };
  });

  res.json({
    period: '30 days',
    total_logs: monthLogs.length,
    phones: report,
  });
});

// ==================== WIFI LOGS ====================

app.post('/api/wifi/log', verifyToken, (req, res) => {
  const { phone_id, action, network_name, signal_strength, speed_mbps } = req.body;

  const log = {
    id: wifiLogs.length + 1,
    phone_id,
    action, // on/off/connect/disconnect
    network_name,
    signal_strength,
    speed_mbps,
    timestamp: new Date(),
  };

  wifiLogs.push(log);
  console.log(`📶 WiFi log: ${phone_id} - ${action}`);

  res.json({ success: true, log });
});

app.get('/api/wifi/logs/:phoneId', verifyToken, (req, res) => {
  const phoneWiFiLogs = wifiLogs.filter(log => log.phone_id === req.params.phoneId);
  res.json(phoneWiFiLogs);
});

// ==================== EXPORT REPORTS ====================

app.get('/api/reports/export', verifyToken, (req, res) => {
  const { format, period } = req.query; // json, csv, excel

  const today = new Date().toISOString().split('T')[0];
  const periodLogs = usageLogs.filter(log => {
    if (period === 'daily') return log.date === today;
    if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(log.timestamp) >= weekAgo;
    }
    return true; // monthly
  });

  if (format === 'json') {
    res.json({
      period,
      exported_at: new Date(),
      total_logs: periodLogs.length,
      logs: periodLogs,
    });
  } else if (format === 'csv') {
    let csv = 'Phone ID,Date,Duration (seconds),WiFi Signal,WiFi Network,WiFi Speed,Battery\n';
    periodLogs.forEach(log => {
      csv += `${log.phone_id},${log.date},${log.duration_seconds},${log.wifi_signal},${log.wifi_network},${log.wifi_speed},${log.battery}\n`;
    });
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="report.csv"');
    res.send(csv);
  } else {
    res.status(400).json({ error: 'Unsupported format' });
  }
});

// ==================== WEBSOCKET ====================

wss.on('connection', (ws) => {
  let phoneData = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      const { type, phoneId, phone, action, value } = message;

      // Phone registration
      if (type === 'register-phone') {
        phoneData = {
          id: phoneId,
          name: phone.name,
          type: phone.type,
          battery: phone.battery,
          isOnline: true,
          volume: 50,
          ws: ws,
          lastSeen: new Date(),
          connectedTime: new Date(),
          wifi_enabled: phone.wifi_enabled,
          wifi_signal: phone.wifi_signal,
          wifi_network: phone.wifi_network,
          usage_time: 0,
        };

        phones.set(phoneId, phoneData);
        console.log(`📱 Phone registered: ${phoneData.name}`);

        ws.send(JSON.stringify({
          type: 'registration-confirmed',
          phoneId: phoneId,
        }));

        broadcastToDashboards({ type: 'phone-connected', phone: phoneData });
      }

      // Heartbeat
      if (type === 'heartbeat' && phoneData) {
        phoneData.battery = message.battery;
        phoneData.usage_time = message.usage_time;
        phoneData.wifi_enabled = message.wifi_enabled;
        phoneData.wifi_signal = message.wifi_signal;
        phoneData.lastSeen = new Date();
        phoneData.isOnline = true;
      }

      // WiFi toggled
      if (type === 'wifi-toggled' && phoneData) {
        phoneData.wifi_enabled = message.wifi_enabled;
        
        wifiLogs.push({
          phone_id: phoneId,
          action: message.wifi_enabled ? 'on' : 'off',
          timestamp: new Date(),
        });

        broadcastToDashboards({
          type: 'wifi-changed',
          phoneId,
          wifi_enabled: message.wifi_enabled,
        });
      }

      // Speed test result
      if (type === 'speed-test-result' && phoneData) {
        phoneData.wifi_speed = message.speed_mbps;
        
        broadcastToDashboards({
          type: 'speed-test-result',
          phoneId,
          speed_mbps: message.speed_mbps,
        });
      }

    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  });

  ws.on('close', () => {
    if (phoneData) {
      phoneData.isOnline = false;
      console.log(`📱 Phone disconnected: ${phoneData.name}`);
      broadcastToDashboards({ type: 'phone-disconnected', phoneId: phoneData.id });
    }
  });
});

// ==================== BROADCAST ====================

function broadcastToDashboards(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// ==================== COMMANDS ====================

app.post('/api/commands/:phoneId', verifyToken, (req, res) => {
  const { command, value } = req.body;
  const phone = phones.get(req.params.phoneId);

  if (!phone || !phone.isOnline) {
    return res.status(404).json({ error: 'Phone not found or offline' });
  }

  const cmd = {
    type: 'command',
    command,
    value,
  };

  if (phone.ws && phone.ws.readyState === WebSocket.OPEN) {
    phone.ws.send(JSON.stringify(cmd));
    res.json({ success: true, message: 'Command sent' });
  } else {
    res.status(500).json({ error: 'Cannot send command' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   MyPhoneControl Server Started        ║
║   Port: ${PORT}                            
║   Features: WiFi + Usage + Reports     ║
║   Phones Connected: 0                  ║
╚════════════════════════════════════════╝
  `);
});
