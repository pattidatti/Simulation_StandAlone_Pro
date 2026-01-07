import React from 'react';
import type { SimulationPlayer } from '../simulationTypes';
import { InventorySlot } from './InventorySlot';
import { motion } from 'framer-motion';
import { ITEM_TEMPLATES } from '../constants';

interface InventoryGridProps {
    player: SimulationPlayer;
    onSlotClick: (index: number, content: any) => void;
    onSlotHover: (e: React.MouseEvent, content: any) => void;
    onSlotLeave: () => void;
    onDragStart?: (item: any) => void;
    onDragEnd?: (event: any, item: any, info: any) => void;
    isTrashMode?: boolean;
}


export const InventoryGrid: React.FC<InventoryGridProps> = ({
    player, onSlotClick, onSlotHover, onSlotLeave, onDragStart, onDragEnd, isTrashMode
}) => {

    // 1. Convert resources to grid items
    const rawResources = Object.entries(player.resources || {})
        .filter(([id, amount]) => (amount as number) > 0 && id !== 'manpower' && id !== 'tools')
        .map(([id, amount]) => ({ type: 'resource', data: { id, amount: amount as number } }));

    // 2. Normalize and Hydrate equipment
    const invArray = Array.isArray(player.inventory)
        ? player.inventory
        : Object.values(player.inventory || {});

    const rawEquipment = (invArray || [])
        .filter(item => {
            if (!item) return false;
            if (typeof item === 'object' && Object.keys(item).length === 0) return false;
            return true;
        })
        .map(item => {
            let data: any = item;
            // Hydrate from templates
            if (typeof item === 'string') {
                data = (ITEM_TEMPLATES as any)[item] || { id: item, name: item, icon: '📦' };
            } else if (item && typeof item === 'object' && (item as any).id) {
                const baseId = (item as any).id.split('_')[0];
                const template = (ITEM_TEMPLATES as any)[baseId];
                if (template) {
                    // Spread template FIRST, then item. 
                    // Crucially: only overwrite icon if item.icon is a non-empty string
                    data = {
                        ...template,
                        ...item,
                        icon: (item as any).icon || template.icon || '📦'
                    };
                }
            }
            return { type: 'equipment', data };
        });

    // 3. Combine both into one list
    const allItems = [...rawResources, ...rawEquipment];

    // 4. Pad to exactly 25 slots for the "full grid" look
    const totalSlots = 25;
    const gridItems = [...allItems];
    while (gridItems.length < totalSlots) {
        gridItems.push(null as any);
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.03,
                delayChildren: 0.1
            }
        }
    };

    return (
        <motion.div
            className="grid grid-cols-5 gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            data-inventory-grid
        >
            {gridItems.map((item, i) => {
                if (!item) {
                    return <InventorySlot key={`empty-${i}`} />;
                }

                if (item.type === 'resource') {
                    return (
                        <InventorySlot
                            key={`inv-${i}`}
                            resource={item.data}
                            onClick={() => onSlotClick(i, item)}
                            onMouseEnter={(e) => onSlotHover(e, item)}
                            onMouseLeave={onSlotLeave}
                        />
                    );
                }

                return (
                    <InventorySlot
                        key={`inv-${i}`}
                        item={item.data as any}
                        layoutId={(item.data as any).id}
                        isDraggable={true}
                        onDragStart={() => onDragStart?.(item)}
                        onDragEnd={(e, info) => onDragEnd?.(e, item, info)}
                        onClick={() => onSlotClick(i, item)}
                        onMouseEnter={(e) => onSlotHover(e, item)}
                        onMouseLeave={onSlotLeave}
                        onMouseMove={(e) => onSlotHover(e, item)} // Ensure tooltip follows
                        isTrashMode={isTrashMode}
                    />
                );
            })}
        </motion.div>
    );
};
