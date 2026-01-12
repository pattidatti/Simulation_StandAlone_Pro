import React, { useEffect, useState } from 'react';
import { AlertTriangle, Vote, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RegionCrisisToastProps {
    player: any;
    room: any;
    onOpenHub: () => void;
}

export const RegionCrisisToast: React.FC<RegionCrisisToastProps> = ({ player, room, onOpenHub }) => {
    const [crisis, setCrisis] = useState<{ type: 'VACANT' | 'ELECTION', region: any } | null>(null);
    const [isDismissed, setIsDismissed] = useState(false);

    // Monitor for Crisis
    useEffect(() => {
        if (!room?.regions || !player) return;

        const myRegionId = player.regionId;
        const myRegion = room.regions[myRegionId];
        let newCrisis: { type: 'VACANT' | 'ELECTION', region: any } | null = null;

        // 1. Priority: Election in My Region
        if (myRegion?.activeElection) {
            newCrisis = { type: 'ELECTION', region: myRegion };
        }
        // 2. Secondary: Vacancy in My Region (If I am not the ruler)
        else if (myRegion && !myRegion.rulerId && myRegionId !== 'capital') {
            newCrisis = { type: 'VACANT', region: myRegion };
        }
        // 3. King Priority: Any Election in Realm
        else if (player.role === 'KING') {
            const troubleRegion = Object.values(room.regions).find((r: any) => r.activeElection) as any;
            if (troubleRegion) {
                newCrisis = { type: 'ELECTION', region: troubleRegion };
            }
        }

        // If crisis changed (or disappeared), un-dismiss. 
        if (newCrisis?.region?.id !== crisis?.region?.id || newCrisis?.type !== crisis?.type) {
            setIsDismissed(false);
        }

        setCrisis(newCrisis);

    }, [room?.regions, player?.regionId, player?.role]);

    if (!crisis || isDismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 200, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 200, opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[3000]"
            >
                <div className="relative flex items-center gap-8 p-8 pr-16 bg-slate-900/95 backdrop-blur-2xl border border-amber-500/50 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.4)] min-w-[600px] overflow-hidden group">

                    {/* Background Pulse Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent animate-pulse pointer-events-none" />

                    {/* Icon Section */}
                    <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-amber-500/40 blur-2xl rounded-full" />
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center text-amber-500 border border-amber-500/50 shadow-inner relative z-10">
                            {crisis.type === 'ELECTION' ? <Vote size={40} /> : <AlertTriangle size={40} />}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1">
                        <h4 className="text-3xl font-black uppercase text-white tracking-widest leading-none mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {crisis.type === 'ELECTION' ? 'Valg Pågår!' : 'Makt-Vakuum'}
                        </h4>
                        <p className="text-lg text-amber-100/90 font-medium leading-tight text-shadow-sm">
                            {crisis.type === 'ELECTION'
                                ? `Skjebnevalg i ${crisis.region.name}! Din stemme teller.`
                                : `${crisis.region.name} står uten herre. Kaos herjer!`}
                        </p>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={onOpenHub}
                        className="shrink-0 flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black text-sm font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 group/btn"
                    >
                        <span>Grip Makten</span>
                        <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>

                    {/* Close Button */}
                    <button
                        onClick={() => setIsDismissed(true)}
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Lukk"
                    >
                        <X size={24} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
