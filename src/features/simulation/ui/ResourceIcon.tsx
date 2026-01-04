import React from 'react';
import { RESOURCE_DETAILS } from '../constants';

interface ResourceIconProps {
    resource: string; // 'gold', 'wood', etc.
    amount?: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export const ResourceIcon: React.FC<ResourceIconProps> = ({ resource, amount, size = 'md', showLabel = false }) => {
    const details = RESOURCE_DETAILS[resource] || { label: resource, icon: '❓' };

    const sizeClasses = {
        sm: "text-xl",
        md: "text-3xl",
        lg: "text-7xl"
    };



    return (
        <div className="flex items-center gap-2" title={details.label}>
            <span className={`${sizeClasses[size]}`}>{details.icon}</span>
            <div className="flex flex-col">
                {showLabel && <span className="text-xs uppercase text-game-stone_light font-bold tracking-wider">{details.label}</span>}
                {amount !== undefined && <span className={`font-mono font-bold text-white ${size === 'lg' ? 'text-xl' : 'text-sm'}`}>
                    {amount.toLocaleString()}
                </span>}
            </div>
        </div>
    );
};
