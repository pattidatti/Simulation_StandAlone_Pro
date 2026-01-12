import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSimulationAuth } from './SimulationAuthContext';
import { LogOut, ArrowLeft, MapPin, Award, Star } from 'lucide-react';
import { useLayout } from '../../context/LayoutContext';
import { GlobalProfileContent } from './components/GlobalProfileContent';

import type { SimulationPlayer } from './simulationTypes';

interface SimulationProfileProps {
    player?: SimulationPlayer; // Current player
    regions?: Record<string, any>;
    allPlayers?: Record<string, SimulationPlayer>;
}

const InnerSimulationProfile: React.FC<SimulationProfileProps> = ({ player, allPlayers }) => {
    const { loading, logout } = useSimulationAuth();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setFullWidth, setHideHeader } = useLayout();

    const viewUid = searchParams.get('uid');

    // Determine who we are viewing
    const targetPlayer = useMemo(() => {
        if (viewUid && allPlayers && allPlayers[viewUid]) {
            return allPlayers[viewUid];
        }
        if (viewUid && player && viewUid === player.id) return player;
        return null;
    }, [viewUid, allPlayers, player]);

    // Mode: "INSPECTOR" if targetPlayer is found. "GLOBAL" otherwise.
    const mode = targetPlayer ? 'INSPECTOR' : 'GLOBAL';

    useEffect(() => {
        setFullWidth(true);
        setHideHeader(true);
        return () => {
            setFullWidth(false);
            setHideHeader(false);
        };
    }, [setFullWidth, setHideHeader]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#050510] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }


    // --- RENDER CHARACTER INSPECTOR ---
    if (mode === 'INSPECTOR' && targetPlayer) {
        return (
            <div className="min-h-screen bg-[#050510] text-slate-200 overflow-x-hidden relative selection:bg-indigo-500/30">
                {/* --- VOID ATMOSPHERE --- */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                    <div className="absolute top-[-20%] right-[20%] w-[80vw] h-[80vw] bg-emerald-900/10 rounded-full blur-[150px] animate-pulse-slow"></div>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto p-6 md:p-12 space-y-12">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)} // Go back
                            className="group flex items-center gap-3 text-slate-500 hover:text-white transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                            </div>
                            <span className="font-black uppercase tracking-[0.2em] text-xs">Tilbake</span>
                        </button>
                    </div>

                    {/* Character Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        {/* Visual / Avatar */}
                        <div className="flex flex-col items-center justify-center text-center space-y-6">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
                                <div className="w-48 h-48 bg-slate-900 border-2 border-white/10 rounded-full flex items-center justify-center relative overflow-hidden shadow-2xl">
                                    <span className="text-6xl">
                                        {targetPlayer.role === 'KING' ? '👑' :
                                            targetPlayer.role === 'BARON' ? '🏰' :
                                                targetPlayer.role === 'PEASANT' ? '🌾' : '👤'}
                                    </span>
                                </div>
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-black px-4 py-1.5 rounded-full border-4 border-[#050510] uppercase tracking-wider shadow-lg whitespace-nowrap">
                                    {targetPlayer.role}
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-8">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase tracking-tighter">
                                    {targetPlayer.name}
                                </h1>
                                <p className="text-indigo-400 font-bold uppercase tracking-widest text-sm mt-2 flex items-center gap-2">
                                    <MapPin size={14} /> {targetPlayer.regionId === 'capital' ? 'Hovedstaden' : (targetPlayer.regionId || 'Ukjent Steed')}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                                        <Award size={14} /> Level
                                    </div>
                                    <div className="text-2xl font-black text-white">{targetPlayer.stats?.level || 1}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                                        <Star size={14} /> Reputation
                                    </div>
                                    <div className="text-2xl font-black text-white">{targetPlayer.stats?.reputation || 0}</div>
                                </div>
                            </div>

                            {/* Equipment Preview (Simple) */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-widest">Utstyr</h3>
                                <div className="flex gap-3">
                                    {Object.values(targetPlayer.equipment || {}).map((item: any, i) => (
                                        <div key={i} className="w-12 h-12 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center text-lg" title={item.name}>
                                            {item.icon || '📦'}
                                        </div>
                                    ))}
                                    {Object.keys(targetPlayer.equipment || {}).length === 0 && (
                                        <span className="text-slate-600 text-xs italic">Ingen utstyr</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- DEFAULT: GLOBAL ACCOUNT PROFILE ---
    return (
        <div className="min-h-screen bg-[#050510] text-slate-200 overflow-x-hidden relative selection:bg-indigo-500/30">
            {/* --- VOID ATMOSPHERE (From NexusLayout) --- */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                <div className="absolute top-[-20%] left-[20%] w-[80vw] h-[80vw] bg-indigo-900/20 rounded-full blur-[150px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-purple-900/10 rounded-full blur-[120px]"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            </div>

            <GlobalProfileContent />

            {/* Logout Confirmation Overlay */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)} />
                    <div className="relative bg-[#0A0A15] border border-white/10 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full space-y-6 text-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                            <LogOut size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white leading-none">Logge ut?</h3>
                            <p className="text-slate-400 text-sm font-medium">Er du sikker på at du vil avslutte sesjonen?</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all"
                            >
                                Avbryt
                            </button>
                            <button
                                onClick={async () => {
                                    await logout();
                                    navigate('/sim');
                                }}
                                className="py-4 bg-rose-600 hover:bg-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-rose-600/20"
                            >
                                Logg Ut
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Wrap with NexusProvider removed
export const SimulationProfile: React.FC<SimulationProfileProps> = (props) => {
    return (
        <InnerSimulationProfile {...props} />
    );
};

