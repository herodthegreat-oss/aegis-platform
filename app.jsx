// Aegis Production - High-Fidelity Futuristic UI
const { useState, useEffect, useRef, createContext, useContext } = React;
const { motion, AnimatePresence, useScroll, useTransform } = window.Motion || window.framerMotion || { motion: { div: (props) => <div {...props}>{props.children}</div>, section: (props) => <section {...props}>{props.children}</div>, nav: (props) => <nav {...props}>{props.children}</div>, h1: (props) => <h1 {...props}>{props.children}</h1>, p: (props) => <p {...props}>{props.children} p></p>, button: (props) => <button {...props}>{props.children}</button> }, AnimatePresence: ({children}) => children };

// --- AUDIO SYSTEM ---
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
            gain.gain.setValueAtTime(0.01, ctx.currentTime);
            osc.start(); osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'success') {
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            osc.start(); osc.stop(ctx.currentTime + 0.3);
        }
    } catch(e) {}
};

// --- AUTH CONTEXT ---
const AuthContext = createContext(null);
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('aegis_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verify = async () => {
            if (!token) { setLoading(false); return; }
            try {
                const r = await fetch('/api/user/settings', { headers: { 'Authorization': `Bearer ${token}` } });
                if (r.ok) setUser({ email: 'authorized@aegis.sys', ...(await r.json()) });
                else { localStorage.removeItem('aegis_token'); setToken(null); }
            } catch(e) {} finally { setLoading(false); }
        };
        verify();
    }, [token]);

    const login = async (email, password) => {
        try {
            const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const d = await r.json();
            if (d.success) {
                localStorage.setItem('aegis_token', d.token);
                setToken(d.token);
                setUser(d.user);
                return { success: true };
            }
            return { success: false, message: d.message };
        } catch(e) { return { success: false, message: "Link unstable." }; }
    };

    const register = async (email, password, company) => {
        try {
            const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, company }) });
            return await r.json();
        } catch(e) { return { success: false, message: "Link unstable." }; }
    };

    const logout = () => { localStorage.removeItem('aegis_token'); setToken(null); setUser(null); };

    return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>;
};

// --- UI COMPONENTS ---

const CyberBackground = () => {
    const ref = useRef();
    useEffect(() => {
        if (!window.THREE || !ref.current) return;
        const mount = ref.current;
        const s = new THREE.Scene(), c = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000), r = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        r.setSize(window.innerWidth, window.innerHeight); mount.appendChild(r.domElement);
        const g = new THREE.Group(); s.add(g);
        const geo = new THREE.SphereGeometry(3.5, 32, 32), mat = new THREE.MeshBasicMaterial({ color: '#00F0FF', wireframe: true, transparent: true, opacity: 0.1 });
        const globe = new THREE.Mesh(geo, mat); g.add(globe);
        const ptsGeo = new THREE.BufferGeometry(); const ptsCount = 1000; const pos = new Float32Array(ptsCount * 3);
        for(let i=0; i<ptsCount; i++) { pos[i*3]=(Math.random()-0.5)*15; pos[i*3+1]=(Math.random()-0.5)*15; pos[i*3+2]=(Math.random()-0.5)*15; }
        ptsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.add(new THREE.Points(ptsGeo, new THREE.PointsMaterial({ size: 0.02, color: '#7B2CBF', transparent: true, opacity: 0.5 })));
        c.position.z = 8;
        const anim = () => { if (ref.current) { requestAnimationFrame(anim); g.rotation.y += 0.001; g.rotation.x += 0.0005; r.render(s, c); } };
        anim();
        window.onresize = () => { c.aspect=window.innerWidth/window.innerHeight; c.updateProjectionMatrix(); r.setSize(window.innerWidth, window.innerHeight); };
        return () => { if (mount.contains(r.domElement)) mount.removeChild(r.domElement); r.dispose(); };
    }, []);
    return <div ref={ref} className="fixed inset-0 -z-10 pointer-events-none" />;
};

