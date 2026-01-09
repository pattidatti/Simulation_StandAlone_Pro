import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';

interface SimulationHostAuthProps {
    onAuth: () => void;
    adminPassword: string;
}

export const SimulationHostAuth: React.FC<SimulationHostAuthProps> = ({ onAuth, adminPassword }) => {
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState(false);

    const handleAuthSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (authPassword === adminPassword) {
            onAuth();
            sessionStorage.setItem('admin_session', 'active');
            setAuthError(false);
        } else {
            setAuthError(true);
            setAuthPassword('');
            if (navigator.vibrate) navigator.vibrate(50);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-[100] overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]" />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full max-w-md p-8 relative"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                        className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 backdrop-blur-xl"
                    >
                        <Lock className="w-10 h-10 text-indigo-400" />
                    </motion.div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">Begrenset tilgang</h2>
                    <p className="text-slate-400 font-medium">Vennligst oppgi passord for å fortsette</p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div className="relative group">
                        <motion.div
                            animate={authError ? { x: [-10, 10, -10, 10, 0] } : {}}
                            transition={{ duration: 0.4 }}
                        >
                            <input
                                autoFocus
                                type="password"
                                value={authPassword}
                                onChange={(e) => {
                                    setAuthPassword(e.target.value);
                                    if (authError) setAuthError(false);
                                }}
                                placeholder="Passord..."
                                className={`w-full bg-slate-900/50 border-2 ${authError ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'} rounded-2xl px-6 py-4 text-white text-lg font-medium outline-none transition-all duration-300 backdrop-blur-md placeholder:text-slate-600`}
                            />
                        </motion.div>

                        <AnimatePresence>
                            {authError && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-red-400 text-sm font-bold mt-2 ml-2"
                                >
                                    Ugyldig passord. Prøv igjen.
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                    >
                        Lås opp panel
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="text-slate-500 hover:text-slate-300 text-sm font-bold transition-colors"
                    >
                        Tilbake til forsiden
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
