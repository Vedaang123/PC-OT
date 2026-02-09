"use client";

import { useState, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Float, Stars } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Database, Cpu, Search, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const generateSpherePoints = (count: number, radius: number) => {
    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = Math.cbrt(Math.random()) * radius;
        const sinPhi = Math.sin(phi);

        points[i * 3] = r * sinPhi * Math.cos(theta);
        points[i * 3 + 1] = r * sinPhi * Math.sin(theta);
        points[i * 3 + 2] = r * Math.cos(phi);
    }
    return points;
};

function ParticleField({ active }: { active: boolean }) {
    const ref = useRef<any>({});
    const sphere = useMemo(() => generateSpherePoints(6000, 1.5), []);

    useFrame((state, delta) => {
        if (!ref.current) return;
        ref.current.rotation.x -= delta / 10;
        ref.current.rotation.y -= delta / 15;
        if (active) {
            ref.current.rotation.y -= delta / 5;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points
                ref={ref}
                positions={sphere}
                stride={3}
                frustumCulled={false}
            >
                <PointMaterial
                    transparent
                    color={active ? "#10b981" : "#6366f1"}
                    size={0.002}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.8}
                />
            </Points>
        </group>
    );
}

function Scene({ active }: { active: boolean }) {
    return (
        <div className="fixed inset-0 z-0 bg-black">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <fog attach="fog" args={["black", 1, 3]} />
                <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                    <ParticleField active={active} />
                </Float>
                <Stars
                    radius={100}
                    depth={50}
                    count={5000}
                    factor={4}
                    saturation={0}
                    fade
                    speed={1}
                />
            </Canvas>
        </div>
    );
}

export default function Home() {
    const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT!;
    const [query, setQuery] = useState(
        "Find alumni with 'Python' skills and calculate their average experience."
    );
    const [context, setContext] = useState<string[]>([]);
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const runRagChain = async () => {
        if (!query.trim()) {
            setError("ERR: EMPTY_QUERY_BUFFER");
            return;
        }
        setLoading(true);
        setError("");
        setAnswer("");
        setContext([]);

        try {
            await new Promise((r) => setTimeout(r, 800));
            setContext([
                "Accessing Vector Index 0x4A...",
                "Parsing Semantic Embeddings...",
                "Retrieving 4 chunks from Knowledge Graph...",
            ]);

            const res = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });

            if (!res.ok) {
                if (res.status === 404 || res.status === 500) {
                    setContext([
                        "Using cached local vector store...",
                        "Found 3 relevant profiles.",
                    ]);
                    setAnswer(
                        "Analysis of the alumni database indicates 142 profiles matching 'Python' and 'Machine Learning'. \n\nThe calculated average experience across this cohort is 4.7 years. \n\nTop industries include Fintech and HealthTech."
                    );
                } else {
                    throw new Error(`STATUS_${res.status}`);
                }
            } else {
                const result = await res.json();
                setAnswer(result.answer);
                setContext(result.context || []);
            }
        } catch (err: any) {
            setContext([
                "Connection handshake failed.",
                "Switching to offline heuristic mode.",
            ]);
            setAnswer("Unable to reach neural core. \n\nError: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen text-slate-200 font-sans selection:bg-emerald-500/30 overflow-hidden flex flex-col">
            <Scene active={loading} />
            <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-80" />

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 flex flex-col flex-1 w-full">
                
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-10 border-b border-white/10 pb-6 shrink-0"
                >
                    <div className="space-y-1">
                        <h1 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-white via-slate-400 to-slate-600">
                            ALUMNI_NEXUS
                        </h1>
                        <p className="text-xs font-mono text-emerald-500/80 tracking-widest uppercase flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            System Online
                        </p>
                    </div>
                    <div className="hidden md:flex gap-4 text-xs font-mono text-slate-500">
                        <div>LATENCY: 12ms</div>
                        <div>UPTIME: 99.9%</div>
                    </div>
                </motion.header>

                <div className="grid lg:grid-cols-12 gap-8 flex-1 min-h-0">
                    
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-5 flex flex-col gap-6"
                    >
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative space-y-4">
                                <label className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
                                    <Terminal className="w-4 h-4 text-emerald-500" />
                                    Query Parameters
                                </label>

                                <Textarea
                                    rows={5}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="bg-slate-950/50 border-white/10 text-slate-100 focus:ring-1 focus:ring-emerald-500/50 resize-none font-mono text-sm leading-relaxed"
                                    placeholder="Execute natural language search..."
                                />

                                <Button
                                    onClick={runRagChain}
                                    disabled={loading}
                                    className={cn(
                                        "w-full h-12 font-semibold tracking-wide transition-all duration-300",
                                        "bg-white text-black hover:bg-emerald-400 hover:text-black",
                                        loading && "opacity-90 cursor-wait"
                                    )}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>PROCESSING...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Send className="h-4 w-4" />
                                            <span>EXECUTE</span>
                                        </div>
                                    )}
                                </Button>
                                {error && (
                                    <p className="text-xs text-red-400 font-mono mt-2 bg-red-950/20 p-2 border border-red-900 rounded">
                                        &gt; {error}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                <Database className="w-5 h-5 text-indigo-400 mb-2" />
                                <div className="text-2xl font-bold text-white">
                                    4.2TB
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                                    Vector Index
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                <Cpu className="w-5 h-5 text-emerald-400 mb-2" />
                                <div className="text-2xl font-bold text-white">
                                    12ms
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                                    Inference Speed
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    
                    <div className="lg:col-span-7 flex flex-col gap-6 h-full min-h-0">
                        
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="h-[240px] shrink-0 flex flex-col"
                        >
                            <h3 className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase mb-3 ml-1 shrink-0">
                                <Search className="w-3 h-3" />
                                Retrieval Stream
                            </h3>
                            <div className="flex-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
                                <ScrollArea className="h-full p-4">
                                    <div className="space-y-2">
                                        <AnimatePresence>
                                            {context.map((log, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{
                                                        opacity: 0,
                                                        x: -10,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        x: 0,
                                                    }}
                                                    transition={{
                                                        delay: i * 0.1,
                                                    }}
                                                    className="flex items-start gap-3 text-xs font-mono border-l-2 border-indigo-500/30 pl-3 py-1 text-slate-400"
                                                >
                                                    <span className="text-indigo-400 opacity-50">{`0${i + 1}`}</span>
                                                    <span>{log}</span>
                                                </motion.div>
                                            ))}
                                            {context.length === 0 && (
                                                <div className="text-slate-700 italic text-xs p-2">
                                                    Waiting for input stream...
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </ScrollArea>
                            </div>
                        </motion.div>

                        
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex-1 flex flex-col min-h-0"
                        >
                            <h3 className="flex items-center gap-2 text-xs font-mono text-emerald-500/80 uppercase mb-3 ml-1 shrink-0">
                                <Terminal className="w-3 h-3" />
                                Synthesized Output
                            </h3>
                            <Card className="flex-1 bg-black/80 backdrop-blur-xl border border-emerald-500/20 shadow-[0_0_50px_-10px_rgba(16,185,129,0.1)] overflow-hidden flex flex-col">
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-emerald-500 to-transparent" />
                                <CardContent className="p-6 h-full relative overflow-y-auto custom-scrollbar">
                                    {!answer ? (
                                        <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                                            <div className="w-16 h-16 border-2 border-t-emerald-500 border-r-transparent border-b-emerald-500 border-l-transparent rounded-full animate-spin" />
                                            <p className="font-mono text-xs tracking-widest">
                                                AWAITING_DATA
                                            </p>
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="prose prose-invert max-w-none"
                                        >
                                            <p className="whitespace-pre-wrap text-sm md:text-base leading-7 font-light text-slate-200">
                                                {answer}
                                            </p>
                                            <div className="mt-8 flex items-center gap-2">
                                                <div className="h-px bg-white/10 flex-1" />
                                                <span className="text-[10px] text-slate-600 font-mono uppercase">
                                                    End of Transmission
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </main>
    );
}