const BootSequence = ({ onComplete }) => {
    const [lines, setLines] = useState([]);
    const [idx, setIdx] = useState(0);
    const bootLines = ["INITIALIZING AEGIS CORE...", "SYNCING NEURAL_GRID_v9...", "QUANTUM_KEYS AUTHENTICATED", "UPLINK STABLE // STATUS_READY"];
    useEffect(() => {
        if (idx < bootLines.length) setTimeout(() => { setLines(p => [...p, bootLines[idx]]); setIdx(idx+1); }, 400);
        else setTimeout(onComplete, 800);
    }, [idx]);
    return (
        <div className="fixed inset-0 bg-brand-black z-[100] flex items-center justify-center p-8 font-mono text-brand-emerald">
            <div className="max-w-md w-full border border-white/10 bg-white/5 p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-accent/20 overflow-hidden">
                    <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity }} className="h-full bg-brand-accent shadow-[0_0_15px_#00F0FF]" />
                </div>
                {lines.map((l, i) => <div key={i} className="mb-2 tracking-widest">> {l}</div>)}
                <div className="mt-8 flex justify-between items-end">
                    <span className="text-[8px] opacity-50 uppercase">Neural Link Established</span>
                    <span className="text-2xl font-orbitron text-brand-accent">{Math.min(100, Math.floor((idx/bootLines.length)*100))}%</span>
                </div>
            </div>
        </div>
    );
};

const Navbar = ({ onNav, currentView, onLogout, user, onInitialize }) => (
    <nav className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNav('home')}>
            <div className="w-8 h-8 rounded border border-brand-accent flex items-center justify-center text-brand-accent group-hover:bg-brand-accent group-hover:text-black transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <span className="font-orbitron font-black text-xl tracking-[0.2em] text-white">AEGIS</span>
        </div>
        <div className="hidden md:flex gap-10 font-orbitron text-[10px] tracking-[0.3em] text-gray-400">
            {['Platform', 'Contact'].map(v => (
                <button key={v} onClick={() => onNav(v.toLowerCase())} className={`hover:text-brand-accent transition-colors ${currentView === v.toLowerCase() ? 'text-brand-accent' : ''}`}>{v.toUpperCase()}</button>
            ))}
        </div>
        <div className="flex items-center gap-6">
            {user && <button onClick={onLogout} className="text-[10px] font-orbitron text-gray-600 hover:text-red-500 uppercase tracking-widest hidden sm:block">Logout</button>}
            <button onClick={onInitialize} className="px-6 py-2 border border-brand-accent text-brand-accent font-orbitron text-[10px] tracking-widest hover:bg-brand-accent hover:text-black transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]">INITIALIZE SYS</button>
        </div>
    </nav>
);

// --- PAGE COMPONENTS ---

const Hero = ({ onDeployClick, onNav }) => (
    <section className="min-h-screen flex items-center justify-center pt-20 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-emerald/30 bg-brand-emerald/10 mb-8">
                    <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse"></span>
                    <span className="text-[10px] font-orbitron text-brand-emerald tracking-widest uppercase">System Operational</span>
                </div>
                <h1 className="font-orbitron text-5xl md:text-8xl font-black text-white mb-8 leading-none tracking-tighter uppercase">
                    The <span className="text-brand-accent text-glow">Apex</span> of<br/>Digital Armor.
                </h1>
                <p className="font-space text-lg text-gray-400 mb-10 max-w-xl leading-relaxed uppercase tracking-wider">
                    Autonomous AI-driven defensive matrices to neutralize zero-day threats before they execute. Next-generation cryptography meets quantum-resistant architecture.
                </p>
                <div className="flex flex-wrap gap-6">
                    <button onClick={onDeployClick} className="px-10 py-5 bg-brand-accent text-black font-black font-orbitron tracking-widest hover:bg-white transition-all shadow-[0_0_30px_rgba(0,240,255,0.4)]">DEPLOY NOW</button>
                    <button onClick={() => onNav('platform')} className="px-10 py-5 border border-white/10 glass-panel text-white font-orbitron tracking-widest hover:bg-white/5 transition-all">SYSTEM_ARCH</button>
                </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.5 }} className="relative hidden lg:block">
                <div className="glass-panel p-8 rounded-2xl border border-brand-neon/30 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-brand-neon/5 opacity-20"></div>
                    <div className="relative z-10 space-y-6 font-mono">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <span className="text-xs text-brand-accent">THREAT_RADAR_v2.4</span>
                            <div className="flex gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div><div className="w-2 h-2 rounded-full bg-yellow-500"></div><div className="w-2 h-2 rounded-full bg-brand-emerald"></div></div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white/5 p-4 rounded border border-white/5"><div className="text-[10px] text-gray-500 uppercase mb-1">Incursions</div><div className="text-2xl font-orbitron text-white">1.49M</div></div>
                            <div className="bg-white/5 p-4 rounded border border-white/5"><div className="text-[10px] text-brand-emerald uppercase mb-1">Integrity</div><div className="text-2xl font-orbitron text-white">99.9%</div></div>
                        </div>
                        <div className="h-32 w-full bg-white/5 rounded border border-white/5 flex items-end p-2 gap-1">
                            {[40,70,30,90,50,80,40,60,20,95].map((h,i) => <motion.div key={i} animate={{ height: [`${h}%`, `${h+5}%`, `${h}%`] }} transition={{ duration: 2, repeat: Infinity, delay: i*0.1 }} className="flex-1 bg-brand-accent/40 rounded-t" />)}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    </section>
);

