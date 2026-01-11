import React from 'react';
import { RESOURCE_DETAILS } from '../constants';

interface ResourceIconProps {
    resource: string; // 'gold', 'wood', etc.
    amount?: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string; // Allow overrides
}

export const ResourceIcon: React.FC<ResourceIconProps> = ({ resource, amount, size = 'md', showLabel = false, className = '' }) => {
    const details = RESOURCE_DETAILS[resource] || { label: resource, icon: '❓' };

    const sizeClasses = {
        sm: "text-xl",
        md: "text-3xl",
        lg: "text-7xl"
    };

    return (
        <div className={`flex items-center gap-2 ${className}`} title={details.label}>
            <span className={`${sizeClasses[size]}`}>{details.icon}</span>
            <div className="flex flex-col leading-none">
                {showLabel && <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 mb-0.5">{details.label}</span>}
                {amount !== undefined && <span className={`font-mono font-bold ${size === 'lg' ? 'text-xl' : 'text-sm'}`}>
                    {amount.toLocaleString()}
                </span>}
            </div>
        </div>
    );
};
