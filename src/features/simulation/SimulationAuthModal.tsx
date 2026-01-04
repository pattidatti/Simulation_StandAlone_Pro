import React, { useState, useEffect } from 'react';
import { Mail, Lock, User as UserIcon, Loader2, AlertCircle, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { useSimulationAuth } from './SimulationAuthContext';

interface SimulationAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'LOGIN' | 'REGISTER';
}

export const SimulationAuthModal: React.FC<SimulationAuthModalProps> = ({ isOpen, onClose, initialMode = 'REGISTER' }) => {
    const { login, register, resetPassword, checkNameAvailability, error: authError } = useSimulationAuth();

    const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
    const [checkingName, setCheckingName] = useState(false);

    // Name Availability Logic
    useEffect(() => {
        if (mode !== 'REGISTER' || displayName.length < 3) {
            setNameAvailable(null);
            return;
        }

        const timer = setTimeout(async () => {
            setCheckingName(true);
            try {
                const available = await checkNameAvailability(displayName);
                setNameAvailable(available);
            } catch (err) {
                console.error(err);
            } finally {
                setCheckingName(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [displayName, mode, checkNameAvailability]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            if (mode === 'LOGIN') {
                await login(email, password);
                onClose();
            } else if (mode === 'REGISTER') {
                if (nameAvailable === false) throw new Error("Navnet er allerede tatt.");
                await register(email, password, displayName);
                onClose();
            } else if (mode === 'FORGOT') {
                await resetPassword(email);
                setSuccess("E-post for tilbakestilling er sendt!");
            }
        } catch (err: any) {
            setError(err.message || "Noe gikk galt. Vennligst prøv igjen.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Visual Header */}
                <div className="bg-indigo-600 h-2 w-full" />

                <div className="p-8 space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black italic text-white tracking-tighter uppercase">
                                {mode === 'LOGIN' ? 'Velkommen tilbake' : mode === 'REGISTER' ? 'Opprett Profil' : 'Glemt Passord'}
                            </h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                {mode === 'LOGIN' ? 'Fortsett din reise i simulation' : 'Bli en del av historien'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                            <X className="text-slate-500" size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'REGISTER' && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vises som (Unikt navn)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <UserIcon size={18} className="text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ditt kallenavn..."
                                        className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500/50 rounded-2xl py-3.5 pl-11 pr-4 text-white outline-none transition-all"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                        {checkingName ? (
                                            <Loader2 size={16} className="text-slate-500 animate-spin" />
                                        ) : nameAvailable === true ? (
                                            <ShieldCheck size={16} className="text-emerald-500" />
                                        ) : nameAvailable === false ? (
                                            <AlertCircle size={16} className="text-rose-500" />
                                        ) : null}
                                    </div>
                                </div>
                                {nameAvailable === false && (
                                    <p className="text-[10px] text-rose-400 font-bold px-1 italic">Dette navnet er dessverre opptatt.</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-post</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="navn@epost.no"
                                    className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500/50 rounded-2xl py-3.5 pl-11 pr-4 text-white outline-none transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {mode !== 'FORGOT' && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Passord</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Min. 8 tegn..."
                                        className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500/50 rounded-2xl py-3.5 pl-11 pr-4 text-white outline-none transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error/Success Messages */}
                        {(error || authError) && (
                            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-400">
                                <AlertCircle size={18} />
                                <p className="text-xs font-bold">{error || authError}</p>
                            </div>
                        )}
                        {success && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-400">
                                <ShieldCheck size={18} />
                                <p className="text-xs font-bold">{success}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-4 space-y-4">
                            <button
                                type="submit"
                                disabled={loading || (mode === 'REGISTER' && nameAvailable === false)}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                    <>
                                        {mode === 'LOGIN' ? 'Logg Inn' : mode === 'REGISTER' ? 'Opprett Profil' : 'Send E-post'}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-between px-2">
                                {mode === 'LOGIN' ? (
                                    <>
                                        <button type="button" onClick={() => setMode('REGISTER')} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">Ny her? Opprett profil</button>
                                        <button type="button" onClick={() => setMode('FORGOT')} className="text-[10px] font-medium text-slate-500 hover:text-white transition-colors">Glemt passord?</button>
                                    </>
                                ) : (
                                    <button type="button" onClick={() => setMode('LOGIN')} className="w-full text-center text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">Har du allerede profil? Logg inn</button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
