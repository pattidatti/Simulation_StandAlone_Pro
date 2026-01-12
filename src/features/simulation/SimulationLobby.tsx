import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { simulationDb as db } from './simulationFirebase';
import { ref, get, update, child, set } from 'firebase/database';
import { useLayout } from '../../context/LayoutContext';

import { INITIAL_RESOURCES, INITIAL_SKILLS, INITIAL_EQUIPMENT } from './constants';
import type { SimulationPlayer, Role } from './simulationTypes';
import { useSimulationAuth } from './SimulationAuthContext';
import { SimulationServerBrowser } from './SimulationServerBrowser';
import { Globe, Hash, User as UserIcon, Shield, ChevronRight, Trophy, Star, Edit2, Lock, ArrowRight } from 'lucide-react';
import { SimulationAuthModal } from './SimulationAuthModal';
import { generateInitialRoomState, syncServerMetadata } from './logic/roomInit';

export const SimulationLobby: React.FC = () => {
    const [pin, setPin] = useState('');
    const [name, setName] = useState('');
    const [selectedRole, setSelectedRole] = useState<Role>('PEASANT');
    const [error, setError] = useState('');
    const [joining, setJoining] = useState(false);
    const [lobbyTab, setLobbyTab] = useState<'PIN' | 'BROWSER'>('BROWSER');

    const navigate = useNavigate();
    const { setFullWidth, setHideHeader } = useLayout();
    const { user, account, loading: authLoading, isAnonymous } = useSimulationAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER'>('REGISTER');

    const location = useLocation();
    const routerState = location.state as { prefilledName?: string, prefilledRole?: Role, isDeploying?: boolean } | null;

    useEffect(() => {
        setFullWidth(true);
        setHideHeader(true);

        // Handle Nexus Deployment
        if (routerState?.isDeploying) {
            setLobbyTab('PIN'); // Switch to Join UI
            if (routerState.prefilledName) setName(routerState.prefilledName);
            if (routerState.prefilledRole) setSelectedRole(routerState.prefilledRole);
        }

        return () => {
            setFullWidth(false);
            setHideHeader(false);
        };
    }, [setFullWidth, setHideHeader, routerState]);

    useEffect(() => {
        const savedPin = localStorage.getItem('sim_room_pin');
        if (savedPin) setPin(savedPin);
        // Only set name from account if NOT prefilled from Nexus
        if (account?.displayName && !routerState?.prefilledName) setName(account.displayName);
    }, [account, routerState]);

    const joinGame = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setJoining(true);

        const cleanPin = pin.trim().toUpperCase();

        if (!cleanPin || !name) {
            setError('PIN og Navn er påkrevd');
            setJoining(false);
            return;
        }

        try {
            const roomRef = ref(db, `simulation_rooms/${cleanPin}`);
            const snapshot = await get(roomRef);

            if (!snapshot.exists() && cleanPin !== 'TEST') {
                setError('Rommet finnes ikke');
                setJoining(false);
                return;
            }

            const playerId = user?.uid || `guest_${Date.now()}`;

            // Check if player already exists in room to avoid overwriting state on rejoin
            const playerSnapshot = await get(child(roomRef, `players/${playerId}`));

            if (!playerSnapshot.exists()) {
                const role: Role = cleanPin === 'TEST' ? selectedRole : 'PEASANT';

                // Initial room setup for TEST rooms if they don't exist
                if (cleanPin === 'TEST' && !snapshot.exists()) {
                    const initialRoom = generateInitialRoomState('TEST', 'Test-Riket');
                    await set(roomRef, initialRoom);
                    await syncServerMetadata('TEST', initialRoom);
                }

                // Simple Logic for region assignment
                let regionId = Math.random() > 0.5 ? 'region_ost' : 'region_vest';

                if (role === 'BARON') {
                    const roomData = snapshot.val() || {};
                    const players = Object.values(roomData.players || {}) as SimulationPlayer[];
                    const hasVest = players.some(p => p.role === 'BARON' && p.regionId === 'region_vest');
                    const hasOst = players.some(p => p.role === 'BARON' && p.regionId === 'region_ost');

                    if (!hasVest) regionId = 'region_vest';
                    else if (!hasOst) regionId = 'region_ost';
                    else regionId = `region_${playerId}`; // Fallback to custom region if both main spots taken
                } else if (role === 'KING') {
                    regionId = 'capital';
                }

                const newPlayer: SimulationPlayer = {
                    id: playerId,
                    uid: user?.uid,
                    name: name,
                    role: role,
                    regionId: regionId,
                    homeRegionId: regionId, // Set Home Region on creation
                    resources: INITIAL_RESOURCES[role] || INITIAL_RESOURCES.PEASANT,
                    skills: INITIAL_SKILLS[role] || INITIAL_SKILLS.PEASANT,
                    stats: { xp: 0, level: 1, reputation: 50, contribution: 0 },
                    status: { hp: 100, morale: 100, stamina: 50, legitimacy: 100, authority: 50, loyalty: 100, isJailed: false, isFrozen: false },
                    equipment: INITIAL_EQUIPMENT[role] || INITIAL_EQUIPMENT.PEASANT,
                    upgrades: [],
                    lastActive: Date.now()
                };

                // DUAL WRITE: Create Public Profile (Lightweight)
                const publicProfile = {
                    id: playerId,
                    uid: user?.uid,
                    name: name,
                    role: role,
                    regionId: regionId,
                    stats: {
                        level: 1
                    },
                    status: {
                        isJailed: false,
                        isFrozen: false,
                        legitimacy: 100
                    },
                    online: true,
                    lastActive: Date.now()
                };

                const updates: any = {};
                updates[`players/${playerId}`] = newPlayer;
                updates[`public_profiles/${playerId}`] = publicProfile;

                // SYNC TO GLOBAL ACCOUNT (Active Sessions)
                // ULTRATHINK REFINE: Use atomic updates to root path, and use Map structure to avoid race conditions.
                if (user?.uid) {
                    try {
                        const sessionData = {
                            roomPin: cleanPin,
                            name: name,
                            role: role,
                            regionId: regionId,
                            xp: 0,
                            lastPlayed: Date.now()
                        };

                        // Use root-level atomic update to ensure we hit the correct location
                        updates[`simulation_accounts/${user.uid}/activeSessions/${cleanPin}`] = sessionData;

                    } catch (err) {
                        console.error("Failed to prepare session sync:", err);
                    }
                }

                await update(roomRef, updates);
            }

            localStorage.setItem('sim_player_id', playerId);
            localStorage.setItem('sim_room_pin', cleanPin);

            navigate(`/play/${cleanPin}`);

        } catch (err) {
            console.error(err);
            setError('Tilkobling feilet');
        } finally {
            setJoining(false);
        }
    };

    if (authLoading) {
        return (
            <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden p-6 md:p-12">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Left Side: Branding & Profile */}
                <div className="lg:col-span-5 space-y-8">
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter text-indigo-400 italic mb-2">FEUDAL SIM</h1>
                        <p className="text-slate-500 font-mono text-sm uppercase tracking-[0.3em]">v1.2 Meta-Era</p>
                    </div>

                    {/* Global Profile Card / Onboarding */}
                    {isAnonymous ? (
                        <div className="bg-indigo-600/10 backdrop-blur-3xl border-2 border-indigo-500/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Lock size={120} className="text-indigo-400" />
                            </div>

                            <div className="relative z-10 space-y-6 text-center md:text-left">
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Opprett profil eller logg inn</h2>
                                    <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Sikre din fremgang og karakterhistorikk</p>
                                </div>

                                <p className="text-slate-400 text-sm max-w-sm font-medium">
                                    Akkurat nå lagres fremgangen din kun lokalt. Ved å sikre profilen din kan du fortsette reisen på alle enheter.
                                </p>

                                <div className="flex flex-col md:flex-row gap-4 pt-2">
                                    <button
                                        onClick={() => { setAuthModalMode('REGISTER'); setIsAuthModalOpen(true); }}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/30"
                                    >
                                        Opprett Profil <ArrowRight size={16} />
                                    </button>
                                    <button
                                        onClick={() => { setAuthModalMode('LOGIN'); setIsAuthModalOpen(true); }}
                                        className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/10 transition-all"
                                    >
                                        Logg Inn
                                    </button>
                                </div>

                                {/* Guest Profile Access */}
                                {account && (
                                    <div className="mt-6 flex justify-center md:justify-start">
                                        <button
                                            onClick={() => navigate('/profile')}
                                            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 hover:text-indigo-300 transition-colors"
                                        >
                                            <UserIcon size={12} />
                                            Vis Gjesteprofil
                                            <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Shield size={120} className="text-indigo-500" />
                            </div>

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
                                        <UserIcon size={32} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Global Profil</p>
                                        <h2 className="text-2xl font-black text-white">{account?.displayName || 'Eventyrer'}</h2>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2 text-indigo-400 mb-1">
                                            <Trophy size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Global Level</span>
                                        </div>
                                        <p className="text-2xl font-black">Nivå {account?.globalLevel || 1}</p>
                                    </div>
                                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2 text-yellow-500 mb-1">
                                            <Star size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Global XP</span>
                                        </div>
                                        <p className="text-2xl font-black">{account?.globalXp || 0}</p>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                    <span>Achievements: {account?.unlockedAchievements?.length || 0}</span>
                                    <span>Lives Lived: {account?.characterHistory?.length || 0}</span>
                                </div>

                                <button
                                    onClick={() => navigate('/profile')}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit2 size={12} /> Administrer Profil
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="hidden lg:block space-y-4 pt-4">
                        <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-xs">
                            Velkommen til den nye æraen av Feudal Sim. Dine bragder lagres nå på tvers av alle verdener.
                        </p>
                        <button
                            onClick={() => navigate('/host/setup')}
                            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-sm transition-colors group"
                        >
                            Host ditt eget rike <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Right Side: Tabbed Interface */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex p-1.5 bg-slate-900/60 rounded-2xl border border-white/5 w-fit">
                        <button
                            onClick={() => setLobbyTab('BROWSER')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${lobbyTab === 'BROWSER' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Globe size={18} /> Server Browser
                        </button>
                        <button
                            onClick={() => setLobbyTab('PIN')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${lobbyTab === 'PIN' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Hash size={18} /> Join via PIN
                        </button>
                    </div>

                    <div className="transition-all duration-300">
                        {lobbyTab === 'BROWSER' ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h2 className="text-3xl font-black italic text-white mb-6 tracking-tight">Oppdag Verdener 🌍</h2>
                                <SimulationServerBrowser />
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-slate-900/40 p-10 rounded-[2.5rem] border border-white/5">
                                <h2 className="text-3xl font-black italic text-white mb-8 tracking-tight">Privat Tilkobling 🔑</h2>
                                <form onSubmit={joinGame} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Rom-PIN</label>
                                        <input
                                            type="text"
                                            placeholder="XXXX"
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                            className="w-full bg-slate-950/80 text-center text-5xl font-mono p-6 rounded-3xl border-2 border-slate-800 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-900 text-indigo-400 shadow-inner"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Karakternavn</label>
                                        <input
                                            type="text"
                                            placeholder="Navn..."
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-slate-950/80 text-center text-xl font-bold p-6 rounded-3xl border-2 border-slate-800 focus:border-indigo-500 outline-none transition-all text-white shadow-inner"
                                        />
                                    </div>

                                    {pin.toUpperCase() === 'TEST' && (
                                        <div className="bg-slate-900/30 p-4 rounded-2xl border border-indigo-500/20">
                                            <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3 text-center">Velg Test Rolle</label>
                                            <div className="flex gap-2">
                                                {(['PEASANT', 'BARON', 'KING'] as Role[]).map(r => (
                                                    <button
                                                        key={r}
                                                        type="button"
                                                        onClick={() => setSelectedRole(r)}
                                                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${selectedRole === r ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500 hover:text-slate-400'}`}
                                                    >
                                                        {r === 'KING' ? '👑' : r === 'BARON' ? '🏰' : '🌾'} {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-xs font-bold text-center border border-red-500/20 animate-bounce">
                                            ⚠️ {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={joining}
                                        className="w-full bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 py-6 rounded-3xl font-black text-xl transition-all shadow-2xl shadow-indigo-900/40 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {joining ? 'Kobler til...' : 'DRA TIL VERDENEN ⚔️'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Authentication Modal */}
            <SimulationAuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authModalMode}
            />
        </div>
    );
};
