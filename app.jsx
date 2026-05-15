const { useState, useEffect, useRef } = React;
const { motion, useScroll, useTransform, AnimatePresence } = window.Motion || window.framerMotion || {};

// --- Coordinate Mapping ---
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

const getCoords = (location) => CITY_COORDS[location] || { lat: (Math.random() - 0.5) * 160, lng: (Math.random() - 0.5) * 320 };

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

// --- Boot Sequence Component ---
const BootSequence = ({ onComplete }) => {
    const [lines, setLines] = useState([]);
    const [index, setIndex] = useState(0);
    
    const bootLines = [
        "AEGIS_CORE v9.42.0 INITIALIZING...",
        "CONNECTING TO NEURAL_GRID_77...",
        "AUTHENTICATING QUANTUM_KEYS...",
        "SECURE_TUNNEL ESTABLISHED [AES-256-GCM]",
        "LOADING THREAT_DATABASE...",
        "CHECKING NODE_INTEGRITY...",
        "SYSTEM_ARMED // STATUS_READY"
    ];

    useEffect(() => {
        if (index < bootLines.length) {
            const timer = setTimeout(() => {
                setLines(prev => [...prev, bootLines[index]]);
                setIndex(index + 1);
            }, index === 0 ? 500 : 300);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(onComplete, 1000);
            return () => clearTimeout(timer);
        }
    }, [index, onComplete]);

    return (
        <div className="fixed inset-0 z-[100] bg-brand-black flex items-center justify-center p-8">
            <div className="max-w-xl w-full">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded border border-brand-accent flex items-center justify-center">
                        <svg className="w-8 h-8 text-brand-accent animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <h1 className="font-orbitron text-2xl text-white tracking-[0.3em]">AEGIS<span className="text-brand-accent">_SYSTEMS</span></h1>
                </div>
                <div className="font-mono text-sm space-y-2 boot-text">
                    {lines.map((line, i) => (
                        <div key={i} className="flex gap-2">
                            <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                            <span>{line}</span>
                        </div>
                    ))}
                    {index < bootLines.length && <span className="terminal-cursor"></span>}
                </div>
                <div className="mt-12 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(index / bootLines.length) * 100}%` }}
                        className="h-full bg-brand-accent shadow-[0_0_15px_#00F0FF]"
                    />
                </div>
            </div>
        </div>
    );
};

