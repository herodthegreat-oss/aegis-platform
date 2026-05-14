const { useState, useEffect, useRef } = React;
const { motion, useScroll, useTransform, AnimatePresence } = window.Motion;

// --- Audio System ---
const playSound = (type) => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'hover') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.start(); osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'click') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.start(); osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'success') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(); osc.stop(ctx.currentTime + 0.3);
        }
    } catch(e) {}
};

// --- Three.js Background Component ---
const CyberBackground = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);

        // Globe Group to hold particles and wireframe
        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        // 1. Globe Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 2000;
        const posArray = new Float32Array(particlesCount * 3);
        const radius = 3.5;

        for(let i = 0; i < particlesCount; i++) {
            // Fibonacci sphere distribution for even spread
            const phi = Math.acos( -1 + ( 2 * i ) / particlesCount );
            const theta = Math.sqrt( particlesCount * Math.PI ) * phi;
            
            posArray[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
            posArray[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
            posArray[i * 3 + 2] = radius * Math.cos(phi);
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.03,
            color: '#00F0FF',
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particlesMesh);

        // 2. Inner Wireframe Sphere
        const sphereGeometry = new THREE.SphereGeometry(radius - 0.1, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: '#7B2CBF',
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });
        const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        globeGroup.add(sphereMesh);

        // Background Grid
        const gridHelper = new THREE.GridHelper(20, 40, '#7B2CBF', '#7B2CBF');
        gridHelper.position.y = -4;
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        camera.position.z = 7;
        camera.position.y = 1;
        
        // Offset the globe slightly to the right to fit the hero layout
        globeGroup.position.x = 2;

        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        const onDocumentMouseMove = (event) => {
            mouseX = (event.clientX - windowHalfX);
            mouseY = (event.clientY - windowHalfY);
        };

        document.addEventListener('mousemove', onDocumentMouseMove);

        const animate = () => {
            requestAnimationFrame(animate);
            targetX = mouseX * 0.001;
            targetY = mouseY * 0.001;

            // Rotate globe
            globeGroup.rotation.y += 0.002;
            globeGroup.rotation.x += 0.001;

            // Interactive camera movement
            camera.position.x += (targetX - camera.position.x) * 0.05;
            camera.position.y += (-targetY - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousemove', onDocumentMouseMove);
            if (currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement);
            }
            scene.clear();
            renderer.dispose();
        };
    }, []);

    return <div ref={mountRef} id="canvas-container" className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10" />;
};