const Features = () => (
    <section className="py-32 px-6 bg-brand-dark/50 border-t border-white/5 relative">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
            {[
                { t: "Neural Prediction", d: "Quantum-accelerated AI models analyze network telemetry to identify zero-day vulnerabilities in microseconds.", c: "brand-accent" },
                { t: "Zero-Trust Mesh", d: "Continuous micro-authentication at every endpoint. Every connection is encrypted and verified.", c: "brand-neon" },
                { t: "Auto Response", d: "Self-healing protocols instantly reroute traffic and isolate compromised sectors upon breach.", c: "brand-emerald" }
            ].map((f, i) => (
                <motion.div key={i} whileHover={{ y: -10 }} className="glass-panel p-10 rounded-2xl border border-white/10 hover:border-brand-accent/50 transition-all group">
                    <div className={`w-12 h-1 bg-${f.c} mb-8 shadow-[0_0_10px_#00F0FF]`}></div>
                    <h3 className="font-orbitron text-xl font-black text-white mb-4 uppercase group-hover:text-brand-accent transition-colors">{f.t}</h3>
                    <p className="font-space text-gray-400 text-sm leading-relaxed uppercase tracking-wider">{f.d}</p>
                </motion.div>
            ))}
        </div>
    </section>
);

const AuthPage = () => {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ email: '', pass: '', org: '' });
    const [err, setErr] = useState(''), [loading, setLoading] = useState(false);
    
    const submit = async (e) => {
        e.preventDefault(); setLoading(true); setErr(''); playSound('click');
        const res = isLogin ? await login(form.email, form.pass) : await register(form.email, form.pass, form.org);
        if (res.success) { if (!isLogin) setIsLogin(true); playSound('success'); }
        else setErr(res.message);
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-brand-black relative overflow-hidden">
            <CyberBackground />
            <div className="absolute inset-0 cyber-grid opacity-20"></div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
                <div className="glass-panel p-10 rounded-3xl border border-white/10 backdrop-blur-3xl relative overflow-hidden">
                    {loading && <div className="absolute inset-0 bg-brand-black/60 z-50 flex items-center justify-center font-orbitron text-[10px] text-brand-accent animate-pulse tracking-widest">VERIFYING_IDENTITY...</div>}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 border border-brand-accent flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                            <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h2 className="font-orbitron text-2xl font-black text-white tracking-[0.3em] text-center">AEGIS_<span className="text-brand-accent">{isLogin ? 'ACCESS' : 'PROVISION'}</span></h2>
                    </div>
                    <form onSubmit={submit} className="space-y-6">
                        {err && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-mono text-center uppercase tracking-widest">{err}</div>}
                        {!isLogin && <input className="w-full bg-white/5 border border-white/10 p-4 text-white font-space text-sm focus:border-brand-accent outline-none" placeholder="ORGANIZATION_CODE" value={form.org} onChange={e=>setForm({...form, org:e.target.value})} required />}
                        <input className="w-full bg-white/5 border border-white/10 p-4 text-white font-space text-sm focus:border-brand-accent outline-none" type="email" placeholder="ADMIN_IDENTIFIER" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
                        <input className="w-full bg-white/5 border border-white/10 p-4 text-white font-space text-sm focus:border-brand-accent outline-none" type="password" placeholder="NEURAL_PASSKEY" value={form.pass} onChange={e=>setForm({...form, pass:e.target.value})} required />
                        <button type="submit" className="w-full py-5 bg-brand-accent text-black font-black font-orbitron tracking-[0.3em] hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]">{isLogin ? 'INITIATE_SESSION' : 'REGISTER_ENDPOINT'}</button>
                    </form>
                    <button onClick={()=>setIsLogin(!isLogin)} className="w-full mt-10 text-[10px] font-orbitron text-gray-500 hover:text-brand-accent uppercase tracking-widest transition-colors">{isLogin ? 'Generate_New_Credentials' : 'Return_to_Portal'}</button>
                </div>
            </motion.div>
        </div>
    );
};