// --- System Initialization Sequence ---
const SystemInitialization = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("SYNCHRONIZING_NEURAL_UPLINK...");
    const [logs, setLogs] = useState([]);

    const steps = [
        { p: 15, s: "AUTHENTICATING_QUANTUM_KEYS...", l: "RSA-4096 / LATTICE_SECURE" },
        { p: 30, s: "PROVISIONING_ISOLATED_CONTAINERS...", l: "DOCKER_GRID_77 // ACTIVE" },
        { p: 50, s: "DECRYPTING_THREAT_DATABASE...", l: "AES-256-GCM_DECODED" },
        { p: 70, s: "ESTABLISHING_NEURAL_MATRIX...", l: "NODE_ALPHA_SYNC: 98.4%" },
        { p: 90, s: "ARMING_DEFENSE_SYSTEMS...", l: "FIREWALL_V9_ONLINE" },
        { p: 100, s: "SYSTEM_READY", l: "UPLINK_STABLE" }
    ];

    useEffect(() => {
        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                const step = steps[currentStep];
                setProgress(step.p);
                setStatus(step.s);
                setLogs(prev => [...prev, `[LOG] ${step.l}`]);
                playSound('hover');
                currentStep++;
            } else {
                clearInterval(interval);
                setTimeout(onComplete, 800);
            }
        }, 600);
        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[200] bg-brand-black flex items-center justify-center p-8 overflow-hidden">
            <div className="absolute inset-0 cyber-grid opacity-10"></div>
            <div className="absolute inset-0 bg-radial-gradient opacity-20"></div>
            
            <div className="max-w-2xl w-full relative z-10">
                <div className="mb-12 flex items-center justify-between">
                    <div>
                        <h2 className="font-orbitron text-brand-accent text-3xl font-black tracking-[0.4em] mb-2">INITIALIZING</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></div>
                            <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">{status}</p>
                        </div>
                    </div>
                    <div className="font-orbitron text-4xl text-white opacity-20">{progress}%</div>
                </div>

                <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden mb-8 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-right from-brand-neon to-brand-accent shadow-[0_0_15px_#00F0FF]"
                    />
                    <div className="absolute inset-0 animate-scan opacity-30"></div>
                </div>

                <div className="grid grid-cols-2 gap-4 h-48">
                    <div className="glass-panel p-4 rounded border border-white/5 font-mono text-[8px] text-brand-emerald space-y-1 overflow-y-auto custom-scrollbar">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
                                <span>{log}</span>
                            </div>
                        ))}
                        <span className="terminal-cursor !h-2 !w-1"></span>
                    </div>
                    <div className="glass-panel p-4 rounded border border-white/5 flex flex-col justify-center items-center gap-4">
                        <div className="relative w-16 h-16">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                                <motion.circle 
                                    cx="32" cy="32" r="30" 
                                    stroke="currentColor" strokeWidth="2" fill="transparent" 
                                    className="text-brand-accent"
                                    strokeDasharray="188.4"
                                    animate={{ strokeDashoffset: 188.4 - (188.4 * progress) / 100 }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-orbitron text-white">{progress}%</span>
                            </div>
                        </div>
                        <span className="text-[8px] font-space text-gray-500 tracking-widest uppercase">Encryption_Sync</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Network Topology Component ---
const NetworkTopology = () => {
    const nodes = [
        { id: 'N1', x: 50, y: 50, type: 'CORE' },
        { id: 'N2', x: 150, y: 120, type: 'NODE' },
        { id: 'N3', x: 250, y: 40, type: 'NODE' },
        { id: 'N4', x: 350, y: 150, type: 'NODE' },
        { id: 'N5', x: 450, y: 80, type: 'NODE' },
        { id: 'N6', x: 550, y: 130, type: 'NODE' },
    ];

    const links = [
        { source: 'N1', target: 'N2' },
        { source: 'N1', target: 'N3' },
        { source: 'N2', target: 'N4' },
        { source: 'N3', target: 'N4' },
        { source: 'N4', target: 'N5' },
        { source: 'N5', target: 'N6' },
        { source: 'N2', target: 'N6' },
    ];

    return (
        <div className="w-full h-64 bg-black/40 rounded-lg border border-white/5 relative overflow-hidden group">
            <div className="absolute top-2 left-4 text-[8px] font-orbitron text-brand-accent tracking-widest uppercase">Network_Topology_Live</div>
            <svg viewBox="0 0 600 200" className="w-full h-full">
                {links.map((link, i) => {
                    const s = nodes.find(n => n.id === link.source);
                    const t = nodes.find(n => n.id === link.target);
                    return (
                        <line 
                            key={i} 
                            x1={s.x} y1={s.y} x2={t.x} y2={t.y} 
                            className={`topology-link ${Math.random() > 0.5 ? 'active' : ''}`}
                        />
                    );
                })}
                {nodes.map((node, i) => (
                    <g key={i}>
                        <circle 
                            cx={node.x} cy={node.y} r={node.type === 'CORE' ? 6 : 4} 
                            className="topology-node"
                        />
                        {node.type === 'CORE' && (
                            <circle cx={node.x} cy={node.y} r={12} className="stroke-brand-accent/20 fill-none animate-ping" />
                        )}
                        <text x={node.x + 8} y={node.y + 4} className="fill-gray-600 text-[6px] font-mono">{node.id}</text>
                    </g>
                ))}
            </svg>
            <div className="absolute bottom-2 right-4 flex gap-2">
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-accent"></div>
                    <span className="text-[6px] text-gray-500 font-mono uppercase">Sync</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald"></div>
                    <span className="text-[6px] text-gray-500 font-mono uppercase">Secure</span>
                </div>
            </div>
        </div>
    );
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
            "INITIALIZING_HANDSHAKE: [AES-256-GCM]",
            "RECOGNIZING_TARGET_ENVIRONMENT...",
            "BYPASSING_VIRTUAL_FIREWALL_v4.2...",
            "PATCHING_CVE-2026-1024_EXPLOIT_VECTOR...",
            "ESTABLISHING_QUANTUM_TUNNEL: [STABLE]",
            "SYNCING_NEURAL_WEIGHTS: [NODE_ALPHA]",
            "PROVISIONING_ISOLATED_CONTAINERS...",
            "ENCRYPTING_LOCAL_DATABASE_NODES...",
            "SYSTEM_DEPLOYMENT_COMPLETE: [SUCCESS]"
        ];
        for (let step of sequence) {
            await new Promise(r => setTimeout(r, 400));
            setLogs(prev => [...prev, `[INIT] ${step}`]);
            playSound('hover');
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

// --- Command Center Components ---

const ThreatFeed = ({ threats, onMitigate }) => {
    const [decryptedIds, setDecryptedIds] = useState(new Set());

    useEffect(() => {
        const latest = threats[0];
        if (latest && !decryptedIds.has(latest.id)) {
            const timer = setTimeout(() => {
                setDecryptedIds(prev => new Set(prev).add(latest.id));
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [threats, decryptedIds]);

    return (
        <div className="glass-panel p-4 rounded-lg border border-white/10 h-full flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 scanline-overlay opacity-5 pointer-events-none"></div>
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2 relative z-10">
                <span className="text-xs font-orbitron text-brand-accent tracking-widest">LIVE THREAT FEED</span>
                <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse"></span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar relative z-10">
                <AnimatePresence>
                    {threats.map((t) => {
                        const isDecrypted = decryptedIds.has(t.id);
                        return (
                            <motion.div 
                                key={t.id}
                                initial={{ opacity: 0, x: -20, filter: 'blur(5px)' }}
                                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                className={`text-[10px] md:text-xs font-mono p-3 bg-white/5 border-l-2 ${t.type === 'CRITICAL' ? 'border-red-500 bg-red-500/5' : 'border-brand-accent/30'} flex flex-col gap-1 relative group hover:bg-white/10 transition-all duration-300 rounded-r`}
                            >
                                <div className="flex justify-between">
                                    <span className={t.type === 'CRITICAL' ? 'text-red-500 glitch-text' : t.type === 'WARNING' ? 'text-yellow-500' : 'text-brand-emerald'}>
                                        [{t.type}]
                                    </span>
                                    <span className="text-gray-500 text-[8px] uppercase tracking-tighter">{t.location}</span>
                                </div>
                                <div className="text-white truncate font-bold">
                                    {isDecrypted ? t.action : (
                                        <span className="opacity-40 tracking-widest">
                                            {t.action.replace(/[a-zA-Z]/g, () => Math.random() > 0.5 ? '0' : '1')}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="text-[8px] text-brand-accent/40 group-hover:text-brand-accent/70 transition-colors">UPLINK: {t.origin}</div>
                                    <button 
                                        onClick={() => onMitigate(t.id)}
                                        className="text-[8px] px-3 py-1 border border-brand-accent/30 text-brand-accent hover:bg-brand-accent hover:text-black transition-all opacity-0 group-hover:opacity-100 uppercase tracking-widest font-bold"
                                    >
                                        MITIGATE
                                    </button>
                                </div>
                                {t.type === 'CRITICAL' && !isDecrypted && (
                                    <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none"></div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

const CommandGlobe = ({ threats }) => {
    const mountRef = useRef(null);
    const globeRef = useRef(null);
    const arcsRef = useRef([]);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        currentMount.appendChild(renderer.domElement);

        const globeGroup = new THREE.Group();
        scene.add(globeGroup);
        globeRef.current = globeGroup;

        // Globe Geometry
        const geometry = new THREE.SphereGeometry(2, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: '#00F0FF',
            wireframe: true,
            transparent: true,
            opacity: 0.1
        });
        const sphere = new THREE.Mesh(geometry, material);
        globeGroup.add(sphere);

        // Particle Points for vertices
        const pointsGeometry = new THREE.SphereGeometry(2, 24, 24);
        const pointsMaterial = new THREE.PointsMaterial({
            size: 0.02,
            color: '#00F0FF',
            transparent: true,
            opacity: 0.5
        });
        const points = new THREE.Points(pointsGeometry, pointsMaterial);
        globeGroup.add(points);

        // Add City Hotspots
        const createHotspot = (lat, lng, name) => {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lng + 180) * (Math.PI / 180);
            const r = 2.02;
            
            const hotspotGeom = new THREE.SphereGeometry(0.04, 8, 8);
            const hotspotMat = new THREE.MeshBasicMaterial({ color: '#00F0FF' });
            const hotspot = new THREE.Mesh(hotspotGeom, hotspotMat);
            
            hotspot.position.set(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.cos(phi),
                r * Math.sin(phi) * Math.sin(theta)
            );
            globeGroup.add(hotspot);

            // Pulse effect for hotspot
            const ringGeom = new THREE.RingGeometry(0.05, 0.08, 16);
            const ringMat = new THREE.MeshBasicMaterial({ color: '#00F0FF', transparent: true, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.position.copy(hotspot.position);
            ring.lookAt(new THREE.Vector3(0, 0, 0));
            globeGroup.add(ring);
            
            return ring;
        };

        const rings = Object.entries(CITY_COORDS).map(([name, coords]) => createHotspot(coords.lat, coords.lng, name));

        camera.position.z = 5;

        const animate = () => {
            requestAnimationFrame(animate);
            globeGroup.rotation.y += 0.0015;
            globeGroup.rotation.x += 0.0005;
            
            const time = Date.now() * 0.002;
            rings.forEach(ring => {
                if (ring) {
                    ring.scale.setScalar(1 + Math.sin(time) * 0.5);
                    ring.material.opacity = 0.5 - Math.sin(time) * 0.3;
                }
            });

            // Pulse effect for arcs
            arcsRef.current.forEach(arc => {
                if (arc.material.opacity > 0) {
                    arc.material.opacity -= 0.005;
                    if (arc.material.opacity <= 0) {
                        scene.remove(arc);
                    }
                }
            });

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            const w = currentMount.clientWidth;
            const h = currentMount.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement);
            }
            scene.clear();
            renderer.dispose();
        };
    }, []);

    // Create arc on new threat
    useEffect(() => {
        if (threats.length > 0 && globeRef.current) {
            const latest = threats[0];
            const startLoc = getCoords(latest.location);
            const endLoc = { lat: 0, lng: 0 }; // Default to central HQ

            const createArc = (lat1, lng1, lat2, lng2) => {
                const radius = 2;
                const points = [];
                for (let i = 0; i <= 20; i++) {
                    const p = i / 20;
                    const lat = lat1 + (lat2 - lat1) * p;
                    const lng = lng1 + (lng2 - lng1) * p;
                    const phi = (90 - lat) * (Math.PI / 180);
                    const theta = (lng + 180) * (Math.PI / 180);
                    
                    // Add altitude to arc
                    const alt = Math.sin(p * Math.PI) * 0.5;
                    const r = radius + alt;

                    points.push(new THREE.Vector3(
                        r * Math.sin(phi) * Math.cos(theta),
                        r * Math.cos(phi),
                        r * Math.sin(phi) * Math.sin(theta)
                    ));
                }
                const curve = new THREE.CatmullRomCurve3(points);
                const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
                const material = new THREE.LineBasicMaterial({ 
                    color: latest.type === 'CRITICAL' ? '#ff0000' : '#00F0FF',
                    transparent: true,
                    opacity: 1
                });
                const line = new THREE.Line(geometry, material);
                globeRef.current.add(line);
                arcsRef.current.push(line);
            };

            createArc(startLoc.lat, startLoc.lng, endLoc.lat, endLoc.lng);
        }
    }, [threats]);

    return <div ref={mountRef} className="w-full h-full" />;
};

const SystemLog = ({ threats }) => {
    const [sysLogs, setSysLogs] = useState([
        "System initialization complete.",
        "Uplink established with Node_Alpha.",
        "Monitoring global telemetry streams..."
    ]);

    useEffect(() => {
        if (threats.length > 0) {
            const latest = threats[0];
            const timestamp = new Date().toLocaleTimeString();
            const log = `[${timestamp}] ALERT: ${latest.type} from ${latest.origin} - ${latest.action}`;
            setSysLogs(prev => [log, ...prev].slice(0, 15));
        }
    }, [threats]);

    return (
        <div className="glass-panel p-4 rounded-lg border border-white/10 font-mono text-[10px] h-48 overflow-y-auto custom-scrollbar bg-black/40">
            <div className="flex items-center gap-2 mb-2 text-brand-accent border-b border-white/10 pb-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="tracking-widest uppercase">System Telemetry Log</span>
            </div>
            {sysLogs.map((log, i) => (
                <div key={i} className="mb-1 text-gray-400 log-entry-enter">
                    <span className="text-brand-emerald opacity-50 mr-2">{'>'}</span>
                    {log}
                </div>
            ))}
        </div>
    );
};

const SystemMetrics = ({ securityLevel = 'LOW' }) => {
    const [metrics, setMetrics] = useState([
        { label: 'CPU LOAD', value: 24, unit: '%', color: 'text-brand-accent' },
        { label: 'MEMORY', value: 8.2, unit: 'GB', color: 'text-brand-neon' },
        { label: 'NETWORK', value: 425, unit: 'MB/s', color: 'text-brand-emerald' },
        { label: 'INTEGRITY', value: 99.9, unit: '%', color: 'text-white' }
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(prev => prev.map(m => {
                const multiplier = securityLevel === 'CRITICAL' ? 3 : securityLevel === 'HIGH' ? 1.5 : 1;
                const change = (Math.random() - 0.5) * 2 * multiplier;
                let newValue = m.value + change;
                if (m.label === 'INTEGRITY') newValue = Math.min(100, Math.max(98.5, newValue));
                else if (m.label === 'CPU LOAD') newValue = Math.min(95, Math.max(10, newValue));
                return { ...m, value: parseFloat(newValue.toFixed(1)) };
            }));
        }, 1500);
        return () => clearInterval(interval);
    }, [securityLevel]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m, i) => (
                <div key={i} className="glass-panel p-4 rounded-lg border border-white/5 relative overflow-hidden group">
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-right from-transparent via-brand-accent/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    <div className="text-[10px] text-gray-500 font-space tracking-widest mb-1">{m.label}</div>
                    <div className={`text-xl font-orbitron ${m.color} tabular-nums`}>
                        {m.value}{m.unit}
                    </div>
                    <div className="mt-2 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(m.value / (m.label === 'MEMORY' ? 16 : 100)) * 100}%` }}
                            className={`h-full ${m.color.replace('text-', 'bg-')}`}
                        ></motion.div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Security Overview Component ---
const SecurityOverview = ({ securityLevel }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
            <div className="glass-panel p-6 rounded-xl border border-brand-accent/20 holo-card">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-orbitron text-brand-accent tracking-widest uppercase">Global_Defense_Rating</span>
                    <div className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse"></div>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-orbitron text-white">98.4</span>
                    <span className="text-brand-accent mb-1 text-sm font-mono">%</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-space uppercase">Status: Optimal // No active breaches</p>
            </div>
            
            <div className="glass-panel p-6 rounded-xl border border-brand-neon/20 holo-card">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-orbitron text-brand-neon tracking-widest uppercase">Neural_Network_Load</span>
                    <div className="w-2 h-2 rounded-full bg-brand-neon animate-pulse"></div>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-orbitron text-white">12.8</span>
                    <span className="text-brand-neon mb-1 text-sm font-mono">MS</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-space uppercase">Latency: Sub-millisecond // Peak Performance</p>
            </div>

            <div className={`glass-panel p-6 rounded-xl border ${securityLevel === 'CRITICAL' ? 'border-red-500' : 'border-brand-emerald/20'} holo-card`}>
                <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-orbitron tracking-widest uppercase ${securityLevel === 'CRITICAL' ? 'text-red-500' : 'text-brand-emerald'}`}>Threat_Mitigation_Rate</span>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${securityLevel === 'CRITICAL' ? 'bg-red-500' : 'bg-brand-emerald'}`}></div>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-orbitron text-white">100</span>
                    <span className="text-brand-emerald mb-1 text-sm font-mono">%</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-space uppercase">Auto-Mitigation: Active // AI Response Ready</p>
            </div>
        </div>
    );
};

// --- Neural Node Map Component ---
const NeuralNodeMap = () => {
    const [nodes, setNodes] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        const fetchNodes = async () => {
            try {
                const res = await fetch('/api/nodes').catch(() => null);
                if (res && res.ok) {
                    const data = await res.json();
                    setNodes(data);
                } else {
                    // Fallback
                    const initialNodes = Array.from({ length: 48 }).map((_, i) => ({
                        id: i,
                        status: Math.random() > 0.1 ? 'ACTIVE' : 'WARNING',
                        load: Math.random() * 100,
                        sector: ['ALPHA', 'BETA', 'GAMMA', 'DELTA'][Math.floor(i / 12)]
                    }));
                    setNodes(initialNodes);
                }
            } catch (e) {}
        };

        fetchNodes();
        
        const interval = setInterval(() => {
            setNodes(prev => prev.map(n => ({
                ...n,
                load: Math.min(100, Math.max(0, n.load + (Math.random() - 0.5) * 15)),
                status: n.load > 85 ? 'CRITICAL' : n.load > 60 ? 'WARNING' : 'ACTIVE'
            })));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-panel p-4 rounded-lg border border-white/10 h-full flex flex-col bg-brand-dark/40 relative overflow-hidden">
            <div className="absolute inset-0 scanline-overlay opacity-5"></div>
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2 relative z-10">
                <span className="text-[10px] font-orbitron text-brand-accent tracking-widest uppercase">Neural_Node_Matrix</span>
                <span className="text-[8px] font-mono text-gray-500">SECTORS: 04</span>
            </div>
            
            <div className="grid grid-cols-6 md:grid-cols-8 gap-1.5 flex-1 relative z-10">
                {nodes.map(node => (
                    <motion.div 
                        key={node.id}
                        onMouseEnter={() => { setSelectedNode(node); playSound('hover'); }}
                        animate={{ 
                            backgroundColor: node.status === 'CRITICAL' ? '#ef4444' : node.status === 'WARNING' ? '#f59e0b' : '#00F0FF',
                            opacity: node.status === 'CRITICAL' ? [0.4, 1, 0.4] : 0.6
                        }}
                        transition={{ duration: node.status === 'CRITICAL' ? 0.5 : 2, repeat: Infinity }}
                        className="aspect-square rounded-sm border border-white/5 cursor-crosshair relative group"
                    >
                        {selectedNode?.id === node.id && (
                            <div className="absolute inset-0 border border-white animate-pulse z-20"></div>
                        )}
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {selectedNode && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-4 p-2 bg-black/60 rounded border border-white/10 relative z-10"
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-[8px] font-mono text-brand-accent">NODE_{selectedNode.id} // SECTOR_{selectedNode.sector}</span>
                            <span className={`text-[8px] font-mono ${selectedNode.status === 'CRITICAL' ? 'text-red-500' : 'text-brand-emerald'}`}>{selectedNode.status}</span>
                        </div>
                        <div className="mt-1 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-accent transition-all duration-300" style={{ width: `${selectedNode.load}%` }}></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Node Matrix Component ---
const NodeMatrix = ({ count = 64 }) => {
    const [nodes, setNodes] = useState([]);

    useEffect(() => {
        const initialNodes = Array.from({ length: count }).map((_, i) => ({
            id: i,
            status: Math.random() > 0.1 ? 'healthy' : 'active',
            load: Math.random() * 100
        }));
        setNodes(initialNodes);

        const interval = setInterval(() => {
            setNodes(prev => prev.map(n => ({
                ...n,
                status: Math.random() > 0.95 ? (n.status === 'healthy' ? 'active' : 'healthy') : n.status,
                load: Math.min(100, Math.max(0, n.load + (Math.random() - 0.5) * 10))
            })));
        }, 1000);
        return () => clearInterval(interval);
    }, [count]);

    return (
        <div className="glass-panel p-4 rounded-lg border border-white/10 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <span className="text-xs font-orbitron text-brand-accent tracking-widest uppercase">Node_Matrix_State</span>
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-brand-emerald"></div>
                    <div className="w-1 h-1 rounded-full bg-brand-accent"></div>
                    <div className="w-1 h-1 rounded-full bg-red-500"></div>
                </div>
            </div>
            <div className="grid grid-cols-8 gap-2 flex-1">
                {nodes.map(node => (
                    <motion.div 
                        key={node.id}
                        animate={{ 
                            backgroundColor: node.status === 'active' ? '#00F0FF' : '#1a2333',
                            opacity: node.status === 'active' ? [0.4, 1, 0.4] : 0.6
                        }}
                        transition={{ duration: node.status === 'active' ? 1 : 2, repeat: Infinity }}
                        className="aspect-square rounded-[2px] border border-white/5 relative group cursor-crosshair"
                    >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-brand-accent/20 transition-opacity flex items-center justify-center">
                            <span className="text-[6px] font-mono text-white">{Math.round(node.load)}%</span>
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="mt-4 text-[8px] font-mono text-gray-500 flex justify-between">
                <span>TOTAL_NODES: {count}</span>
                <span className="text-brand-emerald">SYNC: OK</span>
            </div>
        </div>
    );
};

// --- Traffic Monitor Component ---
const TrafficMonitor = () => {
    const [data, setData] = useState(Array.from({ length: 20 }).map(() => Math.random() * 40 + 20));

    useEffect(() => {
        const interval = setInterval(() => {
            setData(prev => [...prev.slice(1), Math.random() * 50 + 20]);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-panel p-4 rounded-lg border border-white/10 h-full flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2 relative z-10">
                <span className="text-xs font-orbitron text-brand-neon tracking-widest uppercase">Traffic_Throughput</span>
                <span className="text-[10px] font-mono text-brand-neon animate-pulse">LIVE</span>
            </div>
            <div className="flex-1 flex items-end gap-1 relative z-10">
                {data.map((h, i) => (
                    <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.5 }}
                        className={`flex-1 rounded-t-sm ${h > 60 ? 'bg-red-500' : 'bg-brand-neon/60'} transition-colors duration-300`}
                    />
                ))}
            </div>
            <div className="mt-2 flex justify-between items-center relative z-10">
                <div className="text-[8px] font-mono text-gray-500 uppercase">Latency: {(Math.random() * 5 + 2).toFixed(1)}ms</div>
                <div className="text-[8px] font-mono text-brand-neon">VOL: {Math.round(Math.random() * 1000 + 500)} KB/s</div>
            </div>
        </div>
    );
};

// --- Diagnostics Panel Component ---
const DiagnosticsPanel = () => {
    const lines = [
        "KERNEL_MODULE: Loaded [X-77]",
        "CRYPTO_SYNC: AES-GCM-256",
        "NEURAL_LATENCY: 0.04ms",
        "FIREWALL_V4: ACTIVE",
        "SENTINEL_NODE: ENGAGED",
        "QUANTUM_SHIELD: 98.4%",
        "DDoS_PROTECTION: ON",
        "BUFFER_STATE: STABLE"
    ];

    return (
        <div className="glass-panel p-4 rounded-lg border border-white/10 h-full flex flex-col bg-brand-dark/20">
            <div className="text-xs font-orbitron text-gray-400 tracking-widest mb-4 uppercase border-b border-white/5 pb-2">System_Diagnostics</div>
            <div className="space-y-2 flex-1">
                {lines.map((line, i) => (
                    <div key={i} className="flex justify-between items-center">
                        <span className="text-[9px] font-mono text-gray-500">{line.split(': ')[0]}</span>
                        <div className="flex items-center gap-2">
                            <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div animate={{ width: ['20%', '80%', '40%'] }} transition={{ duration: 3 + i, repeat: Infinity }} className="h-full bg-brand-accent/40"></motion.div>
                            </div>
                            <span className="text-[9px] font-mono text-brand-accent">{line.split(': ')[1]}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CommandCenter = ({ onExit }) => {
    const [threats, setThreats] = useState([
        { id: 1, type: 'CRITICAL', origin: '192.168.1.104', action: 'SQL Injection Blocked', location: 'Tokyo, JP' },
        { id: 2, type: 'WARNING', origin: '45.12.33.19', action: 'Port Scan Detected', location: 'London, UK' },
        { id: 3, type: 'INFO', origin: '10.0.4.22', action: 'Neural Node Sync', location: 'Global' }
    ]);
    const [mitigationLogs, setMitigationLogs] = useState([]);
    const [securityLevel, setSecurityLevel] = useState('LOW');

    const handleMitigate = async (id) => {
        playSound('click');
        try {
            const res = await fetch('/api/mitigate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            }).catch(() => ({ ok: true, json: () => Promise.resolve({ success: true, message: "Threat neutralized locally (Simulated)." }) }));
            
            const data = await (res.ok ? res.json() : res.json());
            
            const timestamp = new Date().toLocaleTimeString();
            setMitigationLogs(prev => [`[${timestamp}] MITIGATION: ${data.message}`, ...prev].slice(0, 5));
            setThreats(prev => prev.filter(t => t.id !== id));
            playSound('success');
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const locations = Object.keys(CITY_COORDS).filter(k => k !== 'Global');
            const newThreat = {
                id: Date.now(),
                type: ['CRITICAL', 'WARNING', 'INFO'][Math.floor(Math.random() * 3)],
                origin: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                action: ['DDoS Mitigation', 'Brute Force Blocked', 'XSS Deflected', 'Encrypted Handshake'][Math.floor(Math.random() * 4)],
                location: locations[Math.floor(Math.random() * locations.length)]
            };
            setThreats(prev => [newThreat, ...prev].slice(0, 8));
            if (newThreat.type === 'CRITICAL') playSound('hover');
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            className={`fixed inset-0 z-[60] bg-brand-black flex flex-col p-4 md:p-8 pt-24 overflow-hidden transition-all duration-500 ${securityLevel === 'CRITICAL' ? 'bg-red-950/20' : ''}`}
        >
            <div className={`absolute inset-0 cyber-grid opacity-20 pointer-events-none ${securityLevel === 'CRITICAL' ? 'text-red-500' : ''}`}></div>
            <div className="scanning-line"></div>
            
            {/* Header / Info Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded border border-brand-accent/50 flex items-center justify-center bg-brand-accent/5 relative">
                        <div className="absolute inset-0 animate-pulse bg-brand-accent/10"></div>
                        <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div>
                        <h2 className="font-orbitron text-2xl md:text-3xl text-white font-black tracking-tighter uppercase">Aegis_Command_Center</h2>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full animate-pulse ${securityLevel === 'CRITICAL' ? 'bg-red-500' : 'bg-brand-emerald'}`}></span>
                            <p className={`text-[10px] font-mono ${securityLevel === 'CRITICAL' ? 'text-red-500' : 'text-brand-emerald'}`}>UPLINK_SECURE: AES-256-GCM | NODES_SYNCED: 104 | DEFENSE_STATE: {securityLevel}</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-white/5 rounded border border-white/10 gap-2">
                        {['LOW', 'HIGH', 'CRITICAL'].map(level => (
                            <button 
                                key={level}
                                onClick={() => { setSecurityLevel(level); playSound('click'); }}
                                className={`px-3 py-1 text-[8px] font-orbitron tracking-widest transition-all ${securityLevel === level ? (level === 'CRITICAL' ? 'bg-red-500 text-black' : 'bg-brand-accent text-black') : 'text-gray-500 hover:text-white'}`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={onExit}
                        className="px-6 py-2 border border-red-500/50 text-red-500 font-space text-xs hover:bg-red-500 hover:text-black transition-all tracking-widest uppercase"
                    >
                        Disconnect
                    </button>
                </div>
            </div>

            <SecurityOverview securityLevel={securityLevel} />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 relative z-10">
                <div className="glass-panel p-4 rounded border border-white/5 flex flex-col">
                    <span className="text-[8px] font-orbitron text-gray-500 uppercase tracking-widest mb-1">Quantum_Entropy</span>
                    <div className="text-lg font-orbitron text-white">0.00042 <span className="text-[8px] text-brand-accent">λ</span></div>
                </div>
                <div className="glass-panel p-4 rounded border border-white/5 flex flex-col">
                    <span className="text-[8px] font-orbitron text-gray-500 uppercase tracking-widest mb-1">Active_Neural_Nodes</span>
                    <div className="text-lg font-orbitron text-white">1,024 <span className="text-[8px] text-brand-emerald">SYNC</span></div>
                </div>
                <div className="glass-panel p-4 rounded border border-white/5 flex flex-col">
                    <span className="text-[8px] font-orbitron text-gray-500 uppercase tracking-widest mb-1">Blocked_Packets_24h</span>
                    <div className="text-lg font-orbitron text-white">1.49M <span className="text-[8px] text-red-500">+12%</span></div>
                </div>
                <div className="glass-panel p-4 rounded border border-white/5 flex flex-col">
                    <span className="text-[8px] font-orbitron text-gray-500 uppercase tracking-widest mb-1">Uptime_Metric</span>
                    <div className="text-lg font-orbitron text-white">99.9994% <span className="text-[8px] text-brand-neon">MAX</span></div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 overflow-hidden">
                {/* Left Sidebar: Threat Feed & Log */}
                <div className="lg:col-span-3 flex flex-col gap-6 h-full overflow-hidden">
                    <div className="flex-1 overflow-hidden">
                        <ThreatFeed threats={threats} onMitigate={handleMitigate} />
                    </div>
                    <div className="h-48 shrink-0">
                        <SystemLog threats={threats} />
                    </div>
                </div>

                {/* Main Content: Globe and Node Matrix */}
                <div className="lg:col-span-6 flex flex-col gap-6 overflow-hidden">
                    <div className="flex-1 glass-panel rounded-xl border border-white/10 relative overflow-hidden bg-brand-dark/40 flex flex-col group">
                        <div className="absolute inset-0 scanline-overlay opacity-10 pointer-events-none"></div>
                        <div className="absolute top-4 left-4 z-20">
                            <span className="text-[10px] font-orbitron text-brand-accent tracking-[0.2em] uppercase neon-text-pulse">Tactical_Globe_v9</span>
                        </div>
                        <div className="flex-1 relative cursor-move">
                            <CommandGlobe threats={threats} />
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] aspect-square border border-white/5 rounded-full"></div>
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] aspect-square border-t border-brand-accent/20 rounded-full"
                                ></motion.div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-[110%] h-[1px] bg-brand-accent/5 rotate-45"></div>
                                    <div className="w-[110%] h-[1px] bg-brand-accent/5 -rotate-45"></div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute bottom-4 left-4 font-mono text-[8px] text-gray-600 flex gap-4">
                            <span>CRYPT_VER: v9.42.0</span>
                            <span className="text-brand-accent/30 tracking-widest">||||||||||||||||||||||||||</span>
                            <span>NODE: X-77-NEURAL</span>
                        </div>
                    </div>
                    <div className="h-fit">
                        <SystemMetrics securityLevel={securityLevel} />
                    </div>
                </div>

                {/* Right Sidebar: Node Matrix & Traffic Monitor */}
                <div className="lg:col-span-3 flex flex-col gap-6 h-full overflow-hidden">
                    <div className="flex-1 overflow-hidden">
                        <NeuralNodeMap />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <TrafficMonitor />
                    </div>
                    <div className="h-48 shrink-0 overflow-hidden">
                        <DiagnosticsPanel />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const PlatformPage = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="min-h-screen pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto glass-panel p-8 md:p-12 rounded-xl border border-white/10">
            <h2 className="font-orbitron text-3xl md:text-4xl text-white mb-6">AEGIS PLATFORM ARCHITECTURE</h2>
            <p className="font-space text-gray-400 mb-8 leading-relaxed">
                The Aegis platform is built on a zero-trust foundation, leveraging quantum-resistant cryptography and autonomous AI nodes.
                It continuously monitors, learns, and adapts to new threat vectors in real-time.
            </p>
            
            <div className="mb-12">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-orbitron text-brand-accent tracking-widest">DECENTRALIZED NODE GRID</span>
                    <span className="text-[10px] font-mono text-gray-500">NODES_ONLINE: 104</span>
                </div>
                <NetworkTopology />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="p-6 bg-brand-dark/50 border border-white/5 rounded-lg hover:border-brand-accent/50 transition-colors">
                    <h3 className="font-orbitron text-xl text-white mb-2">Quantum Resilience</h3>
                    <p className="font-space text-sm text-gray-500">Lattice-based encryption ensures safety against post-quantum compute.</p>
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
const IntelligenceGlobe = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        currentMount.appendChild(renderer.domElement);

        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        // Core Sphere
        const geometry = new THREE.SphereGeometry(2, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: '#7B2CBF',
            wireframe: true,
            transparent: true,
            opacity: 0.2
        });
        const sphere = new THREE.Mesh(geometry, material);
        globeGroup.add(sphere);

        // Grid overlay
        const gridGeom = new THREE.SphereGeometry(2.05, 16, 16);
        const gridMat = new THREE.MeshBasicMaterial({
            color: '#00F0FF',
            wireframe: true,
            transparent: true,
            opacity: 0.05
        });
        const grid = new THREE.Mesh(gridGeom, gridMat);
        globeGroup.add(grid);

        camera.position.z = 5;

        const animate = () => {
            requestAnimationFrame(animate);
            globeGroup.rotation.y += 0.003;
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            const w = currentMount.clientWidth;
            const h = currentMount.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement);
            }
            scene.clear();
            renderer.dispose();
        };
    }, []);

    return <div ref={mountRef} className="w-full h-full" />;
};

const Intelligence = () => {
    return (
        <section id="intelligence" className="relative py-24 px-6 z-10 bg-black/20">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex-1"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-neon/30 bg-brand-neon/10 w-fit mb-6">
                        <span className="w-2 h-2 rounded-full bg-brand-neon animate-pulse"></span>
                        <span className="text-[10px] font-space text-brand-neon tracking-widest uppercase">Telemetry Stream: Active</span>
                    </div>
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
                    className="flex-1 w-full aspect-square md:aspect-video rounded-xl border border-white/10 glass-panel relative overflow-hidden bg-brand-dark/40 flex items-center justify-center group"
                >
                    <div className="absolute inset-0 bg-radial-gradient opacity-30"></div>
                    <div className="absolute inset-0 z-0">
                        <IntelligenceGlobe />
                    </div>
                    
                    {/* Animated Data Points */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 bg-brand-accent rounded-full"
                                initial={{ opacity: 0 }}
                                animate={{ 
                                    opacity: [0, 1, 0],
                                    scale: [1, 2, 1],
                                    x: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                                    y: [Math.random() * 100 + '%', Math.random() * 100 + '%']
                                }}
                                transition={{ 
                                    duration: Math.random() * 3 + 2, 
                                    repeat: Infinity,
                                    delay: i * 0.5
                                }}
                            />
                        ))}
                    </div>

                    <div className="absolute bottom-4 right-4 z-20 font-mono text-[8px] text-brand-accent/50 group-hover:text-brand-accent transition-colors">
                        SECURE_UPLINK_ESTABLISHED // NODE_77
                    </div>
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

// --- Auth Page Component ---
const AuthPage = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', company: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        playSound('click');
        
        // Simulate "Neural Scan"
        await new Promise(r => setTimeout(r, 2000));
        
        playSound('success');
        onAuthSuccess();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-brand-black">
            <div className="absolute inset-0 cyber-grid opacity-20"></div>
            <div className="absolute inset-0 bg-radial-gradient opacity-30"></div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden group">
                    {loading && (
                        <div className="absolute inset-0 z-50 bg-brand-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative mb-4">
                                <motion.div 
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 bg-brand-accent shadow-[0_0_15px_#00F0FF]"
                                />
                            </div>
                            <span className="font-orbitron text-brand-accent text-[10px] tracking-[0.3em] animate-pulse">SCANNIN_IDENTITY...</span>
                        </div>
                    )}

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-xl bg-brand-accent/10 border border-brand-accent flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                            <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="font-orbitron text-2xl font-black text-white tracking-widest text-center">
                            AEGIS_<span className="text-brand-accent">{isLogin ? 'ACCESS' : 'PROVISION'}</span>
                        </h2>
                        <p className="font-space text-gray-500 text-[10px] mt-2 tracking-[0.2em] uppercase">Protocol_v9.42 // Secure_Uplink</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="block text-[10px] font-orbitron text-gray-500 tracking-widest uppercase">Organization_ID</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white font-space text-sm focus:outline-none focus:border-brand-accent transition-all"
                                    placeholder="ENTER_ORG_CODE"
                                    value={formData.company}
                                    onChange={e => setFormData({...formData, company: e.target.value})}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-orbitron text-gray-500 tracking-widest uppercase">Admin_Identifier</label>
                            <input 
                                type="email" 
                                required
                                className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white font-space text-sm focus:outline-none focus:border-brand-accent transition-all"
                                placeholder="name@aegis.system"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-orbitron text-gray-500 tracking-widest uppercase">Neural_Passkey</label>
                            <input 
                                type="password" 
                                required
                                className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white font-space text-sm focus:outline-none focus:border-brand-accent transition-all"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full py-4 bg-brand-accent text-black font-black font-orbitron tracking-[0.2em] text-xs hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] relative overflow-hidden group/btn"
                        >
                            <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover/btn:animate-[scan_1.5s_linear_infinite]"></div>
                            <span className="relative z-10">{isLogin ? 'INITIATE_SESSION' : 'REGISTER_ENDPOINT'}</span>
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4 items-center">
                        <button 
                            onClick={() => { setIsLogin(!isLogin); playSound('hover'); }}
                            className="text-[10px] font-space text-gray-500 hover:text-brand-accent transition-colors tracking-widest uppercase"
                        >
                            {isLogin ? "Generate_New_Credentials" : "Return_to_Access_Portal"}
                        </button>
                        <div className="flex gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-neon animate-pulse" style={{ animationDelay: '1s' }}></div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
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
    const [isBooting, setIsBooting] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [toast, setToast] = useState(null);
    const [currentView, setCurrentView] = useState('home');
    const [isInitializing, setIsInitializing] = useState(false);

    if (isBooting) {
        return <BootSequence onComplete={() => setIsBooting(false)} />;
    }

    if (!isAuthenticated) {
        return <AuthPage onAuthSuccess={() => setIsAuthenticated(true)} />;
    }

    const handleInitializeSys = async () => {
        playSound('click');
        setToast({ message: 'Establishing Secure Uplink...', type: 'success' });
        
        try {
            const res = await fetch('/api/status').catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                setTimeout(() => setToast({ message: `System Check: ${data.message}`, type: 'success' }), 500);
            }
        } catch (err) {}
        
        // Trigger cinematic initialization
        setIsInitializing(true);
    };

    const renderView = () => {
        const viewVariants = {
            initial: { opacity: 0, scale: 0.98, filter: 'blur(10px)' },
            animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
            exit: { opacity: 0, scale: 1.02, filter: 'blur(10px)' }
        };

        const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] };

        switch(currentView) {
            case 'home':
                return (
                    <motion.div key="home" variants={viewVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
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
                    <motion.div key="deploy" variants={viewVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
                        <DeploymentPage onComplete={() => setCurrentView('home')} />
                    </motion.div>
                );
            case 'platform':
                return (
                    <motion.div key="platform" variants={viewVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
                        <PlatformPage />
                        <Footer onViewChange={setCurrentView} />
                    </motion.div>
                );
            case 'company':
                return (
                    <motion.div key="company" variants={viewVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
                        <CompanyPage />
                        <Footer onViewChange={setCurrentView} />
                    </motion.div>
                );
            case 'contact':
                return (
                    <motion.div key="contact" variants={viewVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
                        <ContactPage />
                        <Footer onViewChange={setCurrentView} />
                    </motion.div>
                );
            case 'command':
                return (
                    <motion.div key="command" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <CommandCenter onExit={() => setCurrentView('home')} />
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
                {isInitializing ? (
                    <SystemInitialization key="init" onComplete={() => {
                        setIsInitializing(false);
                        setCurrentView('command');
                        playSound('success');
                    }} />
                ) : renderView()}
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
