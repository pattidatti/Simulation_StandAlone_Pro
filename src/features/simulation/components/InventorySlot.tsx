import React from 'react';
import type { EquipmentItem } from '../simulationTypes';
import { ResourceIcon } from '../ui/ResourceIcon';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { ITEM_TEMPLATES } from '../constants';


interface InventorySlotProps {
    item?: EquipmentItem;
    resource?: { id: string, amount: number };
    isEmpty?: boolean;
    isEquipped?: boolean;
    onClick?: () => void;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: () => void;
    onMouseMove?: (e: React.MouseEvent) => void;
    slotType?: string; // e.g. 'MAIN_HAND', 'HEAD' for equipment placeholders

    // Drag and Drop
    isDraggable?: boolean;
    onDragStart?: (e: any) => void;
    onDragEnd?: (e: any, info: any) => void;
    layoutId?: string;
    isTrashMode?: boolean;
}



export const InventorySlot: React.FC<InventorySlotProps> = ({
    item,
    resource,
    isEmpty,
    isEquipped,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onMouseMove,
    slotType,
    isDraggable,
    onDragStart,
    onDragEnd,
    layoutId,
    isTrashMode
}) => {
    const isConsumable = React.useMemo(() => {
        if (item) {
            const displayItem: any = typeof item === 'string' ? (ITEM_TEMPLATES as any)[item] : item;
            return displayItem?.type === 'CONSUMABLE';
        }
        if (resource) {
            const template = (ITEM_TEMPLATES as any)[resource.id];
            return template?.type === 'CONSUMABLE';
        }
        return false;
    }, [item, resource]);

    const getContent = () => {
        if (item) {
            // Internal hydration for robustness
            let displayItem: any = item;
            if (typeof item === 'string') {
                displayItem = (ITEM_TEMPLATES as any)[item] || { id: item, name: item, icon: '📦' };
            } else if (item && !displayItem.icon && displayItem.id) {
                const baseId = displayItem.id.split('_')[0];
                const template = (ITEM_TEMPLATES as any)[baseId];
                if (template) displayItem = { ...template, ...item };
            }

            return (
                <div className="relative w-full h-full flex items-center justify-center group/item overflow-visible">
                    <span className="text-5xl filter drop-shadow-2xl group-hover/item:scale-110 group-hover/item:rotate-3 transition-transform duration-500">
                        {displayItem.icon || '📦'}
                    </span>
                    {displayItem.durability < displayItem.maxDurability && (
                        <div className="absolute bottom-1 left-3 right-3 h-1 bg-black/60 rounded-full overflow-hidden border border-white/10">
                            <div
                                className={`h-full transition-all duration-1000 ${(displayItem.durability / displayItem.maxDurability) < 0.2 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                    (displayItem.durability / displayItem.maxDurability) < 0.5 ? 'bg-yellow-500' : 'bg-indigo-400'
                                    }`}
                                style={{ width: `${(displayItem.durability / displayItem.maxDurability) * 100}%` }}
                            />
                        </div>
                    )}
                    {displayItem.level > 1 && (
                        <div className="absolute top-1 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-md border border-white/10 text-[8px] font-black text-indigo-300 uppercase tracking-tighter">
                            Lvl {displayItem.level}
                        </div>
                    )}
                </div>
            );
        }
        if (resource) {
            return (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-1 group/res">
                    <div className="group-hover/res:scale-110 group-hover/res:-rotate-3 transition-transform duration-500">
                        <ResourceIcon resource={resource.id} size="lg" />
                    </div>
                    <span className="absolute bottom-1 right-2 text-2xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,1)] shadow-black">
                        {resource.amount}
                    </span>
                </div>
            );
        }

        if (slotType) {
            const getSlotIcon = () => {
                switch (slotType) {
                    case 'HEAD': return '👤';
                    case 'BODY': return '👕';
                    case 'FEET': return '👟';
                    case 'MAIN_HAND': return '⚔️';
                    case 'OFF_HAND': return '🛡️';
                    case 'AXE': return '🪓';
                    case 'PICKAXE': return '⛏️';
                    case 'SCYTHE': return '🌾';
                    case 'HAMMER': return '🔨';
                    case 'CHISEL': return '🔨';
                    default: return null;
                }
            };
            return (
                <div className="opacity-15 flex flex-col items-center justify-center grayscale group-hover:grayscale-0 group-hover:opacity-30 transition-all duration-700">
                    <span className="text-4xl mb-1">{getSlotIcon()}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/60">{slotType.replace('_', ' ')}</span>
                </div>
            );
        }

        return (
            <div className="opacity-5 flex items-center justify-center">
                <Package className="w-8 h-8 text-white" />
            </div>
        );
    };

    return (
        <motion.button
            layoutId={layoutId}
            drag={isDraggable && !!getContent() ? true : false}
            dragSnapToOrigin
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            whileHover={{ scale: 1.05, zIndex: 50 }}
            whileDrag={{
                scale: 1.2,
                zIndex: 100,
                pointerEvents: 'none',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
            }}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseMove={onMouseMove}
            className={`
                relative aspect-square w-full rounded-2xl border-2 transition-all duration-300
                ${isEmpty || !getContent() ? 'bg-white/5 border-white/5 border-dashed' : 'bg-white/10 border-white/10 hover:bg-slate-800/80 hover:border-indigo-500/30'}
                ${isEquipped ? 'ring-2 ring-indigo-500 border-indigo-500/50 bg-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.2)]' : ''}
                ${isTrashMode && !isEmpty && getContent() ? 'hover:border-red-500/50 hover:bg-red-500/10 cursor-alias' : 'cursor-grab active:cursor-grabbing'}
                ${isConsumable && !isTrashMode && !isEmpty && !isEquipped ? 'shadow-[inset_0_0_15px_rgba(16,185,129,0.2)] border-emerald-500/20' : ''}
                group overflow-hidden will-change-transform
            `}
        >
            {getContent()}

            {/* Tooltip Peek (handled by parent or flyout) */}
            {(item || resource) && (
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isTrashMode ? 'bg-red-500/10' : 'bg-indigo-500/5'}`} />
            )}
        </motion.button>
    );
};
