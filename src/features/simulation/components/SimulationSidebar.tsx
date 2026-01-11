import React from 'react';
import type { SimulationPlayer, SimulationRoom } from '../simulationTypes';
import { ROLE_TITLES, LEVEL_XP, SEASONS } from '../constants';
import { useSimulation } from '../SimulationContext';
import { useAudio } from '../SimulationAudioContext';
import { Badge } from '../ui/Badge';
import { GameCard } from '../ui/GameCard';
import { motion } from 'framer-motion';
import { Map, User, Scroll, MessageSquare, LayoutGrid, Sun, Package, ChevronLeft, ChevronRight } from 'lucide-react';

interface SimulationSidebarProps {
    player: SimulationPlayer;
    room: SimulationRoom;
}

// Simple CountUp hook
const useCountUp = (target: number, duration: number = 800) => {
    const [count, setCount] = React.useState(target);
    const prevTarget = React.useRef(target);

    React.useEffect(() => {
        if (prevTarget.current === target) return;

        const start = prevTarget.current;
        const end = target;
        let startTime: number | null = null;

        const animate = (time: number) => {
            if (!startTime) startTime = time;
            const progress = Math.min((time - startTime) / duration, 1);
            setCount(start + (end - start) * progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                prevTarget.current = target;
            }
        };

        requestAnimationFrame(animate);
    }, [target, duration]);

    return count;
};

