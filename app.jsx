const { useState, useEffect, useRef, createContext, useContext } = React;
const { motion, AnimatePresence } = window.Motion || window.framerMotion || {};

// --- GLOBAL DATA & CONSTANTS ---
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

// --- AUTH SYSTEM ---
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('aegis_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) fetchUser();
        else setLoading(false);
    }, [token]);

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/user/settings', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setUser({ email: 'authorized@aegis.sys', ...data });
            } else logout();
        } catch (e) { logout(); } finally { setLoading(false); }
    };

    const login = async (email, password) => {
        const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('aegis_token', data.token);
            setToken(data.token);
            setUser(data.user);
            return { success: true };
        }
        return { success: false, message: data.message };
    };

    const register = async (email, password, company) => {
        const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, company }) });
        return await res.json();
    };

    const logout = () => { localStorage.removeItem('aegis_token'); setToken(null); setUser(null); };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

// --- UTILITIES ---
const playSound = (type) => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        if (type === 'hover') {
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            osc.start(); osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'success') {
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            osc.start(); osc.stop(ctx.currentTime + 0.3);
        }
    } catch(e) {}
};

// --- SHARED COMPONENTS ---
const Toast = ({ message, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
    return (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-24 right-8 z-50 p-4 rounded border glass-panel ${type === 'success' ? 'border-brand-emerald text-brand-emerald' : 'border-red-500 text-red-500'}`}>
            {message}
        </motion.div>
    );
};

const BootSequence = ({ onComplete }) => {
    const [index, setIndex] = useState(0);
    const lines = ["AEGIS_CORE INITIALIZING...", "CONNECTING TO NEURAL_GRID...", "AUTHENTICATING...", "SYSTEM_ARMED"];
    useEffect(() => {
        if (index < lines.length) setTimeout(() => setIndex(index + 1), 400);
        else setTimeout(onComplete, 800);
    }, [index]);
    return (
        <div className="fixed inset-0 z-[100] bg-brand-black flex items-center justify-center font-mono text-sm text-brand-accent">
            <div className="max-w-md w-full p-8 border border-white/10 bg-white/5">
                {lines.slice(0, index).map((l, i) => <div key={i}>> {l}</div>)}
                <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(index/lines.length)*100}%` }} className="h-full bg-brand-accent" />
                </div>
            </div>
        </div>
    );
};

const CyberBackground = () => {
    const mountRef = useRef(null);
    useEffect(() => {
        const mount = mountRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        mount.appendChild(renderer.domElement);
        const geometry = new THREE.SphereGeometry(3, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: '#00F0FF', wireframe: true, transparent: true, opacity: 0.1 });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
        camera.position.z = 7;
        const animate = () => { requestAnimationFrame(animate); sphere.rotation.y += 0.002; renderer.render(scene, camera); };
        animate();
        return () => { mount.removeChild(renderer.domElement); renderer.dispose(); };
    }, []);
    return <div ref={mountRef} className="fixed inset-0 pointer-events-none -z-10" />;
};

