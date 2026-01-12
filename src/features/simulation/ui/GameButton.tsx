import React from 'react';

interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'wood' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
}

export const GameButton: React.FC<GameButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    className = '',
    ...props
}) => {

    const baseStyles = "relative inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 uppercase rounded shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-blue-600 hover:bg-blue-500 text-white border-b-4 border-blue-800 hover:border-blue-700",
        secondary: "bg-game-stone hover:bg-gray-500 text-white border-b-4 border-gray-700",
        danger: "bg-game-danger hover:bg-red-500 text-white border-b-4 border-red-700",
        wood: "bg-game-wood hover:bg-amber-800 text-game-paper border-2 border-game-wood_light shadow-inner",
        ghost: "bg-transparent hover:bg-white/10 text-white shadow-none"
    };

    const sizes = {
        sm: "px-3 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        // Audio Trigger
        if (variant === 'primary' || variant === 'danger') {
            import('../logic/AudioManager').then(({ audioManager }) => audioManager.playSfx('confirm'));
        } else {
            import('../logic/AudioManager').then(({ audioManager }) => audioManager.playSfx('ui_click'));
        }

        if (props.onClick) props.onClick(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        import('../logic/AudioManager').then(({ audioManager }) => audioManager.playSfx('ui_hover'));
        if (props.onMouseEnter) props.onMouseEnter(e);
    }

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            {...props}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
};
