import type { SimulationPlayer, SimulationRoom } from '../simulationTypes';
import { checkActionRequirements, getActionCostString } from '../utils/actionUtils';
import { SEASONS, WEATHER } from '../constants';

interface ActionTooltipProps {
    poi: any; // Using any for now to match WorldMap POI structure, or import POI interface
    player: SimulationPlayer;
    room: SimulationRoom;
    viewingRegionId: string;
    onClose: () => void;
    onAction: (poiId: string, actionId: string) => void;
}

export const ActionTooltip: React.FC<ActionTooltipProps> = ({
    poi,
    player,
    room,
    viewingRegionId,
    onClose,
    onAction
}) => {
    // Calculate Position (logic lifted from WorldMap)
    const top = viewingRegionId === 'region_ost' && poi.ost ? poi.ost.top : poi.top;
    const left = viewingRegionId === 'region_ost' && poi.ost ? poi.ost.left : poi.left;
    const isNearTop = parseFloat(poi.top) < 25;

    return (
        <div
            style={{ top, left }}
            className={`absolute z-[100] -translate-x-1/2 ${isNearTop ? 'translate-y-[3rem]' : '-translate-y-[calc(100%+3.5rem)]'} animate-in fade-in zoom-in duration-200 pointer-events-auto`}
        >
            <div className="bg-slate-900/98 backdrop-blur-3xl border border-white/20 rounded-[1.8rem] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.6)] min-w-[280px] w-max max-w-[340px] relative">

                {/* Header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <span className="text-3xl drop-shadow-md">{poi.icon}</span>
                        <h3 className="font-black text-white text-[11px] uppercase tracking-[0.25em] leading-tight opacity-90">{poi.label}</h3>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
                </div>

                {/* Actions */}
                <div className="space-y-2.5">
                    {poi.actions
                        .filter((a: any) => {
                            if (a.id === 'TAX_PEASANTS' && player.role !== 'BARON') return false;
                            if (a.id === 'TAX_ROYAL' && player.role !== 'KING') return false;
                            if (a.id === 'DECREE' && player.role !== 'KING') return false;
                            if (a.id === 'RAID' && player.role !== 'BARON') return false;
                            if (a.id === 'REST' && poi.id === 'village_square' && (player.role === 'KING' || player.role === 'BARON')) return false;
                            if (a.id === 'FEAST' && player.role !== 'KING' && player.role !== 'BARON') return false;
                            return true;
                        })
                        .map((action: any) => {
                            // CHECK: Is this a building specific action?
                            const buildingId = poi.id;
                            const isBuildingAction = ['bakery', 'windmill', 'sawmill', 'smeltery', 'blacksmith', 'weaving_mill', 'watchtower', 'stables', 'well', 'apothecary'].includes(buildingId);
                            const isBuilt = (room.world.settlement?.buildings?.[buildingId]?.level || 0) >= 1;

                            // If it's a building action but the building isn't built, show ONLY construction option
                            if (isBuildingAction && !isBuilt && action.id !== 'CONSTRUCT_BUILDING') return null;
                            if (isBuildingAction && isBuilt && action.id === 'CONSTRUCT_BUILDING') return null;

                            // Use Centralized Validation
                            const currentSeason = (room.world?.season || 'Spring') as keyof typeof SEASONS;
                            const currentWeather = (room.world?.weather || 'Clear') as keyof typeof WEATHER;

                            let canAfford = true;
                            let missingReason = '';

                            if (viewingRegionId !== player.regionId && player.role !== 'KING' && action.id !== 'MARKET_VIEW') {
                                canAfford = false;
                                missingReason = "Ikke ditt baroni";
                            } else {
                                const check = checkActionRequirements(player, action.id, currentSeason, currentWeather);
                                if (!check.success) {
                                    canAfford = false;
                                    missingReason = check.reason || 'Krav ikke møtt';
                                }
                            }

                            const costLabel = getActionCostString(action.id, currentSeason, currentWeather) || action.cost;

                            return (
                                <button
                                    key={action.id}
                                    onClick={() => onAction(poi.id, action.id)}
                                    disabled={!canAfford}
                                    className={`group flex justify-between items-center w-full px-5 py-4 rounded-2xl border transition-all text-left gap-4 ${canAfford ? 'bg-white/5 hover:bg-indigo-600/90 border-white/5 shadow-sm active:scale-[0.98]' : 'bg-black/20 border-white/5 opacity-50 cursor-not-allowed'}`}
                                >
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className={`text-sm font-bold transition-transform truncate ${canAfford ? 'text-white' : 'text-slate-400'}`}>{action.label}</span>
                                        {!canAfford && <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1 opacity-90">{missingReason}</span>}
                                    </div>
                                    {costLabel && (
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border flex-shrink-0 ${canAfford ? 'text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:text-white group-hover:bg-amber-500/30' : 'text-slate-600 border-white/5'}`}>
                                            {costLabel}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    }
                    {poi.actions.length === 0 && (
                        <div className="text-center py-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest italic opacity-50">
                            Ingen handlinger her
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