const SystemInitialization = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => { if (prev >= 100) { clearInterval(interval); setTimeout(onComplete, 500); return 100; } return prev + 5; });
        }, 100);
        return () => clearInterval(interval);
    }, [onComplete]);
    return (
        <div className="fixed inset-0 z-[200] bg-brand-black flex items-center justify-center p-8">
            <div className="max-w-md w-full">
                <div className="mb-4 flex justify-between font-orbitron text-brand-accent text-xs"><span>INITIALIZING_AEGIS</span><span>{progress}%</span></div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${progress}%` }} className="h-full bg-brand-accent" />
                </div>
            </div>
        </div>
    );
};

// --- PAGE COMPONENTS ---
const Hero = ({ onDeployClick, onViewChange }) => (
    <section className="min-h-screen flex items-center justify-center pt-20 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="font-orbitron text-5xl md:text-7xl font-bold text-white mb-6 uppercase tracking-tighter">The Apex of<br/><span className="text-brand-accent">Digital Armor.</span></h1>
                <p className="font-space text-lg text-gray-400 mb-8 max-w-xl">Autonomous AI-driven defensive matrices to neutralize zero-day threats in real-time.</p>
                <div className="flex gap-4">
                    <button onClick={onDeployClick} className="px-8 py-4 bg-brand-accent text-black font-bold font-orbitron tracking-widest hover:bg-white transition-colors">DEPLOY NOW</button>
                    <button onClick={() => onViewChange('platform')} className="px-8 py-4 border border-white/20 text-white font-space tracking-widest hover:bg-white/10 transition-colors">VIEW SYSTEM</button>
                </div>
            </motion.div>
        </div>
    </section>
);

const Features = () => (
    <section className="py-24 px-6 bg-brand-dark/50 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center font-orbitron">
            {['Neural Prediction', 'Zero-Trust', 'Autonomous Response'].map(f => (
                <div key={f} className="glass-panel p-8 rounded border border-white/10 hover:border-brand-accent/50 transition-all">
                    <h3 className="text-white text-xl mb-2">{f}</h3>
                    <p className="text-gray-500 font-space text-xs uppercase tracking-widest">Enterprise_Ready_Module</p>
                </div>
            ))}
        </div>
    </section>
);

const PlatformPage = () => (
    <div className="min-h-screen pt-32 p-8"><div className="max-w-4xl mx-auto glass-panel p-12 border border-white/10"><h2 className="font-orbitron text-4xl text-white mb-6">PLATFORM</h2><p className="text-gray-400 font-space leading-relaxed">Next-generation cybersecurity architecture for the decentralized future.</p></div></div>
);

const ContactPage = () => (
    <div className="min-h-screen pt-32 p-8"><div className="max-w-2xl mx-auto glass-panel p-12 border border-white/10"><h2 className="font-orbitron text-4xl text-white mb-6">CONTACT API</h2><form className="flex flex-col gap-6"><input className="bg-white/5 border border-white/10 p-4 text-white" placeholder="IDENTIFICATION" /><textarea className="bg-white/5 border border-white/10 p-4 text-white" placeholder="MESSAGE" rows="4"></textarea><button className="bg-brand-accent p-4 text-black font-bold">INITIATE UPLINK</button></form></div></div>
);

const DeploymentPage = ({ onComplete }) => {
    const [data, setData] = useState({ companyName: '', email: '' });
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); try { const res = await fetch('/api/deploy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (res.ok) onComplete(); } finally { setLoading(false); } };
    return (
        <div className="min-h-screen pt-32 flex items-center justify-center p-6">
            <div className="max-w-md w-full glass-panel p-8 border border-brand-accent/30">
                <h2 className="font-orbitron text-2xl text-white mb-6">PROVISION_AEGIS</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <input required className="bg-white/5 border border-white/10 p-4 text-white" placeholder="ORG_ID" value={data.companyName} onChange={e => setData({...data, companyName: e.target.value})} />
                    <input required className="bg-white/5 border border-white/10 p-4 text-white" placeholder="ADMIN_EMAIL" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
                    <button className="bg-brand-accent p-4 text-black font-bold">{loading ? 'PROVISIONING...' : 'INITIATE SEQUENCE'}</button>
                </form>
            </div>
        </div>
    );
};

const CommandCenter = ({ onExit }) => {
    const { user, token } = useAuth();
    const [threats, setThreats] = useState([]);
    const [vpn, setVpn] = useState(user?.vpn_active || false);
    
    useEffect(() => {
        const i = setInterval(() => {
            const t = { id: Date.now(), type: 'WARNING', action: 'Port Scan Blocked', location: 'London, UK' };
            setThreats(prev => [t, ...prev].slice(0, 5));
        }, vpn ? 8000 : 4000);
        return () => clearInterval(i);
    }, [vpn]);

    const toggleVpn = async () => {
        const next = !vpn; setVpn(next);
        await fetch('/api/user/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ vpn_active: next }) });
    };

    return (
        <div className="fixed inset-0 z-[60] bg-brand-black p-8 pt-24 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <h2 className="font-orbitron text-2xl text-white uppercase tracking-tighter">Command_Center</h2>
                <div className="flex gap-4">
                    <button onClick={toggleVpn} className={`px-4 py-2 border text-[10px] ${vpn ? 'border-brand-emerald text-brand-emerald' : 'border-white/20 text-gray-500'}`}>VPN: {vpn ? 'ACTIVE' : 'OFFLINE'}</button>
                    <button onClick={onExit} className="px-4 py-2 border border-red-500 text-red-500 uppercase text-[10px]">Disconnect</button>
                </div>
            </div>
            <div className="flex-1 grid lg:grid-cols-4 gap-6 overflow-hidden">
                <div className="glass-panel p-4 border border-white/10 overflow-y-auto">
                    <span className="text-brand-accent text-[10px] font-orbitron mb-4 block">THREAT_LOG</span>
                    {threats.map(t => (
                        <div key={t.id} className="text-[10px] font-mono text-gray-400 p-2 border-b border-white/5 flex justify-between">
                            <span>{t.action}</span><span>{t.location}</span>
                        </div>
                    ))}
                </div>
                <div className="lg:col-span-3 glass-panel border border-white/10 flex items-center justify-center text-gray-600 font-orbitron">VISUALIZATION_ACTIVE</div>
            </div>
        </div>
    );
};

// --- AUTH PAGE ---
const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', company: '' });
    const [error, setError] = useState('');
    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError('');
        try {
            const res = isLogin ? await login(formData.email, formData.password) : await register(formData.email, formData.password, formData.company);
            if (!res.success) setError(res.message);
            else if (!isLogin) setIsLogin(true);
        } catch (err) { setError('Network Error'); } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-black p-6">
            <CyberBackground />
            <div className="max-w-md w-full glass-panel p-8 border border-white/10 z-10">
                <h2 className="font-orbitron text-2xl text-white text-center mb-8 uppercase tracking-widest">Aegis_<span className="text-brand-accent">{isLogin ? 'Access' : 'Provision'}</span></h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="text-red-500 text-[10px] text-center border border-red-500/30 p-2">{error}</div>}
                    {!isLogin && <input className="w-full bg-white/5 border border-white/10 p-3 text-white" placeholder="ORG_ID" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />}
                    <input type="email" className="w-full bg-white/5 border border-white/10 p-3 text-white" placeholder="EMAIL" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <input type="password" className="w-full bg-white/5 border border-white/10 p-3 text-white" placeholder="PASSWORD" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    <button type="submit" disabled={loading} className="w-full py-4 bg-brand-accent text-black font-bold font-orbitron">{isLogin ? 'INITIATE' : 'REGISTER'}</button>
                </form>
                <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-[10px] text-gray-500 uppercase tracking-widest hover:text-brand-accent">{isLogin ? 'New Credentials' : 'Login Portal'}</button>
            </div>
        </div>
    );
};

// --- CORE UI ---
const Navbar = ({ onInit, onNav, view, onLogout }) => (
    <nav className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-white/5 p-4 px-8 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNav('home')}><div className="w-6 h-6 bg-brand-accent/20 border border-brand-accent flex items-center justify-center"><svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div><span className="font-orbitron font-bold text-lg text-white">AEGIS</span></div>
        <div className="hidden md:flex gap-8 text-[10px] text-gray-400 font-orbitron tracking-widest">
            {['platform', 'contact'].map(v => <button key={v} onClick={() => onNav(v)} className={`hover:text-brand-accent ${view === v ? 'text-brand-accent' : ''}`}>{v.toUpperCase()}</button>)}
        </div>
        <div className="flex gap-4 items-center">
            {onLogout && <button onClick={onLogout} className="text-[10px] text-gray-600 hover:text-red-500 uppercase tracking-widest">Logout</button>}
            <button onClick={onInit} className="px-4 py-2 border border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-black text-[10px] font-orbitron">INITIALIZE</button>
        </div>
    </nav>
);

const MainContent = () => {
    const { user, loading: authLoading, logout } = useAuth();
    const [boot, setBoot] = useState(true);
    const [view, setView] = useState('home');
    const [init, setInit] = useState(false);

    useEffect(() => { if (!authLoading) setTimeout(() => setBoot(false), 1500); }, [authLoading]);

    if (authLoading || boot) return <BootSequence onComplete={() => {}} />;
    if (!user) return <AuthPage />;

    const render = () => {
        switch(view) {
            case 'platform': return <PlatformPage />;
            case 'contact': return <ContactPage />;
            case 'deploy': return <DeploymentPage onComplete={() => setView('home')} />;
            case 'command': return <CommandCenter onExit={() => setView('home')} />;
            default: return <><Hero onDeployClick={() => setView('deploy')} onViewChange={setView} /><Features /></>;
        }
    };

    return (
        <div className="min-h-screen bg-brand-black text-white selection:bg-brand-accent selection:text-black">
            <CyberBackground />
            <Navbar onInit={() => setInit(true)} onNav={setView} view={view} onLogout={logout} />
            <AnimatePresence mode="wait">
                {init ? (
                    <SystemInitialization key="init" onComplete={() => { setInit(false); setView('command'); playSound('success'); }} />
                ) : (
                    <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>{render()}</motion.div>
                )}
            </AnimatePresence>
            <footer className="p-8 text-center text-gray-700 text-[8px] uppercase tracking-[0.3em] font-space border-t border-white/5 mt-auto">© 2026 Aegis Systems // Secure Data Uplink Verified</footer>
        </div>
    );
};

const App = () => <AuthProvider><MainContent /></AuthProvider>;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
