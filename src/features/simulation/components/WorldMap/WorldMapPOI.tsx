import React from 'react';
import { motion } from 'framer-motion';
import { POINTS_OF_INTEREST } from '../../data/WorldMapData';
import type { POI } from '../../data/WorldMapData';
import type { SimulationPlayer } from '../../simulationTypes';

interface WorldMapPOIProps {
    viewMode: string;
    viewingRegionId: string;
    player: SimulationPlayer;
    onSelect: (poi: POI) => void;
    onEnterHub: (hubId: string) => void;
    onPOIAction: (poiId: string, actionId: any) => void;
    room: any;
}

export const WorldMapPOI: React.FC<WorldMapPOIProps> = ({ viewMode, viewingRegionId, player, onSelect, onEnterHub, onPOIAction, room }) => {
    if (viewMode === 'kingdom') return null;

    return (
        <>
            {POINTS_OF_INTEREST.map(poi => {
                const isCorrectView = viewMode === 'global' ? !poi.parentId : poi.parentId === viewMode;
                if (!isCorrectView) return null;

                const isRelevant = (player.role === 'KING' && poi.id !== 'peasant_farm') || poi.roles.includes(player.role) || poi.id === 'market' || poi.isHub;
                const isResourceNode = ['grain_fields', 'forest_clearing', 'mine_shaft', 'quarry_poi', 'forest_forage'].includes(poi.id);

                const isBarony = viewMode === 'global';
                const isOst = isBarony && viewingRegionId === 'region_ost';
                const isVest = isBarony && (viewingRegionId === 'region_vest' || viewingRegionId === 'capital');
                const isVillage = viewMode === 'village';
                const playersArr = Object.values(room.players || {}) as SimulationPlayer[];

                let top = poi.top;
                let left = poi.left;

                if (isVillage && poi.village) {
                    top = poi.village.top;
                    left = poi.village.left;
                } else if (isOst && poi.ost) {
                    top = poi.ost.top;
                    left = poi.ost.left;
                } else if (isVest && poi.vest) {
                    top = poi.vest.top;
                    left = poi.vest.left;
                }

                // ULTRATHINK: Castle-specific state
                const isCastle = poi.id === 'castle';
                const hasRuler = isCastle && playersArr.some(p =>
                    (p.role === 'BARON' && p.regionId === viewingRegionId) ||
                    (viewingRegionId === 'capital' && p.role === 'KING')
                );
                const buildingId = isCastle ? (viewingRegionId === 'capital' ? 'throne_room' : (viewingRegionId === 'region_ost' ? 'manor_ost' : 'manor_vest')) : '';
                const castleLevel = isCastle ? (room.world?.settlement?.buildings?.[buildingId]?.level || 0) : 0;
                const canEnterCastle = castleLevel >= 1 || hasRuler;

                return (
                    <motion.div
                        key={poi.id}
                        style={{ top, left }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group z-20 pointer-events-auto"
                    >
                        <button
                            onClick={() => {
                                if (isCastle && !canEnterCastle) {
                                    onPOIAction(poi.id, 'OPEN_CONSTRUCTION');
                                    return;
                                }

                                if (poi.isHub) {
                                    onEnterHub(poi.id);
                                } else {
                                    onSelect(poi);
                                }
                            }}
                            className={`flex flex-col items-center transition-all ${isRelevant ? 'scale-100' : 'scale-75 opacity-40 grayscale pointer-events-none'}`}
                        >
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-4xl shadow-2xl border-2 transition-all duration-300 group-hover:scale-110 bg-slate-900/90 backdrop-blur-xl border-white/10 hover:bg-slate-800`}>
                                {poi.icon}
                            </div>
                            <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-2 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-indigo-600/30">
                                {isResourceNode ? 'KLIKK FOR Å STARTE' : (isCastle ? (canEnterCastle ? 'GÅ INN' : 'BIDRA TIL BYGGING') : poi.label)}
                            </span>
                        </button>
                    </motion.div>
                );
            })}
        </>
    );
};
