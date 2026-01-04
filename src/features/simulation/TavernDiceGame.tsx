import React, { useState } from 'react';

interface TavernDiceGameProps {
    playerGold: number;
    onClose: () => void;
    onPlay: (result: { amount: number; isWin: boolean; playerRoll: number; houseRoll: number }) => void;
}

export const TavernDiceGame: React.FC<TavernDiceGameProps> = ({ playerGold, onClose, onPlay }) => {
    const [bet, setBet] = useState<number>(1);
    const [isRolling, setIsRolling] = useState(false);
    const [playerDice, setPlayerDice] = useState<[number, number]>([1, 1]);
    const [houseDice, setHouseDice] = useState<[number, number]>([1, 1]);

    const [gameMessage, setGameMessage] = useState<string>('Plasser din innsats...');
    const [currentGold, setCurrentGold] = useState<number>(playerGold);

    React.useEffect(() => {
        setCurrentGold(playerGold);
    }, [playerGold]);

    const rollDie = () => Math.floor(Math.random() * 6) + 1;

    const handleRoll = () => {
        if (isRolling) return;
        if (bet > playerGold) {
            setGameMessage("Du har ikke nok gull!");
            return;
        }
        if (bet < 0.5) {
            setGameMessage("Minstesats er 0.5g");
            return;
        }

        setIsRolling(true);
        setGameMessage('Terningene ruller...');

        // Animation Phase
        let rolls = 0;
        const maxRolls = 10;
        const interval = setInterval(() => {
            setPlayerDice([rollDie(), rollDie()]);
            setHouseDice([rollDie(), rollDie()]);
            rolls++;
            if (rolls >= maxRolls) {
                clearInterval(interval);
                finalizeRoll();
            }
        }, 100);
    };

    const finalizeRoll = () => {
        const p1 = rollDie();
        const p2 = rollDie();
        const h1 = rollDie();
        const h2 = rollDie();

        const pTotal = p1 + p2;
        const hTotal = h1 + h2;

        setPlayerDice([p1, p2]);
        setHouseDice([h1, h2]);

        const isWin = pTotal > hTotal; // House wins ties

        if (isWin) {
            setGameMessage(`DU VANT! ${pTotal} mot ${hTotal}`);
            setCurrentGold(prev => prev + bet);
        } else {
            setGameMessage(`HUSET VANT. ${hTotal} mot ${pTotal}`);
            setCurrentGold(prev => Math.max(0, prev - bet));
        }

        onPlay({
            amount: bet,
            isWin,
            playerRoll: pTotal,
            houseRoll: hTotal
        });

        setIsRolling(false);
    };

    // Render helper for dice faces
    const renderDie = (val: number, type: 'player' | 'house') => {
        return (
            <div className={`w-16 h-16 rounded-xl shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] flex bg-gradient-to-br ${type === 'player' ? 'from-white to-slate-200 text-black' : 'from-red-600 to-red-800 text-white'} relative transition-transform duration-100 ${isRolling ? 'animate-bounce' : ''}`}>
                <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-2 gap-1">
                    {[...Array(9)].map((_, i) => {
                        let show = false;
                        if (val === 1 && i === 4) show = true;
                        if (val === 2 && (i === 0 || i === 8)) show = true;
                        if (val === 3 && (i === 0 || i === 4 || i === 8)) show = true;
                        if (val === 4 && (i === 0 || i === 2 || i === 6 || i === 8)) show = true;
                        if (val === 5 && (i === 0 || i === 2 || i === 4 || i === 6 || i === 8)) show = true;
                        if (val === 6 && (i === 0 || i === 2 || i === 3 || i === 5 || i === 6 || i === 8)) show = true;

                        return (
                            <div key={i} className="flex items-center justify-center">
                                {show && <div className={`w-3 h-3 rounded-full ${type === 'player' ? 'bg-black' : 'bg-white'} shadow-sm`} />}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-500">
            {/* Background Image Container */}
            <div className="absolute inset-0 z-0 opacity-50">
                <img src="/poi/tavern_dice_bg.png" alt="Tavern Table" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
            </div>

            <div className="relative z-10 bg-[#1a472a]/90 border-[4px] border-[#5d4037] rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] w-full max-w-2xl overflow-hidden backdrop-blur-md">
                {/* Wood Texture Frame Effect */}
                <div className="absolute inset-0 border-2 border-[#8d6e63] rounded-[1.2rem] pointer-events-none opacity-50"></div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#d7ccc8] hover:text-white transition-colors bg-black/20 hover:bg-black/40 rounded-full w-8 h-8 flex items-center justify-center font-bold z-50"
                >
                    ✕
                </button>

                {/* Felt Texture & Layout */}
                <div className="p-8 flex flex-col items-center gap-8 relative">
                    {/* Header */}
                    <div className="text-center space-y-1">
                        <h2 className="text-3xl font-black text-[#ffecb3] uppercase tracking-widest drop-shadow-md" style={{ fontFamily: 'serif' }}>Spillebordet</h2>
                        <div className="text-[#a5d6a7] font-bold tracking-wider text-sm">Huset vinner ved uavgjort</div>
                        <div className="text-xs text-white/50 uppercase tracking-widest font-black">Lykke til!</div>
                    </div>

                    {/* Game Area */}
                    <div className="flex justify-between w-full px-8 gap-8">
                        {/* Player Side */}
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-[#90caf9] font-black uppercase tracking-widest text-xs">Deg ({playerDice[0] + playerDice[1]})</span>
                            <div className="flex gap-3">
                                {renderDie(playerDice[0], 'player')}
                                {renderDie(playerDice[1], 'player')}
                            </div>
                        </div>

                        {/* VS */}
                        <div className="flex items-center justify-center">
                            <span className="text-2xl font-black text-white/20">VS</span>
                        </div>

                        {/* House Side */}
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-[#ef9a9a] font-black uppercase tracking-widest text-xs">Huset ({houseDice[0] + houseDice[1]})</span>
                            <div className="flex gap-3">
                                {renderDie(houseDice[0], 'house')}
                                {renderDie(houseDice[1], 'house')}
                            </div>
                        </div>
                    </div>

                    {/* Message Area */}
                    <div className={`h-12 flex items-center justify-center w-full bg-black/30 rounded-xl border border-white/5 transition-all ${gameMessage.includes('VANT') ? 'bg-green-900/40 border-green-500/30' : gameMessage.includes('tapte') ? 'bg-red-900/40 border-red-500/30' : ''}`}>
                        <span className="font-bold text-lg text-[#fff8e1] tracking-wide">{gameMessage}</span>
                    </div>

                    {/* Controls */}
                    <div className="w-full bg-black/20 p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                        <div className="flex justify-between items-center text-[#d7ccc8] font-bold text-sm uppercase tracking-widest">
                            <span>Innsats</span>
                            <span>Din Saldo: <span className="text-[#ffd54f]">{currentGold.toFixed(1)}g</span></span>
                        </div>

                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={0.5}
                                max={Math.min(playerGold, 100)}
                                step={0.5}
                                value={bet}
                                onChange={(e) => setBet(parseFloat(e.target.value))}
                                className="w-full h-3 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#ffb74d]"
                                disabled={isRolling}
                            />
                            <div className="bg-black/40 px-4 py-2 rounded-xl text-[#ffd54f] font-black min-w-[5rem] text-center border border-white/10">
                                {bet}g
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {[1, 5, 10, 50].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setBet(val)}
                                    disabled={val > playerGold || isRolling}
                                    className={`py-1 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${bet === val ? 'bg-[#ffb74d] text-black' : 'bg-white/5 text-[#d7ccc8] hover:bg-white/10'}`}
                                >
                                    {val}g
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleRoll}
                            disabled={isRolling || playerGold < bet}
                            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-lg shadow-lg transform transition-all active:scale-[0.98] ${isRolling ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-[#ffca28] to-[#ff6f00] text-black hover:brightness-110 shadow-orange-900/40'}`}
                        >
                            {isRolling ? 'Ruller...' : 'KAST TERNINGENE!'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