// --- Toast Component ---
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-24 right-8 z-50 p-4 rounded-lg border glass-panel flex items-center gap-3 shadow-lg ${type === 'success' ? 'border-brand-emerald text-brand-emerald' : 'border-red-500 text-red-500'}`}
        >
            <div className={`w-2 h-2 rounded-full ${type === 'success' ? 'bg-brand-emerald' : 'bg-red-500'} animate-pulse`}></div>
            <span className="font-space text-sm">{message}</span>
        </motion.div>
    );
};

// --- Deployment Page Component ---
const DeploymentPage = ({ onComplete }) => {
    const [formData, setFormData] = useState({ companyName: '', email: '' });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [logs, setLogs] = useState([]);

    const runHackingSequence = async () => {
        const sequence = [
            "Initializing secure protocol...",
            "Bypassing firewall...",
            "Establishing quantum-encrypted tunnel...",
            "Deploying autonomous AI nodes...",
            "System provisioned successfully."
        ];
        for (let step of sequence) {
            await new Promise(r => setTimeout(r, 600));
            setLogs(prev => [...prev, `[OK] ${step}`]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setLogs([]);
        try {
            const res = await fetch('/api/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            await runHackingSequence();
            
            if (data.success) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (err) {
            await runHackingSequence();
            setStatus('error');
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen pt-32 pb-20 px-6 flex items-center justify-center relative z-10"
        >
            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <div className="glass-panel p-8 rounded-xl border border-brand-accent/30 neon-border flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 blur-3xl rounded-full"></div>
                    <div className="relative z-10">
                        <h2 className="font-orbitron text-3xl font-bold text-white mb-2">PROVISION SYSTEM</h2>
                        <p className="text-gray-400 text-sm font-space mb-8">Enter target organization parameters to commence AI deployment.</p>
                        
                        {status === 'success' ? (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center text-center py-12">
                                <div className="w-20 h-20 rounded-full border-4 border-brand-emerald mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,255,157,0.4)] relative">
                                    <div className="absolute inset-0 border-4 border-brand-emerald rounded-full animate-ping opacity-20"></div>
                                    <svg className="w-10 h-10 text-brand-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h3 className="font-orbitron text-2xl text-white mb-2">DEPLOYMENT SUCCESSFUL</h3>
                                <p className="font-space text-brand-emerald">Matrix online. All nodes active.</p>
                                <button onClick={onComplete} className="mt-8 px-8 py-3 border border-brand-emerald text-brand-emerald font-space tracking-widest hover:bg-brand-emerald hover:text-black transition-all shadow-[0_0_15px_rgba(0,255,157,0.2)]">RETURN TO HUB</button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-6 font-space">
                                <div>
                                    <label className="block text-xs text-brand-accent mb-2 tracking-widest">ORGANIZATION IDENTIFIER</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-brand-accent focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
                                        value={formData.companyName}
                                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                                        disabled={status === 'loading'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-brand-accent mb-2 tracking-widest">ADMINISTRATOR UPLINK</label>
                                    <input 
                                        type="email" 
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-brand-accent focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        disabled={status === 'loading'}
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={status === 'loading'}
                                    className="mt-4 w-full py-4 bg-brand-accent text-black font-bold font-orbitron tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50 disabled:shadow-none relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[scan_1.5s_ease-in-out_infinite]"></div>
                                    {status === 'loading' ? (
                                        <span className="flex items-center justify-center gap-2 relative z-10">
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            EXECUTING...
                                        </span>
                                    ) : (
                                        <span className="relative z-10">INITIALIZE SEQUENCE</span>
                                    )}
                                </button>
                                {status === 'error' && <p className="text-red-500 text-sm text-center">Connection failed. Uplink severed.</p>}
                            </form>
                        )}
                    </div>
                </div>
                
                {/* Terminal Window */}
                <div className="glass-panel p-6 rounded-xl border border-white/10 bg-brand-dark/90 flex flex-col font-space relative overflow-hidden h-96 lg:h-auto">
                    <div className="flex gap-2 items-center mb-4 border-b border-white/10 pb-4 shrink-0">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-brand-emerald"></div>
                        <span className="ml-2 text-xs text-gray-500 tracking-widest uppercase">Deployment_Terminal_v9</span>
                    </div>
                    <div className="flex-1 overflow-y-auto text-xs md:text-sm text-brand-emerald space-y-3 font-mono custom-scrollbar">
                        <p className="text-gray-400">{'>'} System ready. Awaiting deployment parameters...</p>
                        {logs.map((log, i) => (
                            <motion.p 
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <span className="text-brand-accent">{'>'}</span> {log}
                            </motion.p>
                        ))}
                        {status === 'loading' && (
                            <motion.p animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                                <span className="text-brand-accent">{'>'}</span> _
                            </motion.p>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- New Sub-Pages ---
const PlatformPage = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="min-h-screen pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto glass-panel p-8 md:p-12 rounded-xl border border-white/10">
            <h2 className="font-orbitron text-3xl md:text-4xl text-white mb-6">AEGIS PLATFORM ARCHITECTURE</h2>
            <p className="font-space text-gray-400 mb-8 leading-relaxed">
                The Aegis platform is built on a zero-trust foundation, leveraging quantum-resistant cryptography and autonomous AI nodes.
                It continuously monitors, learns, and adapts to new threat vectors in real-time.
            </p>
            <div className="space-y-6">
                <div className="p-6 bg-brand-dark/50 border border-white/5 rounded-lg hover:border-brand-accent/50 transition-colors">
                    <h3 className="font-orbitron text-xl text-brand-accent mb-2">Neural Threat Prediction</h3>
                    <p className="font-space text-sm text-gray-500">Analyzes petabytes of telemetry to stop zero-days before they start.</p>
                </div>
                <div className="p-6 bg-brand-dark/50 border border-white/5 rounded-lg hover:border-brand-neon/50 transition-colors">
                    <h3 className="font-orbitron text-xl text-brand-neon mb-2">Zero-Trust Micro-segmentation</h3>
                    <p className="font-space text-sm text-gray-500">Isolates critical assets so breaches cannot move laterally.</p>
                </div>
                <div className="p-6 bg-brand-dark/50 border border-white/5 rounded-lg hover:border-brand-emerald/50 transition-colors">
                    <h3 className="font-orbitron text-xl text-brand-emerald mb-2">Autonomous Response</h3>
                    <p className="font-space text-sm text-gray-500">Self-healing matrices rewrite firewall rules at machine speed.</p>
                </div>
            </div>
        </div>
    </motion.div>
);

const CompanyPage = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="min-h-screen pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto glass-panel p-8 md:p-12 rounded-xl border border-white/10 text-center">
            <h2 className="font-orbitron text-3xl md:text-4xl text-white mb-6">ABOUT AEGIS</h2>
            <p className="font-space text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Founded in 2026 by a team of elite cybersecurity researchers, Aegis Systems Inc. exists to protect the digital infrastructure of tomorrow. We believe that defensive technology must outpace offensive capabilities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 border border-white/5 rounded bg-white/5">
                    <h4 className="font-orbitron text-3xl text-brand-accent mb-2">200+</h4>
                    <span className="font-space text-xs text-gray-400 uppercase">Enterprise Clients</span>
                </div>
                <div className="p-6 border border-white/5 rounded bg-white/5">
                    <h4 className="font-orbitron text-3xl text-brand-neon mb-2">99.99%</h4>
                    <span className="font-space text-xs text-gray-400 uppercase">Uptime Guarantee</span>
                </div>
                <div className="p-6 border border-white/5 rounded bg-white/5">
                    <h4 className="font-orbitron text-3xl text-brand-emerald mb-2">0</h4>
                    <span className="font-space text-xs text-gray-400 uppercase">Zero-Day Breaches</span>
                </div>
            </div>
        </div>
    </motion.div>
);

const ContactPage = () => {
    const [status, setStatus] = useState('idle');
    const handleSubmit = (e) => {
        e.preventDefault();
        playSound('click');
        setStatus('sending');
        setTimeout(() => { setStatus('sent'); playSound('success'); }, 1500);
    };
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="min-h-screen pt-32 pb-20 px-6 relative z-10">
            <div className="max-w-2xl mx-auto glass-panel p-8 md:p-12 rounded-xl border border-white/10">
                <h2 className="font-orbitron text-3xl md:text-4xl text-white mb-2">CONTACT API</h2>
                <p className="font-space text-gray-400 mb-8 text-sm">Establish a direct uplink with our engineering team.</p>
                
                {status === 'sent' ? (
                    <div className="text-center py-12 border border-brand-emerald/30 bg-brand-emerald/10 rounded">
                        <h3 className="font-orbitron text-2xl text-brand-emerald mb-2">TRANSMISSION SECURED</h3>
                        <p className="font-space text-gray-300">Our team will respond via encrypted channel shortly.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 font-space">
                        <div>
                            <label className="block text-xs text-brand-accent mb-2 tracking-widest">IDENTIFICATION</label>
                            <input required type="text" className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-brand-accent" />
                        </div>
                        <div>
                            <label className="block text-xs text-brand-accent mb-2 tracking-widest">COMMUNICATION VECTOR (EMAIL)</label>
                            <input required type="email" className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-brand-accent" />
                        </div>
                        <div>
                            <label className="block text-xs text-brand-accent mb-2 tracking-widest">ENCRYPTED MESSAGE</label>
                            <textarea required rows="4" className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-brand-accent"></textarea>
                        </div>
                        <button disabled={status==='sending'} onMouseEnter={() => playSound('hover')} type="submit" className="mt-4 w-full py-4 bg-brand-accent text-black font-bold font-orbitron tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                            {status === 'sending' ? 'TRANSMITTING...' : 'INITIATE TRANSFER'}
                        </button>
                    </form>
                )}
            </div>
        </motion.div>
    );
};

// --- Navbar Component ---
const Navbar = ({ onInitializeSys, onViewChange, currentView }) => {
    const handleNav = (view) => {
        playSound('click');
        onViewChange(view);
    };
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 py-4 px-4 md:px-8 flex justify-between items-center transition-all duration-300">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleNav('home')} onMouseEnter={() => playSound('hover')}>
                <div className="w-8 h-8 rounded bg-brand-accent/20 border border-brand-accent flex items-center justify-center animate-pulse-glow group-hover:bg-brand-accent/40 transition-colors">
                    <svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <span className="font-orbitron font-bold text-xl tracking-wider text-white group-hover:text-brand-accent transition-colors hidden sm:block">AEGIS</span>
            </div>
            
            <div className="hidden md:flex gap-8 text-sm font-space text-gray-300">
                <button onClick={() => handleNav('platform')} onMouseEnter={() => playSound('hover')} className={`hover:text-brand-accent transition-colors ${currentView === 'platform' ? 'text-brand-accent' : ''}`}>PLATFORM</button>
                <button onClick={() => handleNav('company')} onMouseEnter={() => playSound('hover')} className={`hover:text-brand-accent transition-colors ${currentView === 'company' ? 'text-brand-accent' : ''}`}>COMPANY</button>
                <button onClick={() => handleNav('contact')} onMouseEnter={() => playSound('hover')} className={`hover:text-brand-accent transition-colors ${currentView === 'contact' ? 'text-brand-accent' : ''}`}>CONTACT API</button>
            </div>
            
            <div>
                <button 
                    onClick={() => { playSound('click'); onInitializeSys(); }}
                    onMouseEnter={() => playSound('hover')}
                    className="px-4 py-2 md:px-6 rounded border border-brand-accent text-brand-accent font-space text-xs md:text-sm hover:bg-brand-accent hover:text-black transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)]"
                >
                    INITIALIZE SYS
                </button>
            </div>
        </nav>
    );
};

// --- Hero Section ---
const Hero = ({ onDeployClick, onViewChange }) => {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 z-10">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="flex flex-col gap-6"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-emerald/30 bg-brand-emerald/10 w-fit">
                        <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse"></span>
                        <span className="text-xs font-space text-brand-emerald tracking-widest uppercase">System Operational</span>
                    </div>
                    <h1 className="font-orbitron text-5xl md:text-7xl font-bold leading-tight text-white">
                        THE <span className="text-brand-accent text-glow">APEX</span> OF<br/>
                        DIGITAL ARMOR.
                    </h1>
                    <p className="font-space text-lg text-gray-400 max-w-xl leading-relaxed">
                        Aegis deploys autonomous AI-driven defensive matrices to neutralize zero-day threats before they execute. Next-generation cryptography meets quantum-resistant architecture.
                    </p>
                    <div className="flex gap-4 mt-4">
                        <button onClick={() => { playSound('click'); onDeployClick(); }} onMouseEnter={() => playSound('hover')} className="px-6 md:px-8 py-3 md:py-4 bg-brand-accent text-black font-bold font-orbitron tracking-wider hover:bg-white transition-colors flex items-center gap-2 text-sm md:text-base">
                            DEPLOY NOW
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                        <button onClick={() => { playSound('click'); onViewChange('platform'); }} onMouseEnter={() => playSound('hover')} className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 border border-white/20 glass-panel hover:bg-white/10 transition-colors font-space tracking-wider text-white text-xs md:text-sm">
                            VIEW ARCHITECTURE
                        </button>
                    </div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="relative w-full aspect-square md:aspect-[4/3] rounded-lg border border-brand-neon/30 glass-panel p-4 neon-border overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-brand-dark/80 z-0"></div>
                    <div className="absolute inset-0 bg-grid-pattern opacity-30 z-0"></div>
                    
                    {/* Simulated Dashboard inside the Hero Image/Card */}
                    <div className="relative z-10 h-full flex flex-col font-space">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
                            <span className="text-xs text-brand-accent tracking-widest">THREAT_RADAR_v2.4</span>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <div className="w-2 h-2 rounded-full bg-brand-emerald"></div>
                            </div>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="border border-white/5 bg-white/5 rounded p-3 flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-brand-accent/50 animate-scan"></div>
                                <span className="text-gray-400 text-xs">Total Incursions</span>
                                <span className="text-3xl font-orbitron text-white">1,492,031</span>
                            </div>
                            <div className="border border-brand-emerald/20 bg-brand-emerald/5 rounded p-3 flex flex-col justify-center">
                                <span className="text-brand-emerald text-xs">Network Integrity</span>
                                <span className="text-3xl font-orbitron text-white">99.99%</span>
                            </div>
                            <div className="col-span-2 border border-white/5 bg-white/5 rounded p-3 flex items-end gap-1 h-32">
                                {/* Mock Bar Chart */}
                                {[40, 20, 60, 30, 80, 50, 90, 40, 20, 70, 50, 80].map((h, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity, repeatType: "reverse" }}
                                        className="flex-1 bg-brand-neon/50 rounded-t"
                                    ></motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// --- Features Section ---
const Features = () => {
    const features = [
        {
            title: "NEURAL THREAT PREDICTION",
            desc: "Quantum-accelerated AI models analyze network telemetry to identify and isolate zero-day vulnerabilities in microseconds.",
            icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
            color: "text-brand-accent"
        },
        {
            title: "ZERO-TRUST ARCHITECTURE",
            desc: "Continuous micro-authentication at every endpoint. Every packet is verified, every connection is encrypted.",
            icon: "M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4",
            color: "text-brand-neon"
        },
        {
            title: "AUTONOMOUS RESPONSE",
            desc: "Self-healing protocols instantly reroute traffic and isolate compromised sectors upon breach detection.",
            icon: "M13 10V3L4 14h7v7l9-11h-7z",
            color: "text-brand-emerald"
        }
    ];

    return (
        <section id="platform" className="relative py-24 px-6 z-10 bg-brand-dark/50 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="font-orbitron text-3xl md:text-5xl font-bold text-white mb-4">TACTICAL ADVANTAGE</h2>
                    <div className="w-24 h-1 bg-brand-accent mx-auto shadow-[0_0_10px_#00F0FF]"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((f, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: i * 0.2 }}
                            className="glass-panel p-8 rounded-xl border border-white/10 hover:border-brand-accent/50 transition-all duration-300 group cursor-pointer"
                        >
                            <div className={`w-14 h-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors ${f.color}`}>
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                                </svg>
                            </div>
                            <h3 className="font-orbitron text-xl font-bold text-white mb-3 group-hover:text-brand-accent transition-colors">{f.title}</h3>
                            <p className="font-space text-gray-400 text-sm leading-relaxed">
                                {f.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// --- Intelligence Section ---
const Intelligence = () => {
    return (
        <section id="intelligence" className="relative py-24 px-6 z-10">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex-1"
                >
                    <h2 className="font-orbitron text-3xl md:text-5xl font-bold text-white mb-6">GLOBAL INTELLIGENCE GRID</h2>
                    <p className="font-space text-gray-400 mb-8 leading-relaxed">
                        Our decentralized network ingests petabytes of global threat telemetry daily. 
                        By analyzing attack vectors across multiple continents in real-time, Aegis immunizes your infrastructure before localized threats can propagate.
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="border-l-2 border-brand-accent pl-4">
                            <h4 className="font-orbitron text-2xl text-white">4.2 PB</h4>
                            <span className="font-space text-xs text-brand-accent">DAILY TELEMETRY</span>
                        </div>
                        <div className="border-l-2 border-brand-neon pl-4">
                            <h4 className="font-orbitron text-2xl text-white">0.3 ms</h4>
                            <span className="font-space text-xs text-brand-neon">THREAT DETECTION</span>
                        </div>
                    </div>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="flex-1 w-full aspect-video rounded-xl border border-white/10 glass-panel relative overflow-hidden bg-brand-dark flex items-center justify-center"
                >
                     {/* Simplified Map Visualization */}
                     <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-center bg-no-repeat bg-contain filter invert"></div>
                     <div className="relative z-10 w-4 h-4 rounded-full bg-brand-accent animate-ping absolute top-1/3 left-1/4"></div>
                     <div className="relative z-10 w-3 h-3 rounded-full bg-red-500 animate-ping absolute top-1/2 left-2/3"></div>
                     <div className="relative z-10 w-2 h-2 rounded-full bg-brand-emerald animate-ping absolute bottom-1/3 right-1/4"></div>
                </motion.div>
            </div>
        </section>
    );
};

// --- Defense Section ---
const Defense = ({ onDeployClick }) => {
    return (
        <section id="defense" className="relative py-24 px-6 z-10 bg-brand-accent/5 border-y border-brand-accent/10">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="font-orbitron text-3xl md:text-5xl font-bold text-white mb-6">UNBREAKABLE DEFENSE</h2>
                <p className="font-space text-gray-300 mb-10 max-w-2xl mx-auto">
                    Traditional firewalls are obsolete. Upgrade to autonomous, AI-driven defense matrices that adapt faster than any human operator. Secure your enterprise today.
                </p>
                <button 
                    onClick={onDeployClick}
                    className="px-10 py-4 bg-brand-accent text-black font-bold font-orbitron tracking-wider hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                >
                    INITIALIZE PROVISIONING
                </button>
            </div>
        </section>
    );
};

// --- Footer Component ---
const Footer = ({ onViewChange }) => {
    const handleNav = (view) => {
        playSound('click');
        onViewChange(view);
    };
    return (
        <footer id="company" className="border-t border-white/10 bg-brand-black relative z-10 pt-16 pb-8 px-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded bg-brand-accent/20 border border-brand-accent flex items-center justify-center">
                            <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <span className="font-orbitron font-bold text-lg tracking-wider text-white">AEGIS</span>
                    </div>
                    <p className="font-space text-gray-500 text-sm max-w-sm">
                        Securing the digital frontier. Enterprise-grade cybersecurity driven by advanced AI and zero-trust architecture.
                    </p>
                </div>
                <div>
                    <h4 className="font-orbitron text-white text-sm tracking-wider mb-4">PROTOCOLS</h4>
                    <ul className="space-y-2 text-sm font-space text-gray-500 flex flex-col items-start">
                        <li><button onClick={() => handleNav('platform')} onMouseEnter={() => playSound('hover')} className="hover:text-brand-accent transition-colors">Threat Intel</button></li>
                        <li><button onClick={() => handleNav('platform')} onMouseEnter={() => playSound('hover')} className="hover:text-brand-accent transition-colors">Cloud Security</button></li>
                        <li><button onClick={() => handleNav('platform')} onMouseEnter={() => playSound('hover')} className="hover:text-brand-accent transition-colors">Endpoint Defense</button></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-orbitron text-white text-sm tracking-wider mb-4">COMPANY</h4>
                    <ul className="space-y-2 text-sm font-space text-gray-500 flex flex-col items-start">
                        <li><button onClick={() => handleNav('company')} onMouseEnter={() => playSound('hover')} className="hover:text-brand-accent transition-colors">About Us</button></li>
                        <li><button onClick={() => handleNav('contact')} onMouseEnter={() => playSound('hover')} className="hover:text-brand-accent transition-colors">Contact API</button></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-6xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-gray-600 text-xs font-space">© 2026 Aegis Systems Inc. All rights reserved.</p>
                <div className="flex gap-4">
                    <div onMouseEnter={() => playSound('hover')} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors cursor-pointer">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                    </div>
                    <div onMouseEnter={() => playSound('hover')} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors cursor-pointer">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// --- Main App Component ---
const App = () => {
    const [toast, setToast] = useState(null);
    const [currentView, setCurrentView] = useState('home');

    const handleInitializeSys = async () => {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            setToast({ message: `System Check: ${data.message}`, type: 'success' });
            playSound('success');
        } catch (err) {
            setToast({ message: 'Error: Cannot reach backend server.', type: 'error' });
            playSound('click');
        }
    };

    const renderView = () => {
        switch(currentView) {
            case 'home':
                return (
                    <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                        <main>
                            <Hero onDeployClick={() => setCurrentView('deploy')} onViewChange={setCurrentView} />
                            <Features />
                            <Intelligence />
                            <Defense onDeployClick={() => setCurrentView('deploy')} />
                        </main>
                        <Footer onViewChange={setCurrentView} />
                    </motion.div>
                );
            case 'deploy':
                return (
                    <motion.div key="deploy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                        <DeploymentPage onComplete={() => setCurrentView('home')} />
                    </motion.div>
                );
            case 'platform':
                return (
                    <motion.div key="platform" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                        <PlatformPage />
                        <Footer onViewChange={setCurrentView} />
                    </motion.div>
                );
            case 'company':
                return (
                    <motion.div key="company" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                        <CompanyPage />
                        <Footer onViewChange={setCurrentView} />
                    </motion.div>
                );
            case 'contact':
                return (
                    <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                        <ContactPage />
                        <Footer onViewChange={setCurrentView} />
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="relative">
            <CyberBackground />
            <Navbar 
                onInitializeSys={handleInitializeSys} 
                onViewChange={setCurrentView}
                currentView={currentView}
            />
            
            <AnimatePresence mode="wait">
                {renderView()}
            </AnimatePresence>

            <AnimatePresence>
                {toast && (
                    <Toast 
                        message={toast.message} 
                        type={toast.type} 
                        onClose={() => setToast(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