const CommandCenter = ({ onExit }) => {
    const { user, token } = useAuth();
    const [threats, setThreats] = useState([]);
    const [logs, setLogs] = useState([]);
    const [vpn, setVpn] = useState(user?.vpn_active || false);

    const toggleVpn = async () => {
        const next = !vpn; setVpn(next);
        try { await fetch('/api/user/settings', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({vpn_active:next}) }); } catch(e){}
    };

    useEffect(() => {
        const i = setInterval(() => {
            const t = { id:Date.now(), type:Math.random()>0.8?'CRITICAL':'WARNING', action:['SQL Injection Blocked','DDoS Mitigated','Port Scan Deflected'][Math.floor(Math.random()*3)], origin:`${Math.floor(Math.random()*255)}.12.44.${Math.floor(Math.random()*255)}` };
            setThreats(p => [t, ...p].slice(0, 8));
        }, vpn ? 8000 : 4000);
        return () => clearInterval(i);
    }, [vpn]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-brand-black flex flex-col pt-24 p-6 md:p-12 overflow-hidden">
            <div className="flex justify-between items-center mb-10 relative z-10">
                <div>
                    <h2 className="font-orbitron text-3xl text-white font-black tracking-tighter uppercase">Command_Center</h2>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse"></span>
                        <span className="font-mono text-[10px] text-brand-emerald uppercase tracking-[0.2em]">Neural Sync Active // Protocol v9.42</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <button onClick={toggleVpn} className={`px-6 py-3 border font-orbitron text-[10px] tracking-[0.2em] transition-all ${vpn ? 'border-brand-emerald text-brand-emerald bg-brand-emerald/5' : 'border-white/10 text-gray-500'}`}>VPN: {vpn ? 'ARMED' : 'OFFLINE'}</button>
                    <button onClick={onExit} className="px-8 py-3 border border-red-500/50 text-red-500 font-orbitron text-[10px] tracking-[0.2em] hover:bg-red-500 hover:text-black transition-all uppercase">Disconnect</button>
                </div>
            </div>
            <div className="flex-1 grid lg:grid-cols-4 gap-8 relative z-10 overflow-hidden">
                <div className="glass-panel p-6 border border-white/10 rounded-2xl flex flex-col h-full overflow-hidden">
                    <h3 className="text-brand-accent font-orbitron text-[10px] tracking-widest mb-6 border-b border-white/5 pb-4 uppercase">Real-Time Threat Feed</h3>
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                        <AnimatePresence>
                            {threats.map(t => (
                                <motion.div key={t.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`p-4 bg-white/5 border-l-2 ${t.type==='CRITICAL'?'border-red-500 bg-red-500/5':'border-brand-accent/40'} rounded-r`}>
                                    <div className="flex justify-between text-[8px] font-mono mb-2">
                                        <span className={t.type==='CRITICAL'?'text-red-500':'text-brand-accent'}>[{t.type}]</span>
                                        <span className="text-gray-500">{t.origin}</span>
                                    </div>
                                    <div className="text-[10px] text-white font-space uppercase tracking-wider font-bold">{t.action}</div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
                <div className="lg:col-span-3 glass-panel border border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 cyber-grid opacity-10"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-32 h-32 rounded-full border-2 border-brand-accent/20 flex items-center justify-center mb-8 relative">
                            <div className="absolute inset-0 rounded-full border-t-2 border-brand-accent animate-spin" style={{ animationDuration: '3s' }}></div>
                            <svg className="w-12 h-12 text-brand-accent animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                        </div>
                        <h3 className="font-orbitron text-xl text-white tracking-[0.4em] uppercase mb-4">Tactical_Visualizer</h3>
                        <p className="text-gray-500 font-space text-[10px] tracking-[0.2em] uppercase">Processing Global Telemetry...</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- SYSTEM INITIALIZATION ---
const SystemInitialization = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("SYNCHRONIZING_LINK...");
    useEffect(() => {
        const i = setInterval(() => {
            setProgress(p => {
                if (p >= 100) { clearInterval(i); setTimeout(onComplete, 500); return 100; }
                const next = p + Math.floor(Math.random()*15);
                if (next > 30) setStatus("PROVISIONING_ISOLATED_CONTAINERS...");
                if (next > 60) setStatus("ARMING_DEFENSE_MATRICES...");
                if (next > 90) setStatus("SYSTEM_ARMED");
                return Math.min(100, next);
            });
        }, 400);
        return () => clearInterval(i);
    }, [onComplete]);
    return (
        <div className="fixed inset-0 z-[200] bg-brand-black flex items-center justify-center p-8 overflow-hidden">
            <div className="absolute inset-0 cyber-grid opacity-10"></div>
            <div className="max-w-xl w-full relative z-10">
                <div className="mb-10 flex justify-between items-end">
                    <div>
                        <h2 className="font-orbitron text-brand-accent text-3xl font-black tracking-[0.4em] mb-4 text-glow">INITIALIZING</h2>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></div>
                            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">{status}</span>
                        </div>
                    </div>
                    <span className="font-orbitron text-4xl text-white opacity-20">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <motion.div animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-brand-neon to-brand-accent shadow-[0_0_15px_#00F0FF]" />
                </div>
            </div>
        </div>
    );
};

// --- MAIN APPLICATION ---

const MainContent = () => {
    const { user, loading: authLoading, logout } = useAuth();
    const [boot, setBoot] = useState(true);
    const [view, setView] = useState('home');
    const [init, setInit] = useState(false);
    const [selectedProtocol, setSelectedProtocol] = useState(null);

    useEffect(() => { if (!authLoading) setTimeout(() => setBoot(false), 2000); }, [authLoading]);

    if (authLoading || boot) return <BootSequence onComplete={() => {}} />;
    if (!user) return <AuthPage />;

    const renderView = () => {
        switch(view) {
            case 'platform': return <div className="min-h-screen pt-32 p-12"><div className="max-w-4xl mx-auto glass-panel p-16 border border-white/10 rounded-3xl"><h2 className="font-orbitron text-4xl text-white mb-10 tracking-[0.2em] uppercase">Aegis_Architecture</h2><p className="font-space text-gray-400 text-lg leading-relaxed tracking-wider uppercase">Next-generation zero-trust architecture leveraging quantum-resistant encryption and autonomous neural monitoring.</p></div></div>;
            case 'contact': return <div className="min-h-screen pt-32 p-12"><div className="max-w-2xl mx-auto glass-panel p-16 border border-white/10 rounded-3xl text-center"><h2 className="font-orbitron text-4xl text-white mb-4 tracking-[0.2em] uppercase">Contact_API</h2><p className="text-gray-500 mb-12 uppercase tracking-widest">Establish a secure uplink with our engineering team.</p><form className="space-y-6"><input className="w-full bg-white/5 border border-white/10 p-5 text-white outline-none focus:border-brand-accent" placeholder="IDENTIFIER" /><textarea className="w-full bg-white/5 border border-white/10 p-5 text-white outline-none focus:border-brand-accent" rows="5" placeholder="ENCRYPTED_MESSAGE"></textarea><button className="w-full py-5 bg-brand-accent text-black font-black font-orbitron tracking-widest uppercase">Initiate_Transfer</button></form></div></div>;
            case 'command': return <CommandCenter onExit={() => setView('home')} />;
            default: return <><Hero onDeployClick={() => setView('command')} onNav={setView} /><Features /></>;
        }
    };

    return (
        <div className="min-h-screen bg-brand-black text-white selection:bg-brand-accent selection:text-black font-space">
            <CyberBackground />
            <Navbar onNav={setView} currentView={view} onLogout={logout} user={user} onInitialize={() => setInit(true)} />
            
            <AnimatePresence mode="wait">
                {init ? (
                    <SystemInitialization key="init" onComplete={() => { setInit(false); setView('command'); playSound('success'); }} />
                ) : (
                    <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                        {renderView()}
                    </motion.div>
                )}
            </AnimatePresence>

            <footer className="p-12 text-center text-gray-700 text-[10px] font-orbitron tracking-[0.5em] border-t border-white/5 uppercase">
                © 2026 Aegis Systems Inc // Distributed_Defense_Mesh_Verified
            </footer>
        </div>
    );
};

const App = () => (
    <AuthProvider>
        <MainContent />
    </AuthProvider>
);

// Initialize React
const render = () => {
    const root = document.getElementById('root');
    if (root && window.ReactDOM) {
        ReactDOM.createRoot(root).render(<App />);
    } else {
        setTimeout(render, 100);
    }
};
render();
