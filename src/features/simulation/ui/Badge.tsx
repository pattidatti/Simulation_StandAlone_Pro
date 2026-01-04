import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'outline' | 'gold' | 'role';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
    const variants = {
        default: "bg-white/10 text-white",
        outline: "border border-white/20 text-gray-300",
        gold: "bg-game-gold/20 text-game-gold border border-game-gold/50",
        role: "bg-purple-900/50 text-purple-200 border border-purple-500/30"
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
