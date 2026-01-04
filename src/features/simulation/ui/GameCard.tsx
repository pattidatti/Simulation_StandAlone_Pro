import { motion } from 'framer-motion';

interface GameCardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
    style?: React.CSSProperties;
    animateHover?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({
    children,
    className = '',
    title,
    action,
    style,
    animateHover = true
}) => {
    return (
        <motion.div
            whileHover={animateHover ? {
                boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(99, 102, 241, 0.1)"
            } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`relative bg-game-ink/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl ${className}`}
            style={style}
        >
            {/* Grunge / Noise Overlay with Texture Mask */}
            <div
                className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay grayscale"
                style={{
                    backgroundImage: "url('https://www.transparenttextures.com/patterns/dust.png')",
                    maskImage: "radial-gradient(circle, black 50%, transparent 100%)",
                    WebkitMaskImage: "radial-gradient(circle, black 50%, transparent 100%)"
                }}
            />

            {/* Header if title exists */}
            {(title || action) && (
                <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
                    {title && <h3 className="font-display font-bold text-game-gold tracking-wider uppercase text-sm">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="relative z-10 p-4 h-full">
                {children}
            </div>
        </motion.div>
    );
};