export const SimulationSidebar: React.FC<SimulationSidebarProps> = ({ player, room }) => {
    const { activeTab, setActiveTab, activeMinigame } = useSimulation();
    const { playSfx } = useAudio();
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const RoleIcon = {
        KING: '👑',
        BARON: '🏰',
        PEASANT: '🌾',
        SOLDIER: '⚔️',
        MERCHANT: '💰'
    }[player.role] || '❓';

    // Keyboard Shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // Block hotkeys if minigame is active
            if (activeMinigame) return;

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
            } else if (key === 'b') {
                setIsCollapsed(prev => !prev);
                playSfx('ui_toggle.ogg');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveTab, player.role, playSfx, activeMinigame]);

    const staminaWidth = player.status.stamina || 0;
    const healthWidth = player.status.hp || 0;
    const currentXp = player.stats.xp || 0;
    const currentLvl = player.stats.level || 1;
    const targetXp = LEVEL_XP[currentLvl] || 1000;
    const xpPercent = Math.min(100, (currentXp / targetXp) * 100);

    // Biometric Sound Cue (Heartbeat when low stamina)
    React.useEffect(() => {
        if (staminaWidth < 20) {
            const interval = setInterval(() => {
                playSfx('heartbeat'); // Blipp-blopp sound is already in the library as 'combat_hit' or similar, but let's assume 'heartbeat' exists or fallback is handled
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [staminaWidth, playSfx]);

    const roleTitle = (ROLE_TITLES as any)[player.role][Math.min(currentLvl, (ROLE_TITLES as any)[player.role].length) - 1];
    const getRegionName = (rId: string) => {
        if (!rId || rId === 'unassigned') return 'Ingen Region';
        if (rId === 'capital') return 'Kongeriket (Hovedstaden)';
        if (rId === 'test_region') return 'Test Baroniet';

        if (room?.players && rId.startsWith('region_')) {
            const baronOwner = Object.values(room.players).find(p => p.role === 'BARON' && p.regionId === rId);
            if (baronOwner) return `${baronOwner.name}s Baroni`;

            const baronId = rId.replace('region_', '');
            const baronById = room.players[baronId];
            if (baronById) return `${baronById.name}s Baroni`;
        }

        // Fallback to region name in DB, or hardcoded friendly names
        if (room?.regions?.[rId]?.name) return room.regions[rId].name;
        if (rId === 'region_vest') return 'Baroniet Vest';
        if (rId === 'region_ost') return 'Baroniet Øst';

        return rId;
    };

    const displayedStamina = useCountUp(staminaWidth);
    const displayedHealth = useCountUp(healthWidth);
    const displayedXpPct = useCountUp(xpPercent);

    const renderTabButton = (tab: { id: string, label: string, icon: any, hotkey?: string }) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        // Hide Diplomacy if peasant
        if (tab.id === 'DIPLOMACY' && player.role === 'PEASANT') return null;

        return (
            <button
                key={tab.id}
                onClick={() => {
                    setActiveTab(tab.id as any);
                    playSfx('ui_click.ogg');
                }}
                title={isCollapsed ? tab.label : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm uppercase tracking-wide group
                ${isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 translate-x-1'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:translate-x-1'
                    }
                ${isCollapsed ? 'justify-center !px-2' : ''}
            `}
            >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                {!isCollapsed && (
                    <>
                        <span className="flex-1 text-left">{tab.label}</span>
                        {tab.hotkey && (
                            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${isActive ? 'bg-indigo-500 border-indigo-400 text-indigo-100' : 'bg-white/5 border-white/5 text-slate-600 group-hover:text-slate-400'}`}>
                                {tab.hotkey}
                            </span>
                        )}
                    </>
                )}
            </button>
        );
    };

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-80'} transition-all duration-300 border-r border-white/10 bg-slate-900/50 backdrop-blur-xl flex flex-col z-20 shadow-2xl relative`}>

            {/* Toggle Button */}
            <button
                onClick={() => {
                    setIsCollapsed(!isCollapsed);
                    playSfx('ui_toggle.ogg');
                }}
                className="absolute -right-3 top-8 w-6 h-6 bg-slate-800 border border-white/20 rounded-full flex items-center justify-center text-white/50 hover:text-white z-50 shadow-lg hover:scale-110 transition-all"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className={`p-6 border-b border-white/5 space-y-6 ${isCollapsed ? 'px-2' : ''}`}>
                {/* Profile Header */}
                <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center flex-col' : ''}`}>
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl shadow-lg ring-1 ring-white/10 shrink-0 overflow-hidden animate-breathing">
                        {player.avatar ? (
                            <img src={player.avatar} alt={player.role} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        ) : RoleIcon}
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <h1 className="text-2xl font-display font-bold text-white leading-tight truncate">{player.name}</h1>
                            <div className="flex flex-col gap-1 mt-1">
                                <Badge variant="role" className="text-sm px-3 py-1 w-fit">{roleTitle}</Badge>
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-tighter truncate max-w-[160px]">📍 {getRegionName(player.regionId)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Vitals - Simplified when collapsed */}
                <motion.div
                    animate={staminaWidth < 20 ? {
                        boxShadow: [
                            "0 0 0px rgba(239, 68, 68, 0)",
                            "0 0 20px rgba(239, 68, 68, 0.4)",
                            "0 0 0px rgba(239, 68, 68, 0)"
                        ],
                        backgroundColor: [
                            "rgba(0,0,0,0.2)",
                            "rgba(239, 68, 68, 0.1)",
                            "rgba(0,0,0,0.2)"
                        ]
                    } : {
                        boxShadow: "0 0 0px rgba(239, 68, 68, 0)",
                        backgroundColor: "rgba(0,0,0,0.2)"
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: staminaWidth < 20 ? Infinity : 0,
                        ease: "easeInOut"
                    }}
                    className="rounded-2xl overflow-hidden"
                >
                    <GameCard className={`!p-4 !bg-transparent border-none space-y-4 ${isCollapsed ? '!p-2' : ''}`}>
                        {/* Stamina */}
                        <div>
                            {!isCollapsed && (
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1.5 text-slate-400">
                                    <span>⚡ Livskraft</span>
                                    <motion.span
                                        key={displayedStamina}
                                        className="text-white"
                                    >
                                        {Math.round(displayedStamina)}%
                                    </motion.span>
                                </div>
                            )}
                            <div className={`bg-slate-800 rounded-full overflow-hidden ${isCollapsed ? 'h-1.5 w-full' : 'h-2.5'}`} title={`Stamina: ${Math.round(staminaWidth)}%`}>
                                <div
                                    className={`h-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] ${staminaWidth > 50 ? 'bg-amber-400' : staminaWidth > 20 ? 'bg-amber-600' : 'bg-red-500 animate-pulse'}`}
                                    style={{ width: `${staminaWidth}%` }}
                                />
                            </div>
                        </div>

                        {/* Health */}
                        <div>
                            {!isCollapsed && (
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1.5 text-slate-400">
                                    <span>❤️ Sjelens Styrke</span>
                                    <motion.span
                                        key={displayedHealth}
                                        className="text-white"
                                    >
                                        {Math.round(displayedHealth)}%
                                    </motion.span>
                                </div>
                            )}
                            <div className={`bg-slate-800 rounded-full overflow-hidden ${isCollapsed ? 'h-1.5 w-full' : 'h-2.5'}`} title={`Helse: ${healthWidth}%`}>
                                <div
                                    className="h-full bg-gradient-to-r from-rose-500 to-rose-700 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(225,29,72,0.5)]"
                                    style={{ width: `${healthWidth}%` }}
                                />
                            </div>
                        </div>

                        {/* XP */}
                        <div>
                            {!isCollapsed && (
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-1.5 text-slate-400">
                                    <span>Nivå {currentLvl}</span>
                                    <span className="text-indigo-400">{Math.floor(displayedXpPct)}%</span>
                                </div>
                            )}
                            <div className={`bg-slate-800 rounded-full overflow-hidden ${isCollapsed ? 'h-1.5 w-full' : 'h-2'}`} title={`Nivå ${currentLvl} (${Math.floor(xpPercent)}%)`}>
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-1000"
                                    style={{ width: `${xpPercent}%` }}
                                />
                            </div>
                        </div>
                    </GameCard>
                </motion.div>
            </div >

            {/* Navigation */}
            <nav className={`flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar ${isCollapsed ? 'px-2' : ''}`}>

                {/* Group 1: World */}
                <div className="space-y-1">
                    {!isCollapsed && <div className="px-4 text-xs font-black uppercase text-slate-600 tracking-widest mb-2">Verden</div>}
                    {[
                        { id: 'MAP', label: 'Verdenskart', icon: Map, hotkey: 'M' },
                        { id: 'ACTIVITY', label: 'Live Hendelser', icon: MessageSquare, hotkey: 'L' },
                    ].map(tab => renderTabButton(tab))}
                </div>

                {/* Group 2: Personal */}
                <div className="space-y-1">
                    {!isCollapsed && <div className="px-4 text-xs font-black uppercase text-slate-600 tracking-widest mb-2">Deg selv</div>}
                    {[
                        { id: 'PROFILE', label: 'Profil', icon: User, hotkey: 'P' },
                        { id: 'INVENTORY', label: 'Eiendeler', icon: Package, hotkey: 'I' },
                        { id: 'SKILLS', label: 'Ferdigheter', icon: Scroll, hotkey: 'F' },
                    ].map(tab => renderTabButton(tab))}
                </div>

                {/* Group 3: Society & Politics */}
                <div className="space-y-1">
                    {!isCollapsed && <div className="px-4 text-xs font-black uppercase text-slate-600 tracking-widest mb-2">Samfunn</div>}
                    {[
                        { id: 'DIPLOMACY', label: 'Diplomati', icon: MessageSquare, hotkey: 'D' },
                        { id: 'HIERARCHY', label: 'Samfunnsstruktur', icon: LayoutGrid, hotkey: 'H' },
                    ].map(tab => renderTabButton(tab))}
                </div >
            </nav>

            {/* Footer */}
            <div className={`p-6 bg-black/20 border-t border-white/5 ${isCollapsed ? 'flex flex-col items-center justify-center p-4 gap-2' : ''}`}>
                <div className={`flex items-center justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-tighter ${isCollapsed ? 'flex-col gap-1 !mb-0' : ''}`}>
                    <span>År {room.world.year}</span>
                    <span className="text-amber-500">{(SEASONS as any)[room.world.season]?.label}</span>
                </div>
                {!isCollapsed && (
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span>{room.world.weather}</span>
                    </div>
                )}
            </div>
        </aside>
    );
};
