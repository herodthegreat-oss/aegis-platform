// Aegis Production - Ultra-Stable Engine
const { useState, useEffect, useRef, createContext, useContext } = React;

// Safe Access
const Framer = window.Motion || window.framerMotion || {};
const motion = Framer.motion || { 
    div: (props) => <div {...props}>{props.children}</div>,
    main: (props) => <main {...props}>{props.children}</main>,
    nav: (props) => <nav {...props}>{props.children}</nav>
};

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
                if (r.ok) setUser({ email: 'admin@aegis.sys', ...(await r.json()) });
                else localStorage.removeItem('aegis_token');
            } catch(e) {} finally { setLoading(false); }
        };
        verify();
    }, [token]);

    const login = async (e, p) => {
        const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: e, password: p }) });
        const d = await r.json();
        if (d.success) { localStorage.setItem('aegis_token', d.token); setToken(d.token); setUser(d.user); return true; }
        return false;
    };

    return <AuthContext.Provider value={{ user, login, logout: () => { localStorage.removeItem('aegis_token'); setUser(null); }, loading }}>{children}</AuthContext.Provider>;
};

const CyberBackground = () => {
    const ref = useRef();
    useEffect(() => {
        if (!window.THREE || !ref.current) return;
        const s = new THREE.Scene(), c = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000), r = new THREE.WebGLRenderer({ alpha: true });
        r.setSize(window.innerWidth, window.innerHeight); ref.current.appendChild(r.domElement);
        const g = new THREE.Mesh(new THREE.SphereGeometry(3, 24, 24), new THREE.MeshBasicMaterial({ color: '#00F0FF', wireframe: true, transparent: true, opacity: 0.1 }));
        s.add(g); c.position.z = 5;
        const a = () => { if (ref.current) { requestAnimationFrame(a); g.rotation.y += 0.002; r.render(s, c); } };
        a(); return () => { if (ref.current) ref.current.removeChild(r.domElement); r.dispose(); };
    }, []);
    return <div ref={ref} className="fixed inset-0 -z-10" />;
};

const Navbar = ({ onNav, user, onLogout }) => (
    <nav className="fixed top-0 inset-x-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10 p-4 px-8 flex justify-between items-center">
        <div className="font-orbitron font-bold text-brand-accent tracking-tighter text-xl cursor-pointer" onClick={() => onNav('home')}>AEGIS</div>
        <div className="flex gap-4 items-center">
            {user && <button onClick={onLogout} className="text-[10px] text-gray-500 uppercase">Logout</button>}
            <button onClick={() => onNav('command')} className="px-4 py-1 border border-brand-accent text-brand-accent text-[10px] font-orbitron hover:bg-brand-accent hover:text-black">DASHBOARD</button>
        </div>
    </nav>
);

const AuthPage = () => {
    const { login } = useContext(AuthContext);
    const [e, setE] = useState(''), [p, setP] = useState(''), [l, setL] = useState(false);
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-brand-black">
            <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-xl backdrop-blur-xl">
                <h2 className="font-orbitron text-2xl text-center mb-8 tracking-widest">AEGIS_ACCESS</h2>
                <form onSubmit={async (ev) => { ev.preventDefault(); setL(true); await login(e, p); setL(false); }} className="space-y-4">
                    <input className="w-full bg-black/50 border border-white/10 p-3" type="email" placeholder="ADMIN_EMAIL" onChange={ev => setE(ev.target.value)} required />
                    <input className="w-full bg-black/50 border border-white/10 p-3" type="password" placeholder="PASSKEY" onChange={ev => setP(ev.target.value)} required />
                    <button className="w-full py-4 bg-brand-accent text-black font-bold font-orbitron">{l ? '...' : 'INITIATE'}</button>
                </form>
            </div>
        </div>
    );
};

const App = () => {
    const { user, loading, logout } = useContext(AuthContext);
    const [view, setView] = useState('home');
    if (loading) return null;
    if (!user) return <AuthPage />;
    return (
        <div className="min-h-screen">
            <CyberBackground />
            <Navbar onNav={setView} user={user} onLogout={logout} />
            <main className="pt-32 p-8 flex flex-col items-center justify-center min-h-screen">
                {view === 'command' ? (
                    <div className="w-full max-w-4xl glass-panel p-8 border border-white/10 text-center">
                        <h2 className="font-orbitron text-2xl mb-4">COMMAND_CENTER</h2>
                        <div className="text-brand-emerald text-[10px] animate-pulse">SYSTEM_SECURED // MONITORING_ACTIVE</div>
                        <button onClick={() => setView('home')} className="mt-8 px-6 py-2 border border-red-500 text-red-500 text-xs uppercase">Disconnect</button>
                    </div>
                ) : (
                    <div className="text-center">
                        <h1 className="font-orbitron text-6xl md:text-8xl font-black mb-4 tracking-tighter text-glow">AEGIS_SYSTEMS</h1>
                        <p className="font-space text-gray-500 tracking-[0.4em] text-xs">QUANTUM_RESISTANT_DEFENSE</p>
                    </div>
                )}
            </main>
        </div>
    );
};

// Start
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AuthProvider><App /></AuthProvider>);
