import React from 'react';
import { motion } from 'framer-motion';
import { POINTS_OF_INTEREST } from '../../data/WorldMapData';

interface WorldMapEventsProps {
    viewMode: string;
    viewingRegionId: string;
    worldEvents: any;
    onSelect: (event: any) => void;
}

export const WorldMapEvents: React.FC<WorldMapEventsProps> = ({ viewMode, viewingRegionId, worldEvents, onSelect }) => {
    if (viewMode === 'kingdom' || !worldEvents) return null;

    return (
        <>
            {Object.values(worldEvents).map((event: any) => {
                const poi = POINTS_OF_INTEREST.find(p => p.id === event.locationId);
                if (!poi) return null;
                const isCorrectView = viewMode === 'global' ? !poi.parentId : poi.parentId === viewMode;
                if (!isCorrectView) return null;

                const isBarony = viewMode === 'global';
                const isOst = isBarony && viewingRegionId === 'region_ost';
                const isVest = isBarony && (viewingRegionId === 'region_vest' || viewingRegionId === 'capital');
                const isVillage = viewMode === 'village';

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

                return (
                    <motion.div
                        key={event.id}
                        style={{ top, left }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -translate-x-1/2 -translate-y-[150%] z-30 pointer-events-auto"
                    >
                        <button
                            onClick={() => onSelect(event)}
                            className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(255,255,255,0.4)] border-4 animate-bounce hover:scale-110 transition-transform ${event.type === 'RAID' ? 'bg-rose-600 border-rose-900 text-white' : 'bg-amber-400 border-amber-700 text-slate-800'}`}
                        >
                            {event.type === 'RAID' ? '⚔️' : '🔔'}
                        </button>
                    </motion.div>
                );
            })}
        </>
    );
};
