
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseSmeltingLoopProps {
    onComplete: (score: number) => void;
    speedMultiplier?: number;
}

export const useSmeltingTick = ({ onComplete, speedMultiplier = 1.0 }: UseSmeltingLoopProps) => {
    // Game Physics State (Refs for High Performance)
    const heatRef = useRef(20); // 0-100
    const velocityRef = useRef(0); // Rate of change
    const progressRef = useRef(0); // 0-100

    // Game Configuration
    const targetRange = useRef({ min: 60, max: 85 });

    // Tuning Values (Magnetism Update)
    const decayRate = 0.025 * speedMultiplier; // Slower cooling
    const pumpForce = 1.5; // Finer control
    const maxVelocity = 3.0; // Prevent overshoot

    // React State for Phase Management only
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [shakeIntensity, setShakeIntensity] = useState(0);

    const requestRef = useRef<number | undefined>(undefined);
    const lastTimeRef = useRef<number | undefined>(undefined);

    const animate = useCallback((time: number) => {
        if (gameState !== 'playing') return;

        if (lastTimeRef.current !== undefined) {
            // const deltaTime = time - lastTimeRef.current; // Use fixed time step if needed, but simple delta is fine here
            // Note: For a very simple minigame, we might not need strict delta locking if 60fps is consistent, 
            // but let's just run logic per frame.

            // 1. Apply Physics
            // Velocity Decay (Air Resistance / Cooling)
            velocityRef.current -= decayRate;

            // Heat Update
            heatRef.current += velocityRef.current;

            // Clamp Heat
            if (heatRef.current < 0) {
                heatRef.current = 0;
                velocityRef.current = 0;
            } else if (heatRef.current > 100) {
                heatRef.current = 100;
                velocityRef.current = -velocityRef.current * 0.5; // Bounce off top
            }

            // 2. Check Progress & Magnetism
            const inZone = heatRef.current >= targetRange.current.min && heatRef.current <= targetRange.current.max;

            if (inZone) {
                // MAGNETISM: High friction when in zone to make it "sticky"
                velocityRef.current *= 0.90;

                progressRef.current += 0.15 * speedMultiplier;
            } else {
                // Afk Punishment
                progressRef.current = Math.max(0, progressRef.current - 0.05);
            }

            // 3. Win Condition
            if (progressRef.current >= 100) {
                setGameState('won');
                onComplete(1.0);
                return; // Stop loop
            }

            // 4. Update Shake (Visuals)
            if (inZone) {
                // Gentle rumble when in zone
                if (Math.random() > 0.8) setShakeIntensity(1);
                else setShakeIntensity(0);
            } else if (heatRef.current > 90) {
                // Violent shake when overheating
                setShakeIntensity(3);
            } else {
                setShakeIntensity(0);
            }
        }

        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    }, [gameState, onComplete, speedMultiplier, decayRate]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [animate]);

    const pump = useCallback(() => {
        if (gameState !== 'playing') return;
        velocityRef.current += pumpForce;
        // Cap max velocity using new constant
        velocityRef.current = Math.min(velocityRef.current, maxVelocity);
    }, [gameState, pumpForce]);

    return {
        heatRef,
        progressRef,
        targetRange: targetRange.current,
        gameState,
        shakeIntensity,
        pump
    };
};
