import React, { useState, useEffect, useRef } from 'react';

export const BakingGame: React.FC<{ onComplete: (score: number) => void, speedMultiplier?: number, icon?: string }> = ({ onComplete, speedMultiplier = 1.0, icon = '🥖' }) => {
    const [progress, setProgress] = useState(0);
    // ... rest of state stay same ...
    const [isFinished, setIsFinished] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [batch, setBatch] = useState(0);

    // Dynamic Sweet Spot
    const [targetCenter, setTargetCenter] = useState(80); // Center of the sweet spot
    const targetDir = useRef(-1);

    useEffect(() => {
        if (isFinished || feedback) return;

        // Progress fill
        const fillInterval = setInterval(() => {
            setProgress(p => {
                const next = p + (1.0 * speedMultiplier); // Slightly slower base fill to compensate for moving target difficulty
                if (next >= 100) {
                    setFeedback('BRENT! 🔥');
                    setTimeout(() => { setFeedback(null); setProgress(0); }, 1000);
                    return 0;
                }
                return next;
            });
        }, 50);

        // Move Sweet Spot (Wandering Heat Zone)
        const moveInterval = setInterval(() => {
            setTargetCenter(prev => {
                const speed = 0.8; // Movement speed of the zone
                let next = prev + (speed * targetDir.current);

                // Keep zone within reasonable bounds so it's obtainable (e.g., 40% to 90%)
                if (next > 90) {
                    targetDir.current = -1;
                    return 90;
                }
                if (next < 40) {
                    targetDir.current = 1;
                    return 40;
                }
                return next;
            });
        }, 50);

        return () => {
            clearInterval(fillInterval);
            clearInterval(moveInterval);
        };
    }, [isFinished, feedback, speedMultiplier]);

    // Spacebar Support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                pullOut();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFinished, feedback, progress, targetCenter]); // Dependencies for pullOut logic

    const pullOut = () => {
        if (isFinished || feedback) return;

        // Calculate dynamic bounds based on targetCenter
        // Sweet spot width is approx 20% ( +/- 10%)
        const zoneStart = targetCenter - 10;
        const zoneEnd = targetCenter + 10;

        if (progress > zoneStart && progress < zoneEnd) {
            setFeedback('PERFEKT GYLLEN! ✨');
            setBatch(b => {
                const next = b + 1;
                if (next >= 3) {
                    setIsFinished(true);
                    setTimeout(() => onComplete(1.0), 1000);
                }
                return next;
            });
        } else if (progress < zoneStart) {
            setFeedback('RÅ... 🥖');
        } else {
            setFeedback('LITT BRENT... 🥯');
        }
        setTimeout(() => { setFeedback(null); setProgress(0); }, 1000);
    };

    return (
        <div className="p-12 text-center min-h-[600px] relative flex flex-col items-center justify-center overflow-hidden"
            style={{ backgroundImage: 'url("/images/minigames/bakery_bg.png")', backgroundSize: 'cover' }}>
            <div className="absolute inset-0 bg-black/70 z-0" />
            <h2 className="relative z-10 text-4xl font-black text-white mb-8 tracking-tighter uppercase italic">Bakeri: Steking 🍞</h2>

            <div className="relative z-10 w-64 h-64 bg-slate-900 border-8 border-amber-900 rounded-3xl flex items-center justify-center overflow-hidden mb-12 shadow-2xl">
                <div className="absolute inset-0 bg-orange-500/10 animate-pulse" />
                <div className="text-8xl transition-all duration-300 transform"
                    style={{
                        filter: `grayscale(${100 - progress}%) sepia(${progress}%)`,
                        transform: `scale(${0.8 + (progress / 500)})`
                    }}>
                    {icon}
                </div>
                {feedback && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-2xl p-4 animate-in zoom-in">
                        {feedback}
                    </div>
                )}
            </div>

            {/* Dynamic Progress Bar */}
            <div className={`relative z-10 w-full max-w-sm h-8 bg-white/10 rounded-full mb-12 border ${progress > targetCenter - 10 && progress < targetCenter + 10 ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-white/10'} overflow-hidden transition-all shadow-2xl`}>
                {/* Moving Sweet Spot Visual */}
                <div
                    className="absolute inset-y-0 bg-emerald-500/30 border-x border-emerald-500/50 transition-all duration-75 ease-linear"
                    style={{
                        left: `${targetCenter - 10}%`,
                        right: `${100 - (targetCenter + 10)}%`
                    }}
                >
                    {progress > targetCenter - 10 && progress < targetCenter + 10 && (
                        <div className="absolute inset-0 bg-emerald-400/20 animate-pulse" />
                    )}
                </div>

                {/* Progress Fill */}
                <div className="h-full bg-orange-500 transition-all duration-75 relative z-10 opacity-80" style={{ width: `${progress}% ` }} />

                {/* Target Marker Icon (optional helpful visual) */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white/50 z-20"
                    style={{ left: `${targetCenter}%` }}
                />
            </div>

            <div className="relative z-10 flex gap-4 mb-8">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 transition-all ${batch > i ? 'bg-amber-500 border-amber-300 scale-110 shadow-lg' : 'bg-white/5 border-white/10 opacity-30'} `}>
                        {icon}
                    </div>
                ))}
            </div>

            <button onClick={pullOut} className="relative z-10 w-full max-w-sm bg-amber-600 hover:bg-amber-500 text-white py-6 rounded-2xl font-black text-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest border-b-8 border-amber-800">
                TA UT NÅ! 🧤
            </button>
        </div>
    );
};
