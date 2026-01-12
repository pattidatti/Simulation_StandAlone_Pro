import React, { useState, useMemo, useEffect } from 'react';
import { SimulationMapWindow } from './SimulationMapWindow';
import { GameButton } from '../../ui/GameButton';
import { GameCard } from '../../ui/GameCard';
import { ResourceIcon } from '../../ui/ResourceIcon';
import { Badge } from '../../ui/Badge';
import { GAME_BALANCE } from '../../data/gameBalance';
import { useSimulation } from '../../SimulationContext';
import { Gavel, ShieldAlert, Timer, TrendingUp, AlertTriangle, Vote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { handleGlobalBribe, handleCastVote, handleRestoreOrder, handleFinalizeElection, handleShadowPledge } from '../../globalActions';
import { useParams } from 'react-router-dom';
import type { ElectionCandidate } from '../../simulationTypes';

interface PoliticalHubProps {
    player: any;
    room: any;
    onClose: () => void;
}

interface PoliticalHubContentProps {
    player: any;
    room: any; // Or specific regions object
    pin: string;
}

export const PoliticalHubContent: React.FC<PoliticalHubContentProps> = ({ player, room, pin }) => {
    const { actionLoading } = useSimulation();
    const regionId = player.regionId || 'capital';
    const region = room.regions?.[regionId];
    const coup = region?.coup;
    const election = region?.activeElection;

    const bribeProgress = coup?.bribeProgress || 0;
    const isElectionActive = !!election && Date.now() < election.expiresAt;
    const isElectionExpired = !!election && Date.now() >= election.expiresAt;

    const [activeTab, setActiveTab] = useState<'BRIBE' | 'ELECTION'>(isElectionActive ? 'ELECTION' : 'BRIBE');

    // Auto-switch tab if election starts/ends
    useEffect(() => {
        if (isElectionActive) setActiveTab('ELECTION');
    }, [isElectionActive]);

    const sortedContributors = useMemo(() => {
        if (!coup?.contributions) return [];
        return Object.entries(coup.contributions)
            .map(([id, data]: [string, any]) => ({ id, ...data }))
            .sort((a, b) => b.amount - a.amount);
    }, [coup?.contributions]);

    const sortedCandidates = useMemo(() => {
        if (!election?.candidates) return [] as ElectionCandidate[];
        return (Object.values(election.candidates) as ElectionCandidate[])
            .sort((a, b) => (b.weightedVotes || 0) - (a.weightedVotes || 0));
    }, [election?.candidates]);

    const handleBribe = (amt: number) => {
        if (!pin) return;
        handleGlobalBribe(pin, player.id, { regionId, amount: amt });
    };

    const handleVote = (candidateId: string) => {
        if (!pin) return;
        handleCastVote(pin, player.id, { regionId, candidateId });
    };

    const handleFinalize = () => {
        if (!pin) return;
        handleFinalizeElection(pin, regionId);
    };

    const handleRestore = () => {
        if (!pin) return;
        handleRestoreOrder(pin, player.id, regionId);
    };

    return (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">

            {/* STATUS HEADER */}
            <div className="relative p-6 rounded-3xl bg-slate-900/50 border border-white/10 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    {isElectionActive ? <Vote size={120} /> : <TrendingUp size={120} />}
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1">
                                {region?.name || 'Region'}
                            </Badge>
                            {isElectionActive && (
                                <Badge variant="role" className="bg-rose-500 animate-pulse text-white px-3 py-1 font-black">
                                    SAMMENBRUDD
                                </Badge>
                            )}
                        </div>
                        <h2 className={`text-3xl font-black italic tracking-tighter uppercase ${!region?.rulerId ? 'text-amber-500' : 'text-white'}`}>
                            {isElectionActive
                                ? 'Mandate of Chaos'
                                : (!region?.rulerId ? 'Makt-Vakuum' : 'Folkets Vilje')}
                        </h2>
                        <p className="text-slate-400 text-sm max-w-md mt-1">
                            {isElectionActive
                                ? "Styresettet har kollapset. Stem på en ny leder før vinduet lukkes!"
                                : (!region?.rulerId
                                    ? "Regionen mangler en leder. Grip sjansen, bestikk folket og start et nyvalg!"
                                    : "Bestikk befolkningen for å svekke herskerens legitimitet og utløse en revolusjon.")}
                        </p>
                    </div>

                    <div className="flex flex-col items-end justify-center">
                        <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Ditt Gull</div>
                        <ResourceIcon resource="gold" amount={player.resources?.gold} size="md" />
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
                <button
                    onClick={() => setActiveTab('BRIBE')}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'BRIBE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Bestikkelser
                </button>
                <button
                    onClick={() => setActiveTab('ELECTION')}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ELECTION' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    disabled={!isElectionActive && !isElectionExpired}
                >
                    Valg {isElectionActive && "🔴"}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'BRIBE' && (
                    <motion.div
                        key="bribe"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* REVOLT PROGRESS */}
                        <GameCard className="bg-slate-900/40 border-indigo-500/20">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="flex items-center gap-2 text-sm font-black text-white italic uppercase">
                                    <AlertTriangle className={`w-4 h-4 ${!region?.rulerId ? 'text-amber-500' : 'text-amber-500'}`} />
                                    {!region?.rulerId ? 'Kaos-Nivå' : 'Opprørsfremgang'}
                                </h4>
                                <span className={`text-2xl font-black ${!region?.rulerId ? 'text-amber-500' : 'text-indigo-400'}`}>{bribeProgress.toFixed(0)}%</span>
                            </div>
                            <div className="h-4 bg-black/60 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${bribeProgress}%` }}
                                    className="h-full bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-3 italic text-center uppercase tracking-wider">
                                {!region?.rulerId && bribeProgress >= 99
                                    ? <span className="text-amber-500 font-bold animate-pulse">TOTALT KAOS! ETT BIDRAG TIL PÅTVINGER ET NYVALG.</span>
                                    : "Ved 100% utløses en revolusjon og setet blir vakant."}
                            </p>
                        </GameCard>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* ACTION AREA */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Bestikk Folket</h4>

                                {(!region?.rulerId && (!room.world?.settlement?.buildings?.[regionId === 'capital' ? 'throne_room' : (regionId === 'region_ost' ? 'manor_ost' : 'manor_vest')]?.level)) ? (
                                    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-700/50 flex flex-col items-center justify-center text-center gap-2">
                                        <ShieldAlert className="w-8 h-8 text-slate-600" />
                                        <h4 className="text-sm font-black text-slate-400 uppercase">Ingen Administrasjon</h4>
                                        <p className="text-xs text-slate-500 max-w-[200px]">
                                            Slottet i denne regionen er ikke reist ennå. Du kan ikke bestikke folket før en administrasjon er på plass.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {[200, 500, 1000, 2500].map(amt => (
                                            <button
                                                key={amt}
                                                onClick={() => handleBribe(amt)}
                                                disabled={player.resources?.gold < amt || !!actionLoading || isElectionActive}
                                                className="group relative p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/50 transition-all text-left overflow-hidden"
                                            >
                                                <div className="absolute -right-2 -bottom-2 opacity-5 scale-150 grayscale group-hover:grayscale-0 group-hover:opacity-10 transition-all">
                                                    <ResourceIcon resource="gold" size="lg" />
                                                </div>
                                                <div className="text-xs font-black text-slate-400 uppercase mb-1">
                                                    {!region?.rulerId ? 'Grip Makten' : 'Gi'}
                                                </div>
                                                <div className="text-xl font-black text-white italic">{amt}g</div>
                                                <div className="text-[9px] font-bold text-indigo-400 mt-2">+{(amt / GAME_BALANCE.COUP.BASE_BRIBE_COST * 10).toFixed(0)}% Revolt</div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {player.role === 'BARON' && region?.rulerId === player.id && (
                                    <div className="mt-8 p-6 rounded-3xl bg-rose-950/20 border border-rose-500/30">
                                        <h4 className="text-sm font-black text-rose-400 uppercase mb-2 flex items-center gap-2">
                                            <ShieldAlert className="w-5 h-5" />
                                            Gjenopprett Ro
                                        </h4>
                                        <p className="text-xs text-rose-200/60 mb-4">
                                            Betal vaktene dine for å slå ned på opprøret. Dette koster {GAME_BALANCE.COUP.RESTORE_ORDER_COST}g og reduserer opprøret med 25%.
                                        </p>
                                        <GameButton
                                            variant="danger"
                                            onClick={handleRestore}
                                            disabled={player.resources?.gold < GAME_BALANCE.COUP.RESTORE_ORDER_COST || bribeProgress === 0}
                                            className="w-full bg-rose-600 hover:bg-rose-500 border-rose-400 font-black italic shadow-lg shadow-rose-950/40"
                                        >
                                            BETAL VAKTENE (-25%)
                                        </GameButton>
                                    </div>
                                )}
                            </div>

                            {/* LEADERBOARD */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Største Bidragsytere</h4>
                                <div className="bg-black/20 rounded-3xl border border-white/5 divide-y divide-white/5">
                                    {sortedContributors.length === 0 ? (
                                        <div className="p-8 text-center text-slate-600 text-xs italic">Ingen har kjøpt folket enda...</div>
                                    ) : (
                                        sortedContributors.map((c, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-game-gold text-black shadow-[0_0_10px_rgba(255,215,0,0.4)]' : 'bg-slate-800 text-slate-400'}`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white tracking-tight">{c.name}</div>
                                                        <div className="text-[10px] text-slate-500 font-medium">Utfordrer</div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <div className="text-xs font-mono font-bold text-game-gold">{c.amount.toLocaleString()}g</div>
                                                    {coup?.preVotes?.[player.id] === c.id ? (
                                                        <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                            Ditt valg
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => pin && handleShadowPledge(pin, player.id, regionId, c.id)}
                                                            className="text-[9px] font-bold uppercase text-slate-500 hover:text-white bg-white/5 hover:bg-indigo-600 px-2 py-0.5 rounded-full transition-all"
                                                        >
                                                            ✍️ Løfte
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'ELECTION' && (
                    <motion.div
                        key="election"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* ELECTION TIMER */}
                        <div className="flex flex-col md:flex-row gap-6">
                            <GameCard className="flex-1 bg-indigo-950/20 border-indigo-500/40 relative overflow-hidden">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                                        <Timer className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Tid Igjen</h4>
                                        <div className="text-3xl font-black text-white italic tabular-nums">
                                            {isElectionActive
                                                ? Math.max(0, Math.ceil((election!.expiresAt - Date.now()) / 1000)) + "sek"
                                                : "AVSLUTTET"}
                                        </div>
                                    </div>
                                </div>
                                {isElectionExpired && (
                                    <GameButton
                                        variant="primary"
                                        onClick={handleFinalize}
                                        className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 border-emerald-400 font-black italic shadow-lg shadow-emerald-950/40"
                                    >
                                        UTFØR KRONING
                                    </GameButton>
                                )}
                            </GameCard>

                            <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex items-center gap-4">
                                <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30 text-3xl">
                                    👑
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">Kongelig Mandat</h4>
                                    <p className="text-xs text-amber-200/60 max-w-[200px]">
                                        Kongen har **{GAME_BALANCE.COUP.KING_VOTE_WEIGHT} stemmer**. Bønder har 1 stemme hver.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CANDIDATES GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {sortedCandidates.map((cand, idx) => {
                                const votesData = election?.votes as Record<string, any>;
                                const hasVoted = votesData?.[player.id]?.candidateId === cand.id;
                                const totalWeightedVotes = sortedCandidates.reduce((acc, c) => acc + (c.weightedVotes || 0), 0);
                                const votePercentage = totalWeightedVotes > 0
                                    ? ((cand.weightedVotes || 0) / totalWeightedVotes) * 100
                                    : 0;

                                return (
                                    <div
                                        key={cand.id}
                                        className={`relative p-6 rounded-3xl border transition-all ${hasVoted ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-950/50 scale-[1.02]' : 'bg-slate-900/40 border-white/5 hover:border-white/20'}`}
                                    >
                                        {idx === 0 && totalWeightedVotes > 0 && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-game-gold text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                                                Favoritt
                                            </div>
                                        )}

                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl border-2 border-white/10">
                                                👤
                                            </div>
                                            <h3 className="font-black text-white text-lg tracking-tight truncate px-2">{cand.name}</h3>
                                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Kandidat</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black text-slate-500 uppercase">Stemmescore</span>
                                                <span className="text-xl font-black text-white italic">{cand.weightedVotes}</span>
                                            </div>
                                            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${votePercentage}%` }}
                                                    className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                />
                                            </div>
                                            <GameButton
                                                variant={hasVoted ? 'primary' : 'wood'}
                                                onClick={() => handleVote(cand.id)}
                                                disabled={!!actionLoading || !isElectionActive}
                                                className="w-full font-black italic text-xs tracking-tighter"
                                            >
                                                {hasVoted ? 'VALGT' : 'GI DIN STEMME'}
                                            </GameButton>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const PoliticalHub: React.FC<PoliticalHubProps> = ({ player, room, onClose }) => {
    const { pin } = useParams<{ pin: string }>();

    return (
        <SimulationMapWindow
            title="Politisk Innflytelse"
            icon={<Gavel className="w-8 h-8 text-game-gold" />}
            onClose={onClose}
        >
            {pin && <PoliticalHubContent player={player} room={room} pin={pin} />}
        </SimulationMapWindow>
    );
};
