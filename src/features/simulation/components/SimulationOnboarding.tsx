import React, { useState } from 'react';
import { ArrowRight, User as UserIcon, Check } from 'lucide-react';
import type { Role } from '../simulationTypes';
import { useNavigate } from 'react-router-dom';

interface SimulationOnboardingProps {
    pin: string;
    account: any;
    onCreatePlayer: (name: string, role: Role) => void;
    isCreating: boolean;
}

export const SimulationOnboarding: React.FC<SimulationOnboardingProps> = ({ pin, account, onCreatePlayer, isCreating }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState<'WELCOME' | 'CREATE' | 'SUCCESS'>('WELCOME');
    const [name, setName] = useState(account?.displayName || '');
    const [role, setRole] = useState<Role>('PEASANT');

    if (step === 'WELCOME') {
        return (
            <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-12 md:p-16 rounded-[3.5rem] text-center space-y-10 shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="space-y-4">
                    <h1 className="text-6xl md:text-8xl font-black italic text-white tracking-tighter leading-none">FEUDAL SIM</h1>
                    <p className="text-indigo-400 font-black uppercase tracking-[0.4em] text-xs">En Levende Simulator</p>
                </div>
                <div className="space-y-6">
                    <p className="text-slate-400 text-lg md:text-xl font-medium max-w-md mx-auto leading-relaxed">
                        Dette er et spill om makt, ressurser og overlevelse i et feydalt samfunn.
                    </p>
                </div>
                <div className="pt-4 space-y-4">
                    <button
                        onClick={() => setStep('CREATE')}
                        className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-indigo-600/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto w-64"
                    >
                        Skap din Karakter <ArrowRight size={20} />
                    </button>
                    <button
                        onClick={() => navigate('/sim')}
                        className="text-slate-500 hover:text-white font-black uppercase tracking-widest text-xs transition-colors"
                    >
                        Gå til Lobby
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'CREATE') {
        return (
            <div className="bg-slate-900 border border-white/10 p-12 rounded-[3.5rem] shadow-2xl space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-black italic text-white tracking-tighter uppercase">Hvem er du?</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Opprett din karakter i {pin}</p>
                </div>
                <div className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] ml-2">Ditt Navn i Riket</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-6 flex items-center text-slate-500 group-focus-within:text-indigo-400">
                                <UserIcon size={20} />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="f.eks. Eirik den Røde"
                                className="w-full bg-slate-950 border-2 border-white/5 rounded-3xl py-5 pl-16 pr-6 text-xl font-black text-white outline-none focus:border-indigo-500/50 transition-all"
                            />
                        </div>
                    </div>
                    {pin === 'TEST' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(['PEASANT', 'SOLDIER', 'MERCHANT', 'BARON'] as Role[]).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRole(r)}
                                    className={`py-4 rounded-2xl font-black uppercase tracking-widest text-xs border-2 transition-all ${role === r ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-transparent text-slate-500'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="pt-4 flex gap-4">
                        <button onClick={() => setStep('WELCOME')} className="flex-1 py-5 bg-white/5 text-slate-400 rounded-3xl font-black uppercase tracking-widest text-xs">Tilbake</button>
                        <button
                            onClick={() => { onCreatePlayer(name, role); setStep('SUCCESS'); }}
                            disabled={!name.trim() || isCreating}
                            className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-sm"
                        >
                            {isCreating ? 'Oppretter...' : 'Start Reisen'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-emerald-500/10 backdrop-blur-3xl border border-emerald-500/30 p-16 rounded-[4rem] text-center space-y-8 shadow-2xl animate-in zoom-in duration-500">
            <Check size={48} className="text-white mx-auto bg-emerald-500 rounded-[2rem] p-4 shadow-2xl" />
            <h2 className="text-4xl font-black italic text-white uppercase">Velkommen inn!</h2>
        </div>
    );
};
