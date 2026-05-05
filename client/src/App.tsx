import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sparkles, 
  Save, 
  Send, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  LayoutDashboard, 
  History, 
  Settings,
  PlusCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ParsedData {
  monto: number;
  descripcion: string;
  categoria: string;
  metodo_pago: string;
  tipo: 'ingreso' | 'egreso';
  fecha: string;
  caja: string;
}

interface SummaryData {
  ingresos: number;
  egresos: number;
  balance: number;
  totalRegistros: number;
  ultimosMovimientos: ParsedData[];
  saldosPorCaja: { [key: string]: number };
}

type View = 'dashboard' | 'transactions' | 'accounts';

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [summary, setSummary] = useState<SummaryData>({ 
    ingresos: 0, 
    egresos: 0, 
    balance: 0, 
    totalRegistros: 0,
    ultimosMovimientos: [],
    saldosPorCaja: {} 
  });
  const [cajas, setCajas] = useState<string[]>([]);
  const [newCaja, setNewCaja] = useState('');

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API_BASE}/summary`);
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchCajas = async () => {
    try {
      const response = await axios.get(`${API_BASE}/cajas`);
      setCajas(response.data);
    } catch (error) {
      console.error('Error fetching cajas:', error);
    }
  };

  const handleAddCaja = async () => {
    if (!newCaja.trim()) return;
    try {
      await axios.post(`${API_BASE}/cajas`, { nombre: newCaja });
      setNewCaja('');
      fetchCajas();
    } catch (error) {
      console.error('Error adding caja:', error);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchCajas();
  }, []);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setStatus(null);
    try {
      const response = await axios.post(`${API_BASE}/process`, { text });
      setParsedData(response.data.data);
    } catch (error) {
      setStatus({ type: 'error', message: 'Error al analizar el mensaje.' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedData) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/save`, { data: parsedData });
      setStatus({ type: 'success', message: '¡Registro guardado!' });
      setParsedData(null);
      setText('');
      fetchSummary();
    } catch (error) {
      setStatus({ type: 'error', message: 'Error al guardar el registro.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-section">
          <Sparkles className="text-primary" size={32} />
          <span>GastoBot</span>
        </div>

        <nav className="nav-links">
          <div 
            className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <div 
            className={`nav-item ${activeView === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveView('transactions')}
          >
            <History size={20} /> Movimientos
          </div>
          <div 
            className={`nav-item ${activeView === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveView('accounts')}
          >
            <Wallet size={20} /> Cuentas
          </div>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <div className="nav-item">
            <Settings size={20} /> Configuración
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '2.5rem' }}>
              {activeView === 'dashboard' ? 'Resumen Financiero' : 
               activeView === 'transactions' ? 'Historial de Gastos' : 'Gestión de Cuentas'}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Bienvenido de nuevo a tu asistente inteligente.</p>
          </div>
          
          <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, background: 'var(--success)', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sincronizado</span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="glass-panel stat-card">
                  <div className="stat-label">Ingresos Mensuales</div>
                  <div className="stat-value" style={{ color: 'var(--success)' }}>
                    ${summary.ingresos.toLocaleString()}
                    <TrendingUp size={24} style={{ marginLeft: '0.5rem' }} />
                  </div>
                </div>
                <div className="glass-panel stat-card">
                  <div className="stat-label">Gastos Mensuales</div>
                  <div className="stat-value" style={{ color: 'var(--error)' }}>
                    ${summary.egresos.toLocaleString()}
                    <TrendingDown size={24} style={{ marginLeft: '0.5rem' }} />
                  </div>
                </div>
                <div className="glass-panel stat-card" style={{ background: 'linear-gradient(135deg, rgba(0, 242, 255, 0.05), rgba(112, 0, 255, 0.05))' }}>
                  <div className="stat-label">Balance Total</div>
                  <div className="stat-value">
                    ${summary.balance.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* AI Input Section */}
              <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: 200, height: 200, background: 'var(--primary-glow)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }}></div>
                
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PlusCircle size={20} className="text-primary" /> Registrar nuevo movimiento
                </h3>

                <form onSubmit={handleProcess} className="input-group">
                  <input 
                    type="text" 
                    placeholder="Ej: 'Gasté 2500 en almuerzo con Mercado Pago'"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={loading}
                  />
                  <button type="submit" className="btn-primary" disabled={loading} style={{ position: 'absolute', right: '8px', top: '8px', padding: '0.75rem 1.5rem' }}>
                    {loading ? 'Analizando...' : <><Send size={18} /> Procesar</>}
                  </button>
                </form>

                {/* Preview Section */}
                <AnimatePresence>
                  {parsedData && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ marginTop: '2rem', borderTop: '1px solid var(--border-glass)', paddingTop: '2rem' }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
                        <div>
                          <div className="stat-label" style={{ fontSize: '0.7rem' }}>Descripción</div>
                          <div style={{ fontWeight: 600 }}>{parsedData.descripcion}</div>
                        </div>
                        <div>
                          <div className="stat-label" style={{ fontSize: '0.7rem' }}>Monto</div>
                          <div style={{ fontWeight: 700, color: parsedData.tipo === 'ingreso' ? 'var(--success)' : 'var(--error)' }}>
                            ${parsedData.monto.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="stat-label" style={{ fontSize: '0.7rem' }}>Cuenta</div>
                          <select 
                            style={{ 
                              background: 'var(--bg-glass)', 
                              border: '1px solid var(--border-glass)',
                              borderRadius: '8px',
                              color: 'white',
                              padding: '0.4rem',
                              width: '100%',
                              outline: 'none'
                            }}
                            value={parsedData.caja}
                            onChange={(e) => setParsedData({ ...parsedData, caja: e.target.value })}
                          >
                            {parsedData.caja === 'SIN_ASIGNAR' && <option value="SIN_ASIGNAR">⚠️ SELECCIONAR</option>}
                            {cajas.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                          <button 
                            onClick={handleConfirm} 
                            className="btn-primary" 
                            disabled={parsedData.caja === 'SIN_ASIGNAR' || loading}
                            style={{ width: '100%' }}
                          >
                            <Save size={18} /> Confirmar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {status && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ 
                      marginTop: '1.5rem', 
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: status.type === 'success' ? 'rgba(0, 255, 133, 0.1)' : 'rgba(255, 46, 91, 0.1)',
                      color: status.type === 'success' ? 'var(--success)' : 'var(--error)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    <AlertCircle size={18} /> {status.message}
                  </motion.div>
                )}
              </div>

              {/* Quick Table View */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3>Últimos Movimientos</h3>
                  <button onClick={() => setActiveView('transactions')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                    Ver todo <ChevronRight size={16} />
                  </button>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Descripción</th>
                        <th>Categoría</th>
                        <th>Cuenta</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.ultimosMovimientos.slice(0, 5).map((mov, i) => (
                        <tr key={i}>
                          <td>{mov.fecha}</td>
                          <td style={{ fontWeight: 500 }}>{mov.descripcion}</td>
                          <td><span className="badge" style={{ background: 'var(--bg-glass)' }}>{mov.categoria}</span></td>
                          <td>{mov.caja}</td>
                          <td style={{ color: mov.tipo === 'ingreso' ? 'var(--success)' : 'var(--error)', fontWeight: 700 }}>
                            {mov.tipo === 'ingreso' ? '+' : '-'}${mov.monto.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'transactions' && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-panel"
              style={{ padding: '2rem' }}
            >
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Descripción</th>
                      <th>Categoría</th>
                      <th>Cuenta</th>
                      <th>Monto</th>
                      <th>Método</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.ultimosMovimientos.map((mov, i) => (
                      <tr key={i}>
                        <td>{mov.fecha}</td>
                        <td style={{ fontWeight: 500 }}>{mov.descripcion}</td>
                        <td><span className="badge" style={{ background: 'var(--bg-glass)' }}>{mov.categoria}</span></td>
                        <td>{mov.caja}</td>
                        <td style={{ color: mov.tipo === 'ingreso' ? 'var(--success)' : 'var(--error)', fontWeight: 700 }}>
                          {mov.tipo === 'ingreso' ? '+' : '-'}${mov.monto.toLocaleString()}
                        </td>
                        <td>{mov.metodo_pago}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeView === 'accounts' && (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="stats-grid"
            >
              <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Agregar Nueva Cuenta</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input 
                    type="text" 
                    placeholder="Nombre de la cuenta (ej: Banco Galicia)" 
                    value={newCaja}
                    onChange={(e) => setNewCaja(e.target.value)}
                  />
                  <button onClick={handleAddCaja} className="btn-primary">
                    <PlusCircle size={18} /> Agregar
                  </button>
                </div>
              </div>
              
              {cajas.map(c => (
                <div key={c} className="glass-panel stat-card">
                  <div className="stat-label">Saldo en {c}</div>
                  <div className="stat-value" style={{ color: (summary.saldosPorCaja[c] || 0) >= 0 ? 'var(--success)' : 'var(--error)' }}>
                    ${(summary.saldosPorCaja[c] || 0).toLocaleString()}
                  </div>
                  <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {summary.ultimosMovimientos.filter(m => m.caja === c).length} movimientos registrados
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
