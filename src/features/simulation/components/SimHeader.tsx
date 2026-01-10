import React, { useEffect, useState, useRef } from 'react';
import { Settings, Map, MessageSquare, LayoutGrid, Scroll, Package, Menu, X, Truck } from 'lucide-react';
import { useSimulation } from '../SimulationContext';
import { useAudio } from '../SimulationAudioContext';
import type { SimulationPlayer, SimulationRoom } from '../simulationTypes';
import { ResourceIcon } from '../ui/ResourceIcon';
import { LEVEL_XP, SEASONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { getClockTime, getDayPart } from '../utils/timeUtils';

interface SimulationHeaderProps {
    room: SimulationRoom;
    player: SimulationPlayer;
    pin?: string;
    onAction?: (action: any) => void;
}

// Simple CountUp hook (Ported from Sidebar)
const useCountUp = (target: number, duration: number = 800) => {
    const [count, setCount] = useState(target);
    const prevTarget = useRef(target);

    useEffect(() => {
        if (prevTarget.current === target) return;
        const start = prevTarget.current;
        const end = target;
        let startTime: number | null = null;

        const animate = (time: number) => {
            if (!startTime) startTime = time;
            const progress = Math.min((time - startTime) / duration, 1);
            setCount(start + (end - start) * progress);
            if (progress < 1) requestAnimationFrame(animate);
            else prevTarget.current = target;
        };
        requestAnimationFrame(animate);
    }, [target, duration]);

    return count;
};

export const SimHeader: React.FC<SimulationHeaderProps> = ({ room, player, onAction }) => {
    const { activeTab, setActiveTab } = useSimulation();
    const { playSfx } = useAudio();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // --- SMOOTH CLOCK INTERPOLATION ---
    // We anchor the local time when a new tick arrives to allow smooth interpolation
    const [tickAnchor, setTickAnchor] = useState<{ tick: number, time: number }>({
        tick: room.world?.gameTick || 0,
        time: Date.now()
    });

    // Update anchor ONLY when server tick changes
    useEffect(() => {
        if (room.world?.gameTick !== tickAnchor.tick) {
            setTickAnchor({
                tick: room.world?.gameTick || 0,
                time: Date.now()
            });
        }
    }, [room.world?.gameTick, tickAnchor.tick]);

    const region = room.regions?.[player.regionId || 'capital'];
    const hasUnrest = (region?.coup?.bribeProgress || 0) > 0 || !!region?.activeElection;

    // --- KEYBOARD SHORTCUTS (Ported from Sidebar) ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            const key = e.key.toLowerCase();
            const tabMap: Record<string, any> = {
                'm': 'MAP',
                'l': 'ACTIVITY',
                'p': 'PROFILE',
                'i': 'INVENTORY',
                'f': 'SKILLS',
                'd': 'DIPLOMACY',
                'h': 'HIERARCHY'
            };

            if (tabMap[key]) {
                if (key === 'd' && player.role === 'PEASANT') return;
                setActiveTab(tabMap[key]);
                playSfx('ui_click.ogg');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveTab, player.role, playSfx]);

    // --- HIGH-FREQUENCY CLOCK TICKER ---
    // Forces re-render every second to allow smooth clock interpolation
    const [, setClockPulse] = useState(0);
    useEffect(() => {
        const pulseInterval = setInterval(() => setClockPulse(p => p + 1), 1000);
        return () => clearInterval(pulseInterval);
    }, []);

    // --- VITALS CALCULATIONS ---
    const staminaWidth = player.status.stamina || 0;
    const healthWidth = player.status.hp || 0;
    const currentXp = player.stats.xp || 0;
    const currentLvl = player.stats.level || 1;
    const targetXp = LEVEL_XP[currentLvl] || 1000;
    const xpPercent = Math.min(100, (currentXp / targetXp) * 100);

    const displayedStamina = useCountUp(staminaWidth);
    const displayedHealth = useCountUp(healthWidth);

    // --- NAVIGATION ITEMS ---
    const navItems = [
        { id: 'MAP', label: 'Kart', icon: Map, short: 'M' },
        { id: 'ACTIVITY', label: 'Live', icon: MessageSquare, short: 'L' },
        { id: 'INVENTORY', label: 'Eiendeler', icon: Package, short: 'I' },
        { id: 'SKILLS', label: 'Ferdigheter', icon: Scroll, short: 'F' },
        // Diplomacy/Hierarchy combined or separate? Keeping separate for now but hiding based on role
        ...(player.role !== 'PEASANT' ? [{ id: 'DIPLOMACY', label: 'Diplomati', icon: MessageSquare, short: 'D' }] : []),
        { id: 'HIERARCHY', label: 'Samfunn', icon: LayoutGrid, short: 'H' },
    ];

    const year = room.world?.year || 1100;
    const season = (SEASONS as any)[room.world?.season]?.label || room.world?.season;

    return (

        <header className="flex-none h-14 md:h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 z-50 relative shrink-0 transition-all">

            {/* LEFT: WORLD STATE (Clock & Season) */}
            <div className="flex items-center gap-4 md:gap-6">
                <div className="flex flex-col">
                    {/* Primary Time Display */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none tabular-nums shadow-indigo-500/50 drop-shadow-lg">
                            {getClockTime(
                                tickAnchor.tick,
                                tickAnchor.time
                            )}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">
                            ÅR {year}
                        </span>
                    </div>

                    {/* Secondary Season/Weather Info */}
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className={room.world?.season === 'Winter' ? 'text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.5)]' : 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'}>
                                {season}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="" title={getDayPart(room.world?.gameTick || 0) === 'DAY' ? 'Dag' : 'Natt'}>
                                {getDayPart(room.world?.gameTick || 0) === 'DAY' ? '☀️ Dag' : '🌙 Natt'}
                            </span>
                        </div>
                        {hasUnrest && (
                            <button
                                onClick={() => { setActiveTab('POLITICS'); playSfx('ui_click.ogg'); }}
                                className="flex items-center gap-2 bg-rose-600/20 border border-rose-500/50 px-2 py-0.5 rounded-full animate-pulse group hover:bg-rose-500 hover:text-white transition-all ml-2"
                                title="Uro i regionen! Klikk for å se politisk status."
                            >
                                <span className="text-[9px] font-black italic tracking-tighter">⚠️ URO</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* DESKTOP NAV (Adaptive "Bento" Mode) */}
                <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                    {navItems.map(item => {
                        const isActive = activeTab === item.id;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id as any); playSfx('ui_click.ogg'); }}
                                className={`
                                    relative px-3 py-1.5 md:py-2 rounded-lg flex items-center gap-2 transition-all group overflow-hidden
                                    ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                                `}
                                title={item.label}
                            >
                                <Icon size={16} className={isActive ? 'animate-pulse' : ''} />
                                {/* Text label hidden on laptops (md/lg), visible on XL screens */}
                                <span className={`hidden xl:block text-xs font-bold uppercase tracking-wider ${isActive ? '' : ''}`}>{item.label}</span>
                                {item.short && (
                                    <span className={`text-[9px] absolute top-0.5 right-1 font-mono font-bold transition-opacity hidden xl:block ${isActive ? 'text-indigo-300' : 'text-slate-700 group-hover:text-slate-500'}`}>
                                        {item.short}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* RIGHT: PLAYER VITALS & ACTIONS */}
            <div className="flex items-center gap-3 md:gap-5">

                {/* BUFF BAR (Compact) */}
                {player.activeBuffs && player.activeBuffs.length > 0 && (
                    <div className="flex items-center gap-1 mr-1">
                        {player.activeBuffs.map(buff => (
                            <BuffIcon key={buff.id} buff={buff} />
                        ))}
                    </div>
                )}

                {/* RESOURCES (Merged Stream) */}
                <div className="hidden md:flex items-center bg-slate-900/50 rounded-full border border-white/5 overflow-hidden transition-all duration-300">
                    <button
                        onClick={() => { setActiveTab('INVENTORY'); playSfx('ui_click.ogg'); }}
                        className="flex items-center gap-2 hover:bg-white/5 px-3 py-1.5 transition-colors cursor-pointer group active:scale-95"
                        title="Åpne Eiendeler (I)"
                    >
                        <ResourceIcon resource="gold" amount={player.resources.gold} size="sm" />
                        {/* Hidden on laptop */}
                        <span className="hidden xl:inline text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors ml-1">Gull</span>
                    </button>

                    <div className="w-px h-3 bg-white/10" />

                    <button
                        onClick={() => {
                            if (player.resources.bread) {
                                onAction?.({ type: 'CONSUME', itemId: 'bread', isResource: true });
                                playSfx('eat.ogg');
                            } else {
                                setActiveTab('INVENTORY');
                                playSfx('ui_click.ogg');
                            }
                        }}
                        disabled={!player.resources.bread}
                        className={`flex items-center gap-2 px-3 py-1.5 transition-all cursor-pointer group border-l border-white/0 active:scale-95 ${player.resources.bread ? 'hover:bg-emerald-500/10 hover:border-emerald-500/20' : 'opacity-40 cursor-not-allowed'}`}
                        title={player.resources.bread ? "Spis Brød (+20 Stamina)" : "Tomt for brød"}
                    >
                        <ResourceIcon resource="bread" amount={player.resources.bread || 0} size="sm" />
                        <div className="hidden xl:flex flex-col items-start -space-y-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${player.resources.bread ? 'text-slate-500 group-hover:text-emerald-400' : 'text-slate-600'}`}>
                                {player.resources.bread ? 'Spis' : 'Tom'}
                            </span>
                        </div>
                    </button>
                </div>

                {/* VITALS BARS (Compact) */}
                <div className="flex flex-col gap-1 w-20 md:w-24">
                    {/* HP */}
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden relative group">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-rose-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${displayedHealth}%` }}
                        />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-black text-white bg-black/50 transition-opacity">
                            HP {Math.round(displayedHealth)}%
                        </div>
                    </div>
                    {/* STAMINA */}
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden relative group">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${displayedStamina}%` }}
                        />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-black text-black bg-white/50 transition-opacity">
                            STA {Math.round(displayedStamina)}%
                        </div>
                    </div>
                    {/* XP */}
                    <div className="h-0.5 bg-slate-800/50 rounded-full overflow-hidden relative group mt-0.5">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-indigo-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${xpPercent}%` }}
                        />
                    </div>
                </div>

                {/* PROFILE BUTTON (Compact) */}
                <button
                    onClick={() => { setActiveTab('PROFILE'); playSfx('ui_click.ogg'); }}
                    className="group flex items-center gap-3 bg-white/0 hover:bg-white/5 pl-2 pr-1 py-1 rounded-2xl border border-transparent hover:border-white/10 transition-all active:scale-95"
                    title="Min Karakter (P)"
                >
                    {/* Name - Hidden on most screens, visible 2XL+ */}
                    <div className="hidden 2xl:flex flex-col items-end">
                        <span className="text-sm font-black italic tracking-tighter text-white leading-none">
                            {player.name}
                        </span>
                    </div>

                    {/* Avatar Container */}
                    <div className="relative">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg overflow-hidden group-hover:shadow-indigo-500/20">
                            {player.avatar ? (
                                <img src={player.avatar} alt="Profile" className="w-full h-full object-cover rounded-[6px]" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-[6px] text-base">
                                    {player.role === 'KING' ? '👑' : '👤'}
                                </div>
                            )}
                        </div>
                        {/* Level Badge */}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center border border-white/10 text-[8px] font-black text-white z-10">
                            {currentLvl}
                        </div>
                    </div>
                </button>

                {/* SETTINGS */}
                <ButtonIcon icon={Settings} onClick={() => setActiveTab('SETTINGS')} title="Innstillinger" />

                {/* MERCHANT CARAVAN */}
                {player.role === 'MERCHANT' && (
                    <ButtonIcon
                        icon={Truck}
                        onClick={() => onAction?.({ type: 'OPEN_CARAVAN' })}
                        title="Karavane"
                        className="text-amber-400 border border-amber-400/20 bg-amber-100/5 hover:bg-amber-400/20"
                    />
                )}

                {/* MOBILE MENU TOGGLE */}
                <button
                    className="md:hidden text-white p-2"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* MOBILE NAVIGATION DROPDOWN */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-16 left-0 right-0 bg-slate-900 border-b border-white/10 p-4 shadow-2xl md:hidden flex flex-col gap-2 z-40"
                    >
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
                                className={`w-full p-4 rounded-xl text-left font-black uppercase flex items-center gap-4 ${activeTab === item.id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </button>
                        ))}
                        <div className="h-px bg-white/5 my-2" />
                        <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-widest px-2">
                            <span>År {year}</span>
                            <span>{season}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

// Topbar helper button
const ButtonIcon = ({ icon: Icon, onClick, title, className }: any) => (
    <button
        onClick={onClick}
        title={title}
        className={`hidden md:flex p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all ${className}`}
    >
        <Icon size={20} />
    </button>
);

const BuffIcon = ({ buff }: { buff: any }) => {
    const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.ceil((buff.expiresAt - Date.now()) / 60000)));

    useEffect(() => {
        const interval = setInterval(() => {
            const min = Math.max(0, Math.ceil((buff.expiresAt - Date.now()) / 60000));
            setTimeLeft(min);
        }, 10000);
        return () => clearInterval(interval);
    }, [buff.expiresAt]);

    if (Date.now() > buff.expiresAt) return null;

    return (
        <div className="group relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-help">
            <span className="text-lg">⚡</span>
            <span className="absolute -bottom-1 -right-1 text-[8px] font-black bg-slate-900 px-1 rounded-full border border-white/10">
                {timeLeft}m
            </span>

            {/* Tooltip */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 p-2 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-32 text-center z-50">
                <p className="text-[10px] font-bold text-white mb-0.5">{buff.label}</p>
                <p className="text-[9px] text-emerald-400">{buff.value * 100}% mindre stamina</p>
            </div>
        </div>
    );
};
