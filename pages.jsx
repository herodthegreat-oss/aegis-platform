import { playSound } from './components.jsx';
import { useAuth } from './auth.jsx';

const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = window.Motion || window.framerMotion || {};

// --- HERO ---
export const Hero = ({ onDeployClick, onViewChange }) => {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 z-10">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.2 }} className="flex flex-col gap-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-emerald/30 bg-brand-emerald/10 w-fit">
                        <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse"></span>
                        <span className="text-xs font-space text-brand-emerald tracking-widest uppercase">System Operational</span>
                    </div>
                    <h1 className="font-orbitron text-5xl md:text-7xl font-bold leading-tight text-white">THE <span className="text-brand-accent text-glow">APEX</span> OF<br/>DIGITAL ARMOR.</h1>
                    <p className="font-space text-lg text-gray-400 max-w-xl leading-relaxed">Aegis deploys autonomous AI-driven defensive matrices to neutralize zero-day threats before they execute. Next-generation cryptography meets quantum-resistant architecture.</p>
                    <div className="flex gap-4 mt-4">
                        <button onClick={() => { playSound('click'); onDeployClick(); }} className="px-6 md:px-8 py-3 md:py-4 bg-brand-accent text-black font-bold font-orbitron tracking-wider hover:bg-white transition-colors flex items-center gap-2 text-sm md:text-base">DEPLOY NOW <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></button>
                        <button onClick={() => { playSound('click'); onViewChange('platform'); }} className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 border border-white/20 glass-panel hover:bg-white/10 transition-colors font-space tracking-wider text-white text-xs md:text-sm">VIEW ARCHITECTURE</button>
                    </div>
                </motion.div>
                <div className="relative w-full aspect-square md:aspect-[4/3] rounded-lg border border-brand-neon/30 glass-panel p-4 neon-border overflow-hidden">
                    <div className="absolute inset-0 bg-brand-dark/80 z-0"></div>
                    <div className="relative z-10 h-full flex flex-col font-space">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4"><span className="text-xs text-brand-accent tracking-widest">THREAT_RADAR_v2.4</span></div>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="border border-white/5 bg-white/5 rounded p-3 flex flex-col justify-center relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-[1px] bg-brand-accent/50 animate-scan"></div><span className="text-gray-400 text-xs">Total Incursions</span><span className="text-3xl font-orbitron text-white">1.49M</span></div>
                            <div className="border border-brand-emerald/20 bg-brand-emerald/5 rounded p-3 flex flex-col justify-center"><span className="text-brand-emerald text-xs">Network Integrity</span><span className="text-3xl font-orbitron text-white">99.99%</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- FEATURES ---
export const Features = () => {
    const features = [
        { title: "NEURAL THREAT PREDICTION", desc: "Quantum-accelerated AI models analyze network telemetry to identify and isolate zero-day vulnerabilities.", icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z", color: "text-brand-accent" },
        { title: "ZERO-TRUST ARCHITECTURE", desc: "Continuous micro-authentication at every endpoint. Every packet is verified, every connection is encrypted.", icon: "M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4", color: "text-brand-neon" },
        { title: "AUTONOMOUS RESPONSE", desc: "Self-healing protocols instantly reroute traffic and isolate compromised sectors upon breach detection.", icon: "M13 10V3L4 14h7v7l9-11h-7z", color: "text-brand-emerald" }
    ];
    return (
        <section className="relative py-24 px-6 z-10 bg-brand-dark/50 border-t border-white/5">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((f, i) => (
                    <motion.div key={i} className="glass-panel p-8 rounded-xl border border-white/10 hover:border-brand-accent/50 transition-all group">
                        <div className={`w-14 h-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-6 ${f.color}`}><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} /></svg></div>
                        <h3 className="font-orbitron text-xl font-bold text-white mb-3 group-hover:text-brand-accent transition-colors">{f.title}</h3>
                        <p className="font-space text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

// --- PLATFORM ---
export const PlatformPage = () => (
    <div className="min-h-screen pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto glass-panel p-8 rounded-xl border border-white/10">
            <h2 className="font-orbitron text-3xl text-white mb-6 uppercase">Platform Architecture</h2>
            <p className="font-space text-gray-400 mb-8 leading-relaxed">The Aegis platform is built on a zero-trust foundation, leveraging quantum-resistant cryptography and autonomous AI nodes.</p>
        </div>
    </div>
);

// --- CONTACT ---
export const ContactPage = () => {
    const [status, setStatus] = useState('idle');
    const handleSubmit = (e) => { e.preventDefault(); setStatus('sending'); setTimeout(() => setStatus('sent'), 1500); };
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 relative z-10">
            <div className="max-w-2xl mx-auto glass-panel p-8 rounded-xl border border-white/10">
                <h2 className="font-orbitron text-3xl text-white mb-2">CONTACT API</h2>
                {status === 'sent' ? <div className="text-center py-12 text-brand-emerald">TRANSMISSION SECURED</div> : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 font-space">
                        <input required type="text" placeholder="IDENTIFICATION" className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-white" />
                        <textarea required rows="4" placeholder="ENCRYPTED MESSAGE" className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-white"></textarea>
                        <button type="submit" className="mt-4 w-full py-4 bg-brand-accent text-black font-bold font-orbitron">INITIATE TRANSFER</button>
                    </form>
                )}
            </div>
        </div>
    );
};
