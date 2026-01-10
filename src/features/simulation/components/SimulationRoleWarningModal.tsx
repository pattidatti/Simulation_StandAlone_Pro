import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, X, Scale, TrendingUp, Anchor, Map as MapIcon, Sparkles } from 'lucide-react';

interface SimulationRoleWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    roleId: string;
    cost?: string | number;
}

export const SimulationRoleWarningModal: React.FC<SimulationRoleWarningModalProps> = ({ isOpen, onClose, onConfirm, roleId, cost }) => {
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimateIn(true);
        } else {
            setAnimateIn(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isMerchant = roleId === 'MERCHANT';

    // --- ULTRAMODERN THEME CONFIGURATION ---
    const theme = isMerchant ? {
        backdrop: 'bg-amber-950/20',
        modalBg: 'bg-[#050810]', // Deeper, richer black
        borderColor: 'border-amber-500/20',
        glowColor: 'bg-amber-500',
        shadowColor: 'shadow-[0_0_200px_rgba(245,158,11,0.15)]',
        headerGradient: 'bg-gradient-to-b from-amber-600/10 via-amber-900/5 to-transparent',
        iconBg: 'bg-gradient-to-br from-amber-400/20 to-amber-900/40',
        iconBorder: 'border-amber-500/30',
        iconGlow: 'bg-amber-500',
        iconColor: 'text-amber-400',
        titleColor: 'text-amber-100',
        accentText: 'text-amber-400',
        mutedText: 'text-amber-100/50',
        cardBg: 'bg-white/5 hover:bg-white/10',
        cardBorder: 'border-white/5 hover:border-amber-500/30',
        buttonPrimary: 'bg-amber-400 hover:bg-amber-300 text-black border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_50px_rgba(245,158,11,0.6)]',
        buttonSecondary: 'bg-transparent text-amber-100/40 hover:text-amber-100 hover:bg-white/5 border-transparent hover:border-white/10', // Simplified tertiary
        icon: Scale
    } : {
        backdrop: 'bg-red-950/20',
        modalBg: 'bg-[#0F0505]',
        borderColor: 'border-red-500/20',
        glowColor: 'bg-red-600',
        shadowColor: 'shadow-[0_0_150px_rgba(220,38,38,0.2)]',
        headerGradient: 'bg-gradient-to-b from-red-900/20 to-transparent',
        iconBg: 'bg-red-900/20',
        iconBorder: 'border-red-500/30',
        iconGlow: 'bg-red-500',
        iconColor: 'text-red-500',
        titleColor: 'text-red-100',
        accentText: 'text-red-500',
        mutedText: 'text-red-200/50',
        cardBg: 'bg-red-950/20',
        cardBorder: 'border-red-500/10',
        buttonPrimary: 'bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border-red-600/30',
        buttonSecondary: 'bg-transparent text-slate-500 hover:text-slate-300 border-transparent',
        icon: AlertTriangle
    };

    const RoleIcon = theme.icon;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 perspective-[1000px]">
            {/* Cinematic Backdrop with Blur */}
            <div
                className={`absolute inset-0 bg-black/80 backdrop-blur-2xl transition-opacity duration-700 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            >
                {/* Subtle colored ambient light */}
                <div className={`absolute inset-0 opacity-20 bg-radial-gradient from-${isMerchant ? 'amber' : 'red'}-900/20 to-transparent`} />
            </div>

            {/* Modal Container */}
            <div
                className={`relative z-10 w-full ${isMerchant ? 'max-w-3xl' : 'max-w-lg'} 
                ${theme.modalBg} border ${theme.borderColor} rounded-[3rem] ${theme.shadowColor} 
                overflow-hidden flex flex-col transition-all duration-700 ease-out transform
                ${animateIn ? 'scale-100 translate-y-0 opacity-100 rotate-x-0' : 'scale-90 translate-y-10 opacity-0 rotate-x-12'}
                `}
            >

                {/* --- AMBIENT EFFECTS --- */}

                {/* God Ray / Sheen */}
                <div className={`absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-b from-white/5 to-transparent rotate-45 pointer-events-none opacity-20`} />

                {/* Top Glow Orb */}
                <div className={`absolute -top-64 left-1/2 -translate-x-1/2 w-[800px] h-[600px] ${theme.glowColor} opacity-10 blur-[150px] rounded-full pointer-events-none`} />

                {/* Floating Particles (Static representation for layout) */}
                <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
                    <div className="absolute top-20 left-20 w-1 h-1 bg-white rounded-full animate-pulse" />
                    <div className="absolute top-40 right-40 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-700" />
                    <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse delay-300" />
                </div>


                {/* --- CONTENT --- */}
                <div className={`p-12 relative flex flex-col items-center text-center ${isMerchant ? 'gap-10' : 'gap-6'}`}>

                    {/* Close Button UI */}
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 group p-2 rounded-full transition-all hover:bg-white/5"
                    >
                        <X size={24} className={`${theme.mutedText} group-hover:text-white transition-colors`} />
                    </button>

                    {/* HERO SECTION: Icon + Title */}
                    <div className="relative group">
                        {/* Rotating Ring behind icon */}
                        {isMerchant && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-amber-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                        )}

                        {/* Glow Burst */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 ${theme.glowColor} blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000`} />

                        {/* Main Icon */}
                        <div className={`relative w-28 h-28 mx-auto rounded-[2.5rem] ${theme.iconBg} ${theme.iconBorder} border flex items-center justify-center shadow-2xl backdrop-blur-sm z-10 transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1`}>
                            <RoleIcon size={64} className={`${theme.iconColor} drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]`} />

                            {/* Shiny reflection overlay */}
                            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                    </div>

                    <div className="space-y-4 max-w-lg mx-auto z-10">
                        <div className="flex items-center justify-center gap-3 opacity-80">
                            <div className={`h-px w-12 ${theme.glowColor} opacity-50`} />
                            <h4 className={`text-xs font-bold uppercase tracking-[0.4em] ${theme.accentText}`}>Ny Karrierevei</h4>
                            <div className={`h-px w-12 ${theme.glowColor} opacity-50`} />
                        </div>

                        <h2 className={`text-6xl font-black uppercase tracking-tighter italic drop-shadow-2xl ${theme.titleColor}`}>
                            {isMerchant ? 'Kjøpmann' : 'Soldat'}
                        </h2>
                    </div>

                    {/* MAIN CONTENT AREA */}
                    {isMerchant ? (
                        <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">

                            <p className="text-xl text-slate-300 font-light leading-relaxed max-w-lg mx-auto italic">
                                "Som kjøpmann beveger du ikke bare varer, du beveger verden. Gull er blodet som strømmer gjennom rikets årer."
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Feature Card 1: Karavaneflåten */}
                                <div className={`relative overflow-hidden p-5 rounded-3xl border ${theme.cardBorder} ${theme.cardBg} transition-all duration-300 group/card text-left flex flex-col h-full`}>
                                    <div className="relative z-10 space-y-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover/card:scale-110 transition-transform">
                                            <Anchor size={20} />
                                        </div>
                                        <div>
                                            <h5 className="font-black text-white text-sm uppercase tracking-wider">Flåtestyring</h5>
                                            <div className="h-0.5 w-6 bg-amber-500/50 my-2" />
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Bygg og oppgrader din egen karavaneflåte. Velg mellom raske kjerrer eller tunge vogner med enorm lastekapasitet.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Feature Card 2: Global Handel */}
                                <div className={`relative overflow-hidden p-5 rounded-3xl border ${theme.cardBorder} ${theme.cardBg} transition-all duration-300 group/card text-left flex flex-col h-full`}>
                                    <div className="relative z-10 space-y-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover/card:scale-110 transition-transform">
                                            <MapIcon size={20} />
                                        </div>
                                        <div>
                                            <h5 className="font-black text-white text-sm uppercase tracking-wider">Global Handel</h5>
                                            <div className="h-0.5 w-6 bg-amber-500/50 my-2" />
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Kryss landegrenser og utnytt dype prisforskjeller mellom regionene. Kjøp billig i øst, selg dyrt i vest.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Feature Card 3: Økonomisk Dominans */}
                                <div className={`relative overflow-hidden p-5 rounded-3xl border ${theme.cardBorder} ${theme.cardBg} transition-all duration-300 group/card text-left flex flex-col h-full`}>
                                    <div className="relative z-10 space-y-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover/card:scale-110 transition-transform">
                                            <TrendingUp size={20} />
                                        </div>
                                        <div>
                                            <h5 className="font-black text-white text-sm uppercase tracking-wider">Markedsmakt</h5>
                                            <div className="h-0.5 w-6 bg-amber-500/50 my-2" />
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Invester i landsbyens økonomi, lås opp passiv inntekt gjennom luksusvarer og dominer de lokale markedene.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl">
                                <p className="text-xs text-amber-200/70 font-medium">
                                    <Sparkles size={12} className="inline mr-2 mb-0.5" />
                                    Som Kjøpmann låser du opp en helt ny dimensjon av spillet fokusert på logistikk, risiko og massiv profitt.
                                </p>
                            </div>
                        </div>
                    ) : (
                        // Soldier Placeholder (Keep Simple)
                        <div className="bg-red-950/20 border border-red-500/20 p-8 rounded-[2rem] max-w-md mx-auto">
                            <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
                            <p className="text-red-200 font-medium">
                                Denne rollen er under utvikling. Forvent ubalanse og manglende funksjoner.
                            </p>
                        </div>
                    )}

                    {/* FOOTER ACTIONS */}
                    <div className="flex flex-col items-center gap-6 w-full pt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">

                        {/* Disclaimer */}
                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ${theme.accentText}`}>
                            <AlertTriangle size={12} />
                            <span>Dette valget er permanent</span>
                        </div>

                        {/* Button Group */}
                        <div className="flex items-center gap-4 w-full justify-center">
                            <button
                                onClick={onClose}
                                className={`px-8 py-4 rounded-2xl font-bold tracking-widest uppercase text-xs transition-all ${theme.buttonSecondary}`}
                            >
                                Avbryt
                            </button>

                            <button
                                onClick={onConfirm}
                                className={`group relative px-10 py-5 rounded-2xl font-black tracking-widest uppercase text-sm border-2 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-4 ${theme.buttonPrimary}`}
                            >
                                {/* Button Internal Glow */}
                                <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />

                                <span className="relative z-10">{isMerchant ? 'Signer Kontrakt' : 'Jeg forstår'}</span>

                                {cost && isMerchant && (
                                    <div className="relative z-10 flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-black/10">
                                        <span className="text-xs font-mono font-bold text-amber-900">{cost}</span>
                                    </div>
                                )}

                                {isMerchant && <Sparkles size={16} className="relative z-10 animate-pulse text-amber-900" />}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
