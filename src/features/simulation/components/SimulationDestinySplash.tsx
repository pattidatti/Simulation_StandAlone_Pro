import React, { useState, useEffect } from 'react';
import type { SimulationPlayer, Role } from '../simulationTypes';
import { User, Shield, Crown, Sword, Hammer, ArrowRight, Coins } from 'lucide-react';
import { ROLE_DEFINITIONS } from '../constants';
import { update, ref } from 'firebase/database';
import { simulationDb as db } from '../simulationFirebase';

interface SimulationDestinySplashProps {
    player: SimulationPlayer;
    pin: string;
    onComplete: () => void;
}

const ROLE_ICONS: Record<Role, any> = {
    KING: Crown,
    BARON: Shield,
    PEASANT: Hammer,
    SOLDIER: Sword,
    MERCHANT: Coins
};

const ROLE_GOALS: Record<Role, string[]> = {
    KING: [
        "Sikre rikets stabilitet",
        "Samle inn skatter fra baronene",
        "Beskytte 'The Orb of Power'"
    ],
    BARON: [
        "Administrer din region",
        "Krev inn skatter fra bøndene",
        "Bygg opp forsvaret mot invasjoner"
    ],
    PEASANT: [
        "Dyrk jorden og høst korn",
        "Betal skatt for å unngå fengsel",
        "Overlev vinteren"
    ],
    SOLDIER: [
        "Beskytt riket mot farer",
        "Tren deg opp i kamp",
        "Adlyde ordrer fra Kongen"
    ],
    MERCHANT: [
        "Kjøp og selg varer på markedet",
        "Tjen deg rik på handel",
        "Unngå å bli plyndret"
    ]
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
    KING: "Du er den øverste lederen. Din makt er absolutt, men ditt ansvar er tungt. Riket hviler på dine skuldre.",
    BARON: "Du styrer et av rikets store landområder. Du er bindeleddet mellom Kongen og folket.",
    PEASANT: "Du er ryggraden i samfunnet. Uten ditt harde arbeid ville riket sultet. Livet er hardt, men ærlig.",
    SOLDIER: "Du er sverdets mester. Din plikt er å beskytte de svake og opprettholde lov og orden.",
    MERCHANT: "Du forstår verdien av gull. Mens andre slåss eller dyrker, bygger du formuer gjennom smart handel."
};

export const SimulationDestinySplash: React.FC<SimulationDestinySplashProps> = ({ player, pin, onComplete }) => {
    const [step, setStep] = useState(0); // 0: Reveal, 1: Info
    const [isDismissing, setIsDismissing] = useState(false);

    const RoleIcon = ROLE_ICONS[player.role] || User;
    const goals = ROLE_GOALS[player.role] || ["Overlev", "Utforsk", "Lær"];

    // Auto-advance step 0 after delay
    useEffect(() => {
        if (step === 0) {
            const timer = setTimeout(() => setStep(1), 3000); // 3s reveal
            return () => clearTimeout(timer);
        }
    }, [step]);

    const handleAccept = async () => {
        setIsDismissing(true);
        // Save to DB
        try {
            const updates: any = {};
            updates[`simulation_rooms/${pin}/players/${player.id}/hasSeenIntro`] = true;
            await update(ref(db), updates);
            setTimeout(onComplete, 500); // Allow exit animation
        } catch (e) {
            console.error("Failed to save intro state", e);
            onComplete();
        }
    };

    if (step === 0) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white animate-in fade-in duration-1000">
                <div className="text-center space-y-8 animate-in zoom-in duration-1000 slide-in-from-bottom-10 fill-mode-forwards">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full animate-pulse" />
                        <RoleIcon size={120} className="relative z-10 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-sm animate-in fade-in delay-500 duration-1000">Skjebnen har valgt...</p>
                        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase animate-in slide-in-from-bottom-5 delay-700 duration-500">
                            {(ROLE_DEFINITIONS as any)[player.role]?.label || player.role}
                        </h1>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-3xl transition-opacity duration-500 ${isDismissing ? 'opacity-0' : 'opacity-100'}`}>
            <div className="max-w-4xl w-full mx-4 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">

                {/* Left: Role Visual */}
                <div className="text-center space-y-8 order-2 md:order-1 animate-in slide-in-from-left-10 duration-700">
                    <div className="relative inline-block p-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[3rem] border border-white/10 shadow-2xl">
                        <RoleIcon size={180} className="text-white drop-shadow-2xl" />
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/20 px-6 py-2 rounded-full whitespace-nowrap">
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-300">Din tildelte rolle</span>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4">{(ROLE_DEFINITIONS as any)[player.role]?.label}</h2>
                        <p className="text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                            {ROLE_DESCRIPTIONS[player.role]}
                        </p>
                    </div>
                </div>

                {/* Right: Goals & Action */}
                <div className="space-y-8 order-1 md:order-2 animate-in slide-in-from-right-10 duration-700 delay-200">
                    <div className="space-y-2">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-400">Dine Mål</h3>
                        <h1 className="text-5xl font-black italic tracking-tighter text-white">Oppdrag</h1>
                    </div>

                    <div className="space-y-4">
                        {goals.map((goal, i) => (
                            <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                    <span className="font-black text-sm">{i + 1}</span>
                                </div>
                                <span className="font-bold text-slate-200">{goal}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8">
                        <button
                            onClick={handleAccept}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-[2rem] font-black uppercase text-lg tracking-widest shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group"
                        >
                            Start Din Reise <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
