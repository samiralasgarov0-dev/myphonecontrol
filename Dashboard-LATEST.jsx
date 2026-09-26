import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phones, setPhones] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('live'); // live, reports, wifi, settings
  const [reportPeriod, setReportPeriod] = useState('daily'); // daily, weekly, monthly
  const [reportData, setReportData] = useState(null);
  const ws = useRef(null);

  // ==================== LOGIN ====================
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setEmail('');
        setPassword('');
      } else {
        alert('Giriş başarısız');
      }
    } catch (err) {
      console.error('Login error:', err);
    }

    setIsLoading(false);
  };

  // ==================== FETCH PHONES ====================
  const fetchPhones = async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3001/api/phones', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      setPhones(data);
    } catch (err) {
      console.error('Fetch phones error:', err);
    }
  };

  // ==================== FETCH REPORTS ====================
  const fetchReport = async (period) => {
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3001/api/reports/${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error('Fetch report error:', err);
    }
  };

  // ==================== EXPORT REPORT ====================
  const exportReport = async (format) => {
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/reports/export?format=${format}&period=${reportPeriod}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportPeriod}.csv`;
        a.click();
      } else {
        const data = await response.json();
        const url = window.URL.createObjectURL(
          new Blob([JSON.stringify(data, null, 2)])
        );
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportPeriod}.json`;
        a.click();
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // ==================== WEBSOCKET ====================
  useEffect(() => {
    if (!token) return;

    ws.current = new WebSocket('ws://localhost:3001');

    ws.current.onopen = () => {
      console.log('✅ Dashboard WebSocket bağlı');
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'phone-connected' || message.type === 'phone-disconnected') {
        fetchPhones();
      }
    };

    fetchPhones();

    const interval = setInterval(fetchPhones, 5000);

    return () => {
      clearInterval(interval);
      if (ws.current) ws.current.close();
    };
  }, [token]);

  // ==================== LOGOUT ====================
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setPhones([]);
    setSelectedPhone(null);
  };

  // ==================== LOGIN PAGE ====================
  if (!token) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>🎮 MyPhoneControl</h1>
          <p>50 Telefon Kontrol Sistemi</p>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              defaultValue="eldarovski91@gmail.com"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              defaultValue="password123"
              required
            />

            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==================== DASHBOARD PAGE ====================
  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <h1>🎮 MyPhoneControl Dashboard</h1>
        <div className="header-info">
          <span>📱 Online: {phones.filter(p => p.isOnline).length}/{phones.length}</span>
          <button onClick={handleLogout} className="logout-btn">Çıkış</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          📱 Canlı
        </button>
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('reports');
            fetchReport(reportPeriod);
          }}
        >
          📊 Raporlar
        </button>
        <button 
          className={`tab ${activeTab === 'wifi' ? 'active' : ''}`}
          onClick={() => setActiveTab('wifi')}
        >
          📶 WiFi
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Ayarlar
        </button>
      </div>

      {/* TAB 1: LIVE */}
      {activeTab === 'live' && (
        <div className="container">
          <div className="phone-list">
            <h2>📱 Telefonlar ({phones.length})</h2>

            <div className="phones">
              {phones.map(phone => (
                <div
                  key={phone.id}
                  className={`phone-item ${selectedPhone?.id === phone.id ? 'active' : ''}`}
                  onClick={() => setSelectedPhone(phone)}
                >
                  <div className="phone-header">
                    <span className="phone-type">
                      {phone.type === 'Android' ? '🤖' : '🍎'} {phone.type}
                    </span>
                    <span className={`status ${phone.isOnline ? 'online' : 'offline'}`}>
                      {phone.isOnline ? '🟢' : '🔴'}
                    </span>
                  </div>

                  <div className="phone-name">{phone.name}</div>
                  <div className="phone-battery">🔋 {phone.battery}%</div>
                  <div className="phone-usage">⏱️ {Math.floor(phone.usage_time || 0)}s</div>
                  
                  {phone.wifi_enabled && (
                    <div className="phone-wifi" style={{
                      color: phone.wifi_signal > -50 ? '#4ade80' : phone.wifi_signal > -70 ? '#fbbf24' : '#ef4444'
                    }}>
                      📶 {phone.wifi_signal}dBm
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedPhone && (
            <div className="phone-control">
              <div className="control-header">
                <h2>{selectedPhone.name}</h2>
              </div>

              <div className="controls">
                <div className="control-group">
                  <label>🔊 Səs Seviyəsi</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="50"
                    className="volume-slider"
                  />
                </div>

                <div className="control-group">
                  <label>🔋 Batareya</label>
                  <div className="battery-bar">
                    <div
                      className="battery-fill"
                      style={{
                        width: `${selectedPhone.battery}%`,
                        backgroundColor: selectedPhone.battery < 20 ? '#ff4444' : '#44ff44'
                      }}
                    />
                  </div>
                  <span>{selectedPhone.battery}%</span>
                </div>

                <div className="button-group">
                  <button className="btn-unlock">🔓 Kilit Aç</button>
                  <button className="btn-home">🏠 Home</button>
                  <button className="btn-back">⬅️ Back</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REPORTS */}
      {activeTab === 'reports' && (
        <div className="reports-container">
          <div className="report-controls">
            <select value={reportPeriod} onChange={(e) => {
              setReportPeriod(e.target.value);
              fetchReport(e.target.value);
            }}>
              <option value="daily">Günlük</option>
              <option value="weekly">Haftalık</option>
              <option value="monthly">Aylık</option>
            </select>

            <button onClick={() => exportReport('csv')} className="export-btn">
              📥 CSV İndir
            </button>
            <button onClick={() => exportReport('json')} className="export-btn">
              📥 JSON İndir
            </button>
          </div>

          {reportData && (
            <div className="report-table">
              <h2>📊 {reportPeriod === 'daily' ? 'Günlük' : reportPeriod === 'weekly' ? 'Haftalık' : 'Aylık'} Rapor</h2>

              <div className="report-summary">
                <div className="summary-card">
                  <div className="summary-label">Toplam Telefon</div>
                  <div className="summary-value">{reportData.total_phones || Object.keys(reportData.phones).length}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Online</div>
                  <div className="summary-value" style={{ color: '#4ade80' }}>
                    {reportData.online_phones || phones.filter(p => p.isOnline).length}
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Offline</div>
                  <div className="summary-value" style={{ color: '#ef4444' }}>
                    {reportData.offline_phones || 0}
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Ort. Kullanım</div>
                  <div className="summary-value">
                    {Math.floor((reportData.average_usage || 0) / 3600)}h {Math.floor(((reportData.average_usage || 0) % 3600) / 60)}m
                  </div>
                </div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Telefon</th>
                    <th>Kullanım</th>
                    <th>WiFi Sinyal</th>
                    <th>WiFi Ağı</th>
                    <th>Hız (Mbps)</th>
                    <th>Batareya</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.phones || {}).map(([ phoneId, data ], idx) => (
                    <tr key={phoneId}>
                      <td>{idx + 1}</td>
                      <td>{data.name}</td>
                      <td>
                        {Math.floor(data.usage_seconds / 3600)}h {Math.floor((data.usage_seconds % 3600) / 60)}m
                      </td>
                      <td style={{
                        color: data.wifi_signal > -50 ? '#4ade80' : data.wifi_signal > -70 ? '#fbbf24' : '#ef4444'
                      }}>
                        {data.wifi_signal}dBm
                      </td>
                      <td>{data.wifi_network || 'N/A'}</td>
                      <td>{data.wifi_speed || 0}</td>
                      <td>{data.battery || 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WiFi */}
      {activeTab === 'wifi' && (
        <div className="wifi-container">
          <h2>📶 WiFi Kontrol</h2>

          <div className="wifi-controls">
            <div className="wifi-phone-list">
              {phones.map(phone => (
                <div key={phone.id} className="wifi-card">
                  <div className="wifi-card-header">
                    <h3>{phone.name}</h3>
                    <span className={`wifi-status ${phone.wifi_enabled ? 'enabled' : 'disabled'}`}>
                      {phone.wifi_enabled ? '🟢 Açık' : '🔴 Kapalı'}
                    </span>
                  </div>

                  {phone.wifi_enabled && (
                    <>
                      <div className="wifi-info">
                        <span>📍 Ağ: {phone.wifi_network}</span>
                        <span style={{
                          color: phone.wifi_signal > -50 ? '#4ade80' : phone.wifi_signal > -70 ? '#fbbf24' : '#ef4444'
                        }}>
                          📶 Sinyal: {phone.wifi_signal}dBm
                        </span>
                        <span>🚀 Hız: {phone.wifi_speed || 0} Mbps</span>
                      </div>

                      <div className="wifi-signal-bar">
                        <div
                          className="wifi-signal-fill"
                          style={{
                            width: `${Math.abs(phone.wifi_signal / 1.2)}%`,
                            backgroundColor: phone.wifi_signal > -50 ? '#4ade80' : phone.wifi_signal > -70 ? '#fbbf24' : '#ef4444'
                          }}
                        />
                      </div>
                    </>
                  )}

                  <div className="wifi-buttons">
                    <button className="btn-wifi-on">WiFi Aç</button>
                    <button className="btn-wifi-off">WiFi Kapat</button>
                    <button className="btn-speed-test">Hız Test</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="settings-container">
          <h2>⚙️ Ayarlar</h2>
          <div className="settings-box">
            <h3>📋 Sistem Bilgisi</h3>
            <p>✅ Backend: Çalışıyor</p>
            <p>✅ WebSocket: Bağlı</p>
            <p>✅ Telefonlar: {phones.length}</p>
            <p>✅ Online: {phones.filter(p => p.isOnline).length}</p>
            <p>Sürüm: 1.0.0 (WiFi + Reports)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
