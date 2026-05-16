const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = window.Motion || window.framerMotion || {};

// --- Audio System ---
export const playSound = (type) => {
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

// --- Toast Component ---
export const Toast = ({ message, type, onClose }) => {
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

// --- Boot Sequence Component ---
export const BootSequence = ({ onComplete }) => {
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

// --- Three.js Background Component ---
export const CyberBackground = () => {
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

        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 2000;
        const posArray = new Float32Array(particlesCount * 3);
        const radius = 3.5;

        for(let i = 0; i < particlesCount; i++) {
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

        const sphereGeometry = new THREE.SphereGeometry(radius - 0.1, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: '#7B2CBF',
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });
        const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        globeGroup.add(sphereMesh);

        const gridHelper = new THREE.GridHelper(20, 40, '#7B2CBF', '#7B2CBF');
        gridHelper.position.y = -4;
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        camera.position.z = 7;
        camera.position.y = 1;
        globeGroup.position.x = 2;

        const animate = () => {
            requestAnimationFrame(animate);
            globeGroup.rotation.y += 0.002;
            globeGroup.rotation.x += 0.001;
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
            if (currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement);
            }
            scene.clear();
            renderer.dispose();
        };
    }, []);

    return <div ref={mountRef} id="canvas-container" className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10" />;
};

// --- System Initialization Component ---
export const SystemInitialization = ({ onComplete }) => {
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
                        <h2 className="font-orbitron text-brand-accent text-3xl font-black tracking-[0.4em] mb-2 text-glow">INITIALIZING</h2>
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
                        className="h-full bg-gradient-to-r from-brand-neon to-brand-accent shadow-[0_0_15px_#00F0FF]"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4 h-48">
                    <div className="glass-panel p-4 rounded border border-white/5 font-mono text-[8px] text-brand-emerald space-y-1 overflow-y-auto custom-scrollbar">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
                                <span>{log}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
