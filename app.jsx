import { AuthProvider, useAuth } from './auth.jsx';
import { playSound, Toast, BootSequence, CyberBackground, SystemInitialization } from './components.jsx';
import { Hero, Features, PlatformPage, CompanyPage, ContactPage } from './pages.jsx';
import { CommandCenter } from './dashboard.jsx';

const { useState, useEffect } = React;
const { motion, AnimatePresence } = window.Motion || window.framerMotion || {};

// --- Deployment Page (Inline for now as it's small) ---
const DeploymentPage = ({ onComplete }) => {
    const [formData, setFormData] = useState({ companyName: '', email: '' });
    const [status, setStatus] = useState('idle');
    const handleSubmit = async (e) => {
        e.preventDefault(); setStatus('loading');
        try {
            const res = await fetch('/api/deploy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const data = await res.json();
            if (data.success) { setStatus('success'); playSound('success'); }
        } catch (err) { setStatus('error'); }
    };
    return (
        <div className="min-h-screen pt-32 flex items-center justify-center p-6 relative z-10">
            <div className="max-w-md w-full glass-panel p-8 rounded-xl border border-brand-accent/30">
                <h2 className="font-orbitron text-2xl text-white mb-6 uppercase">Provision System</h2>
                {status === 'success' ? <button onClick={onComplete} className="w-full py-4 border border-brand-emerald text-brand-emerald">RETURN TO HUB</button> : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 font-space">
                        <input required type="text" placeholder="ORGANIZATION IDENTIFIER" className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-white" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                        <input required type="email" placeholder="ADMINISTRATOR UPLINK" className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        <button type="submit" className="w-full py-4 bg-brand-accent text-black font-bold font-orbitron">{status === 'loading' ? 'EXECUTING...' : 'INITIALIZE SEQUENCE'}</button>
                    </form>
                )}
            </div>
        </div>
    );
};

// --- AuthPage (Simplified version that uses useAuth) ---
const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', company: '' });
    const [error, setError] = useState('');
    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError(''); playSound('click');
        try {
            const res = isLogin ? await login(formData.email, formData.password) : await register(formData.email, formData.password, formData.company);
            if (!res.success) setError(res.message);
            else if (!isLogin) { setIsLogin(true); playSound('success'); }
        } catch (err) { setError('Uplink failed.'); } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-brand-black relative">
            <CyberBackground />
            <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-white/10 relative z-10">
                <h2 className="font-orbitron text-2xl text-white text-center mb-8 uppercase tracking-widest">Aegis_<span className="text-brand-accent">{isLogin ? 'Access' : 'Provision'}</span></h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="text-red-500 text-[10px] text-center uppercase tracking-widest border border-red-500/30 p-2 bg-red-500/5">{error}</div>}
                    {!isLogin && <input type="text" placeholder="ORG_CODE" className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />}
                    <input type="email" placeholder="IDENTIFIER" className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <input type="password" placeholder="PASSKEY" className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    <button type="submit" disabled={loading} className="w-full py-4 bg-brand-accent text-black font-bold font-orbitron">{isLogin ? 'INITIATE_SESSION' : 'REGISTER_ENDPOINT'}</button>
                </form>
                <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-[10px] text-gray-500 uppercase tracking-widest hover:text-brand-accent">{isLogin ? 'New Credentials' : 'Access Portal'}</button>
            </div>
        </div>
    );
};

// --- Navigation ---
const Navbar = ({ onInitializeSys, onViewChange, currentView, onLogout }) => (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 py-4 px-8 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('home')}><div className="w-8 h-8 rounded bg-brand-accent/20 border border-brand-accent flex items-center justify-center"><svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div><span className="font-orbitron font-bold text-xl text-white">AEGIS</span></div>
        <div className="hidden md:flex gap-8 text-sm text-gray-300">
            {['platform', 'company', 'contact'].map(view => <button key={view} onClick={() => onViewChange(view)} className={`uppercase tracking-widest hover:text-brand-accent ${currentView === view ? 'text-brand-accent' : ''}`}>{view}</button>)}
        </div>
        <div className="flex items-center gap-4">
            {onLogout && <button onClick={onLogout} className="text-[10px] text-gray-500 hover:text-red-500 uppercase">Logout</button>}
            <button onClick={onInitializeSys} className="px-6 py-2 rounded border border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-black transition-all text-sm font-orbitron">INITIALIZE SYS</button>
        </div>
    </nav>
);

const Footer = ({ onViewChange }) => (
    <footer className="border-t border-white/10 py-8 px-6 text-center text-gray-600 text-xs uppercase tracking-widest">
        © 2026 Aegis Systems Inc. // Secure the Future.
    </footer>
);

// --- Main Content ---
const MainContent = () => {
    const { user, loading: authLoading, logout } = useAuth();
    const [isBooting, setIsBooting] = useState(true);
    const [currentView, setCurrentView] = useState('home');
    const [isInitializing, setIsInitializing] = useState(false);

    useEffect(() => { if (!authLoading) setTimeout(() => setIsBooting(false), 1500); }, [authLoading]);

    if (authLoading || isBooting) return <BootSequence onComplete={() => {}} />;
    if (!user) return <AuthPage />;

    const renderView = () => {
        switch(currentView) {
            case 'home': return <><Hero onDeployClick={() => setCurrentView('deploy')} onViewChange={setCurrentView} /><Features /></>;
            case 'deploy': return <DeploymentPage onComplete={() => setCurrentView('home')} />;
            case 'platform': return <PlatformPage />;
            case 'contact': return <ContactPage />;
            case 'command': return <CommandCenter onExit={() => setCurrentView('home')} />;
            default: return <Hero onDeployClick={() => setCurrentView('deploy')} onViewChange={setCurrentView} />;
        }
    };

    return (
        <div className="relative min-h-screen bg-brand-black">
            <CyberBackground />
            <Navbar onInitializeSys={() => setIsInitializing(true)} onViewChange={setCurrentView} currentView={currentView} onLogout={logout} />
            <AnimatePresence mode="wait">
                {isInitializing ? (
                    <SystemInitialization key="init" onComplete={() => { setIsInitializing(false); setCurrentView('command'); playSound('success'); }} />
                ) : (
                    <motion.div key={currentView} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                        {renderView()}
                    </motion.div>
                )}
            </AnimatePresence>
            <Footer onViewChange={setCurrentView} />
        </div>
    );
};

const App = () => <AuthProvider><MainContent /></AuthProvider>;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
