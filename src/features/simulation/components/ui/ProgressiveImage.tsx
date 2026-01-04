import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ProgressiveImageProps {
    src: string;
    placeholderSrc?: string;
    alt: string;
    className?: string; // Applied to the container
    imgClassName?: string; // Applied to the img element
    priority?: boolean; // If true, eager loads
    disableMotion?: boolean; // If true, disables the internal zoom/scale animation
}

/**
 * UltraThink Component: Progressive Image
 * 
 * Implements the "Blur-Up" pattern:
 * 1. Instantly displays a tiny, blurred placeholder (0ms).
 * 2. Fetches the high-res image in the background.
 * 3. Smoothly crossfades (opacity) to the high-res image when ready.
 * 
 * This creates the illusion of instant loading and a "cinematic" feel.
 */
export const ProgressiveImage: React.FC<ProgressiveImageProps> = React.memo(({
    src,
    placeholderSrc,
    alt,
    className,
    imgClassName = "object-cover w-full h-full",
    priority = false,
    disableMotion = false
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(placeholderSrc || src);

    useEffect(() => {
        // Reset state when src changes
        setIsLoaded(false);
        if (placeholderSrc) setCurrentSrc(placeholderSrc);

        // Preload high-res
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setCurrentSrc(src);
            setIsLoaded(true);
        };
    }, [src, placeholderSrc]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* The Image Layer */}
            <motion.img
                key={src} // Remount on src change to trigger animation
                src={currentSrc}
                alt={alt}
                loading={priority ? "eager" : "lazy"}
                className={`${imgClassName} transition-all duration-700 ease-in-out`}
                initial={{ filter: "blur(20px)", scale: disableMotion ? 1 : 1.1 }} // Start blurry and slightly zoomed
                animate={{
                    filter: isLoaded ? "blur(0px)" : "blur(20px)",
                    scale: disableMotion ? 1 : (isLoaded ? 1 : 1.1)
                }}
                style={{ willChange: "filter, transform" }} // Hardware accel
            />

            {/* Optional Overlay for extra "cinematic" dimming during load if desired */}
            {/* <div className={`absolute inset-0 bg-black/20 transition-opacity duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'}`} /> */}
        </div>
    );
});

ProgressiveImage.displayName = 'ProgressiveImage';
