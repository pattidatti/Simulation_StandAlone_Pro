import React, { useState } from 'react';
import { ROLE_DEFINITIONS, RESOURCE_DETAILS, ITEM_TEMPLATES } from '../../constants';

interface PlayerGridProps {
    players: any;
    onKick: (id: string, name: string) => void;
    onLevelChange: (id: string, lvl: number) => void;
    onRoleChange: (id: string, role: any) => void;
    onRegionChange: (id: string, region: string) => void;
    onControl: (id: string) => void;
    onGiveGold: (id: string, amt: number) => void;
    onGiveResource: (id: string, resId: string, amt: number) => void;
    onGiveItem: (id: string, itemId: string, amt: number) => void;
}

export const PlayerGrid: React.FC<PlayerGridProps> = React.memo(({
    players,
    onKick,
    onLevelChange,
    onRoleChange,
    onRegionChange,
    onControl,
    onGiveGold,
    onGiveResource,
    onGiveItem
}) => {
    const [giveGoldAmounts, setGiveGoldAmounts] = useState<Record<string, number>>({});
    const [giveItemSelection, setGiveItemSelection] = useState<Record<string, { itemId: string, amount: number }>>({});
    const [giveResourceSelection, setGiveResourceSelection] = useState<Record<string, { resourceId: string, amount: number }>>({});

    return (
        <section>
            <h2 className="text-3xl font-black text-white px-2 mb-8 tracking-tighter">Innbyggere i Riket</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(players || {}).map((p: any) => (
                    <div key={p.id} className="relative bg-slate-900/80 border border-white/5 p-6 rounded-[2rem] hover:border-indigo-500/30 transition-all group">
                        <button
                            onClick={(e) => { e.stopPropagation(); onKick(p.id, p.name); }}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white flex items-center justify-center font-bold text-xs"
                            title="Kast ut spiller"
                        >
                            ✕
                        </button>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
                                {p.avatar ? <img src={p.avatar} alt={p.role} className="w-full h-full object-cover" /> : ({
                                    KING: '👑',
                                    BARON: '🏰',
                                    PEASANT: '🌾',
                                    SOLDIER: '⚔️',
                                    MERCHANT: '💰'
                                } as any)[p.role] || '👤'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-black text-white truncate leading-tight">{p.name}</h3>
                                    <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                                        <span className="text-[8px] font-black text-slate-500 uppercase">LVL</span>
                                        <input
                                            type="number"
                                            value={p.stats?.level || 1}
                                            onChange={(e) => onLevelChange(p.id, parseInt(e.target.value))}
                                            className="w-8 bg-transparent border-none p-0 text-[10px] font-black text-indigo-400 focus:ring-0 text-center font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 mt-1">
                                    <select
                                        value={p.role}
                                        onChange={(e) => onRoleChange(p.id, e.target.value)}
                                        className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border-none p-0 focus:ring-0 cursor-pointer hover:text-white transition-colors w-full text-left"
                                    >
                                        {Object.entries(ROLE_DEFINITIONS).map(([id, def]) => (
                                            <option key={id} value={id} className="bg-slate-900">{def.label}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={p.regionId || 'region_ost'}
                                        onChange={(e) => onRegionChange(p.id, e.target.value)}
                                        className="bg-white/5 text-slate-500 text-[9px] font-bold uppercase tracking-wider border-none p-0 focus:ring-0 cursor-pointer hover:text-slate-300 transition-colors w-full text-left"
                                    >
                                        <option value="capital" className="bg-slate-900">Hovedstaden</option>
                                        <option value="region_ost" className="bg-slate-900">Baroniet Øst</option>
                                        <option value="region_vest" className="bg-slate-900">Baroniet Vest</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* BOT THOUGHTS (QA TELEMETRY) */}
                        {p.id.startsWith('bot_') && p.status?.thought && (
                            <div className="mb-4 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Mental Tilstand</span>
                                    <div className="flex-1 h-[1px] bg-indigo-500/20"></div>
                                </div>
                                <p className="text-[10px] text-white/90 font-bold leading-relaxed mb-2">
                                    "{p.status.thought}"
                                </p>
                                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-tighter text-indigo-400/60">
                                    <span>Handling: {p.status.lastAction}</span>
                                    <span>Tid: {p.status.lastTick ? new Date(p.status.lastTick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Nå'}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 mb-6">
                            <div>
                                <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 mb-1">
                                    <span>Stamina</span>
                                    <span className="text-white">{p.status.stamina}%</span>
                                </div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${p.status.stamina}%` }} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-slate-500">Gull:</span>
                                <span className="text-amber-500 font-black">{p.resources.gold}💰</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-6">
                            {p.upgrades?.map((upg: string) => (
                                <span key={upg} className="text-[7px] font-black bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase tracking-tighter">{upg}</span>
                            ))}
                            {(!p.upgrades || p.upgrades.length === 0) && <span className="text-[7px] font-bold text-slate-700 uppercase italic">Ingen oppgraderinger</span>}
                        </div>

                        <button
                            onClick={() => onControl(p.id)}
                            className="w-full py-4 rounded-2xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all border border-indigo-500/20 flex items-center justify-center gap-2 group/btn"
                        >
                            <span className="group-hover/btn:scale-125 transition-transform">🎮</span>
                            Styr spiller
                        </button>

                        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Gull..."
                                    value={giveGoldAmounts[p.id] || ''}
                                    onChange={(e) => setGiveGoldAmounts({ ...giveGoldAmounts, [p.id]: parseInt(e.target.value) || 0 })}
                                    className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-black text-white focus:border-indigo-500/50 transition-all font-mono"
                                />
                                <button
                                    onClick={() => {
                                        const amt = giveGoldAmounts[p.id] || 0;
                                        if (amt > 0) {
                                            onGiveGold(p.id, amt);
                                            setGiveGoldAmounts({ ...giveGoldAmounts, [p.id]: 0 });
                                        }
                                    }}
                                    className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all"
                                >
                                    GI GULL
                                </button>
                            </div>

                            {/* ADMIN: GIVE RESOURCE */}
                            <div className="flex gap-2">
                                <select
                                    value={giveResourceSelection[p.id]?.resourceId || ''}
                                    onChange={(e) => setGiveResourceSelection({ ...giveResourceSelection, [p.id]: { resourceId: e.target.value, amount: giveResourceSelection[p.id]?.amount || 10 } })}
                                    className="flex-[2] bg-black/40 border border-white/5 rounded-xl px-2 py-2 text-[10px] font-bold text-amber-300 focus:border-amber-500/50 transition-all cursor-pointer"
                                >
                                    <option value="">Velg...</option>
                                    {Object.entries(RESOURCE_DETAILS).map(([key, detail]) => (
                                        <option key={key} value={key}>{detail.icon} {detail.label}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    placeholder="#"
                                    value={giveResourceSelection[p.id]?.amount || 10}
                                    onChange={(e) => setGiveResourceSelection({ ...giveResourceSelection, [p.id]: { resourceId: giveResourceSelection[p.id]?.resourceId || '', amount: parseInt(e.target.value) || 1 } })}
                                    className="w-12 bg-black/40 border border-white/5 rounded-xl px-2 py-2 text-[10px] font-black text-white focus:border-amber-500/50 transition-all font-mono text-center"
                                />
                                <button
                                    onClick={() => {
                                        const selection = giveResourceSelection[p.id];
                                        if (selection && selection.resourceId && selection.amount > 0) {
                                            onGiveResource(p.id, selection.resourceId, selection.amount);
                                            setGiveResourceSelection({ ...giveResourceSelection, [p.id]: { resourceId: '', amount: 10 } });
                                        }
                                    }}
                                    className="bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30 px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all"
                                >
                                    GI
                                </button>
                            </div>

                            {/* ADMIN: GIVE ITEM */}
                            <div className="flex gap-2">
                                <select
                                    value={giveItemSelection[p.id]?.itemId || ''}
                                    onChange={(e) => setGiveItemSelection({ ...giveItemSelection, [p.id]: { itemId: e.target.value, amount: giveItemSelection[p.id]?.amount || 1 } })}
                                    className="flex-[2] bg-black/40 border border-white/5 rounded-xl px-2 py-2 text-[10px] font-bold text-slate-300 focus:border-indigo-500/50 transition-all cursor-pointer"
                                >
                                    <option value="">Velg...</option>
                                    {Object.values(ITEM_TEMPLATES).map(item => (
                                        <option key={item.id} value={item.id}>{item.icon} {item.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    placeholder="#"
                                    value={giveItemSelection[p.id]?.amount || 1}
                                    onChange={(e) => setGiveItemSelection({ ...giveItemSelection, [p.id]: { itemId: giveItemSelection[p.id]?.itemId || '', amount: parseInt(e.target.value) || 1 } })}
                                    className="w-12 bg-black/40 border border-white/5 rounded-xl px-2 py-2 text-[10px] font-black text-white focus:border-indigo-500/50 transition-all font-mono text-center"
                                />
                                <button
                                    onClick={() => {
                                        const selection = giveItemSelection[p.id];
                                        if (selection && selection.itemId && selection.amount > 0) {
                                            onGiveItem(p.id, selection.itemId, selection.amount);
                                            setGiveItemSelection({ ...giveItemSelection, [p.id]: { itemId: '', amount: 1 } });
                                        }
                                    }}
                                    className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all"
                                >
                                    GI
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {Object.keys(players || {}).length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                        <span className="text-6xl block mb-4 opacity-20">🏰</span>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Venter på at undersåtter skal ankomme...</p>
                    </div>
                )}
            </div>
        </section>
    );
});
