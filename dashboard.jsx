import { playSound } from './components.jsx';
import { useAuth } from './auth.jsx';

const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = window.Motion || window.framerMotion || {};

const CITY_COORDS = {
    'Tokyo, JP': { lat: 35.6762, lng: 139.6503 },
    'London, UK': { lat: 51.5074, lng: -0.1278 },
    'Singapore': { lat: 1.3521, lng: 103.8198 },
    'New York': { lat: 40.7128, lng: -74.0060 },
    'Berlin': { lat: 52.5200, lng: 13.4050 },
    'Seoul': { lat: 37.5665, lng: 126.9780 },
    'Sydney': { lat: -33.8688, lng: 151.2093 },
    'Global': { lat: 0, lng: 0 }
};

const ThreatFeed = ({ threats, onMitigate }) => {
    return (
        <div className="glass-panel p-4 rounded-lg border border-white/10 h-full flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2 relative z-10">
                <span className="text-xs font-orbitron text-brand-accent tracking-widest">LIVE THREAT FEED</span>
                <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse"></span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar relative z-10">
                <AnimatePresence>
                    {threats.map((t) => (
                        <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`text-[10px] md:text-xs font-mono p-3 bg-white/5 border-l-2 ${t.type === 'CRITICAL' ? 'border-red-500 bg-red-500/5' : 'border-brand-accent/30'} flex flex-col gap-1 relative group rounded-r`}>
                            <div className="flex justify-between"><span className={t.type === 'CRITICAL' ? 'text-red-500' : 'text-brand-emerald'}>[{t.type}]</span><span className="text-gray-500 text-[8px] uppercase">{t.location}</span></div>
                            <div className="text-white truncate font-bold">{t.action}</div>
                            <button onClick={() => onMitigate(t.id)} className="text-[8px] px-3 py-1 border border-brand-accent/30 text-brand-accent hover:bg-brand-accent hover:text-black transition-all opacity-0 group-hover:opacity-100 uppercase tracking-widest font-bold mt-2">MITIGATE</button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export const CommandCenter = ({ onExit }) => {
    const { user, token } = useAuth();
    const [threats, setThreats] = useState([]);
    const [mitigationLogs, setMitigationLogs] = useState([]);
    const [securityLevel, setSecurityLevel] = useState(user?.security_level || 'LOW');
    const [vpnActive, setVpnActive] = useState(user?.vpn_active || false);

    const updateRemoteSettings = async (updates) => {
        try { await fetch('/api/user/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(updates) }); } catch (e) {}
    };

    const handleMitigate = async (id) => {
        const threat = threats.find(t => t.id === id);
        if (!threat) return;
        playSound('click');
        try {
            const res = await fetch('/api/mitigate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ threat }) });
            const data = await res.json();
            if (data.success) {
                setMitigationLogs(prev => [`[${new Date().toLocaleTimeString()}] MITIGATION: ${data.message}`, ...prev].slice(0, 5));
                setThreats(prev => prev.filter(t => t.id !== id));
                playSound('success');
            }
        } catch (e) {}
    };

    const toggleSecurityLevel = (level) => { setSecurityLevel(level); updateRemoteSettings({ security_level: level }); playSound('click'); };
    const toggleVPN = () => { const newState = !vpnActive; setVpnActive(newState); updateRemoteSettings({ vpn_active: newState }); playSound('click'); };

    useEffect(() => {
        const interval = setInterval(() => {
            const locations = Object.keys(CITY_COORDS).filter(k => k !== 'Global');
            const newThreat = {
                id: Date.now(),
                type: ['CRITICAL', 'WARNING', 'INFO'][Math.floor(Math.random() * 3)],
                origin: 'DYNAMIC_IP',
                action: ['DDoS Mitigation', 'Brute Force Blocked', 'XSS Deflected'][Math.floor(Math.random() * 3)],
                location: locations[Math.floor(Math.random() * locations.length)]
            };
            setThreats(prev => [newThreat, ...prev].slice(0, 8));
        }, vpnActive ? 8000 : 4000);
        return () => clearInterval(interval);
    }, [vpnActive]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-brand-black flex flex-col p-4 md:p-8 pt-24 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 relative z-10">
                <div>
                    <h2 className="font-orbitron text-2xl text-white font-black uppercase tracking-tighter">Command_Center</h2>
                    <p className="text-[10px] font-mono text-brand-emerald">UPLINK_SECURE: AES-256-GCM | STATE: {securityLevel}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={toggleVPN} className={`px-4 py-2 border font-space text-[10px] tracking-widest ${vpnActive ? 'border-brand-emerald text-brand-emerald' : 'border-white/20 text-gray-500'}`}>VPN: {vpnActive ? 'ACTIVE' : 'OFFLINE'}</button>
                    <button onClick={onExit} className="px-6 py-2 border border-red-500/50 text-red-500 font-space text-xs hover:bg-red-500 hover:text-black uppercase">Disconnect</button>
                </div>
            </div>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 overflow-hidden">
                <div className="lg:col-span-3 h-full"><ThreatFeed threats={threats} onMitigate={handleMitigate} /></div>
                <div className="lg:col-span-9 glass-panel rounded-xl border border-white/10 p-8 flex items-center justify-center text-gray-500 font-orbitron text-xl">Tactical Visualization Active</div>
            </div>
        </motion.div>
    );
};
