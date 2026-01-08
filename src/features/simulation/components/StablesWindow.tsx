import React from 'react';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import type { SimulationPlayer } from '../simulationTypes';
import { Lock, ChevronRight, CheckCircle2 } from 'lucide-react';

interface StablesWindowProps {
    player: SimulationPlayer;
    onAction: (action: any) => void;
    onClose: () => void;
}

const TRACKS = [
    {
        id: 'ride_easy',
        label: 'Engelskogen',
        icon: '🌲',
        desc: 'En rolig tur i vakkert terreng.',
        color: 'emerald'
    },
    {
        id: 'ride_medium',
        label: 'Fjellpasset',
        icon: '🏔️',
        desc: 'Høyere fart og flere klipper.',
        color: 'amber'
    },
    {
        id: 'ride_hard',
        label: 'Ulvestien',
        icon: '🐺',
        desc: 'Livsfarlig galopp gjennom tett mørke.',
        color: 'rose'
    }
];

export const StablesWindow: React.FC<StablesWindowProps> = ({ player, onAction, onClose }) => {
    const progress = player.minigameProgress || {};

    const handleStartLevel = (trackId: string, level: number) => {
        onAction({
            type: 'MOUNT_HORSE',
            method: trackId,
            level: level
        });
        onClose();
    };

    return (
        <SimulationMapWindow
            title="Stallplass"
            subtitle="Landemerke"
            icon={<span className="text-2xl">🐴</span>}
            onClose={onClose}
        >
            <div className="p-8 flex flex-col gap-6 select-none">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Ri ut</h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                        <span className="text-xs font-black text-indigo-400">-5 ⚡</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {TRACKS.map((track) => {
                        const currentMax = progress[track.id] || 1;

                        return (
                            <div
                                key={track.id}
                                className="group relative bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 hover:bg-slate-900/80 transition-all duration-300"
                            >
                                <div className="flex items-center gap-6">
                                    {/* Icon */}
                                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
                                        {track.icon}
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1">
                                        <h4 className="text-xl font-black italic uppercase tracking-tighter text-white group-hover:text-indigo-400 transition-colors">
                                            {track.label}
                                        </h4>
                                        <p className="text-sm font-medium text-slate-400 line-clamp-1">
                                            {track.desc}
                                        </p>
                                    </div>

                                    {/* Level Dots */}
                                    <div className="flex items-center gap-2 px-4">
                                        {[1, 2, 3, 4, 5].map((level) => {
                                            const isUnlocked = level <= currentMax;
                                            const isFinished = level < currentMax;

                                            return (
                                                <button
                                                    key={level}
                                                    disabled={!isUnlocked}
                                                    onClick={() => handleStartLevel(track.id, level)}
                                                    className={`
                                                        w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all relative
                                                        ${isFinished ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                            isUnlocked ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-110 active:scale-95' :
                                                                'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}
                                                    `}
                                                >
                                                    {isFinished ? <CheckCircle2 size={14} /> : level}
                                                    {!isUnlocked && (
                                                        <div className="absolute -top-1 -right-1 bg-slate-950 p-0.5 rounded-full">
                                                            <Lock size={8} />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Play Button Shortcut (to highest available) */}
                                    <button
                                        onClick={() => handleStartLevel(track.id, currentMax)}
                                        className="w-12 h-12 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white flex items-center justify-center transition-all group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>

                                {/* Track Progress Bar (Optional Subtle Decor) */}
                                <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500/50"
                                        style={{ width: `${(Math.min(5, currentMax - 1) / 5) * 100}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info Footer */}
                <div className="mt-4 p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 flex items-start gap-4">
                    <div className="text-2xl">💡</div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-300">Tips for ryttere</p>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed">
                            Jo høyere nivå, desto raskere galopperer hesten. Ulvestien på nivå 5 krever lynraske reflekser, men gir enorme mengde XP!
                        </p>
                    </div>
                </div>
            </div>
        </SimulationMapWindow>
    );
};
