import React from 'react';

interface LevelUpOverlayProps {
    level: number;
    title: string;
    onClose: () => void;
}

export const LevelUpOverlay: React.FC<LevelUpOverlayProps> = ({ level, title, onClose }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-1 rounded-[2.5rem] shadow-[0_0_50px_rgba(245,158,11,0.5)] animate-in zoom-in duration-500">
                <div className="bg-white rounded-[2.2rem] p-10 text-center relative overflow-hidden max-w-sm">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200" />

                    <div className="relative z-10">
                        <div className="text-7xl mb-6 animate-bounce">🎉</div>
                        <h2 className="text-sm font-black text-amber-600 uppercase tracking-[0.3em] mb-2">Nivå Oppnådd!</h2>
                        <h3 className="text-6xl font-black text-slate-800 mb-4">Nivå {level}</h3>

                        <div className="h-0.5 w-16 bg-slate-200 mx-auto mb-6" />

                        <p className="text-slate-500 font-medium mb-1">Ny Tittel:</p>
                        <p className="text-3xl font-black text-indigo-600 mb-8">{title}</p>

                        <button
                            onClick={onClose}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
                        >
                            FORTSETT REISEN
                        </button>
                    </div>

                    <div className="absolute inset-0 pointer-events-none opacity-20">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-2 h-2 bg-amber-500 rounded-full animate-ping"
                                style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${2 + Math.random() * 2}s`
                                } as React.CSSProperties}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes ping-slow {
                        0% { transform: scale(1); opacity: 0.8; }
                        100% { transform: scale(3); opacity: 0; }
                    }
                `}} />
        </div>
    );
};
