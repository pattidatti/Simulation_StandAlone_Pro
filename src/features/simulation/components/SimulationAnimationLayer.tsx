
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { animationManager } from '../logic/AnimationManager';
import type { AnimationEvent } from '../logic/AnimationManager';
import { RESOURCE_DETAILS } from '../constants';

export const SimulationAnimationLayer: React.FC = () => {
    const [events, setEvents] = useState<AnimationEvent[]>([]);

    useEffect(() => {
        const unsubscribe = animationManager.subscribe((event) => {
            setEvents(prev => [...prev, event]);

            // Auto-cleanup after duration
            setTimeout(() => {
                setEvents(prev => prev.filter(e => e.id !== event.id));
            }, event.duration + 500); // Buffer for animation completion
        });
        return unsubscribe;
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
            <AnimatePresence>
                {events.map(event => {
                    if (event.type === 'FLOATING_TEXT') {
                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, scale: 0.5, y: 0, rotate: (Math.random() - 0.5) * 20 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1.2,
                                    y: -120,
                                    x: (Math.random() - 0.5) * 40,
                                    rotate: (Math.random() - 0.5) * 40
                                }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`absolute font-black text-4xl drop-shadow-2xl ${event.color || 'text-amber-500'}`}
                                style={{
                                    left: `${event.x}%`,
                                    top: `${event.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 210
                                }}
                            >
                                {event.text}
                            </motion.div>
                        );
                    }

                    if (event.type === 'FLYING_RESOURCE') {
                        const details = RESOURCE_DETAILS[event.resource] || { icon: '📦' };
                        return (
                            <motion.div
                                key={event.id}
                                initial={{
                                    left: `${event.startPoint.x}px`,
                                    top: `${event.startPoint.y}px`,
                                    scale: 0.5,
                                    opacity: 0
                                }}
                                animate={{
                                    left: `${event.endPoint.x}px`,
                                    top: `${event.endPoint.y}px`,
                                    scale: [0.5, 1.5, 1],
                                    opacity: 1
                                }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ duration: 1, ease: "easeInOut" }}
                                className="absolute text-4xl z-[220] drop-shadow-xl"
                            >
                                {details.icon}
                            </motion.div>
                        );
                    }

                    if (event.type === 'PARTICLE') {
                        return (
                            <React.Fragment key={event.id}>
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={`${event.id}-p-${i}`}
                                        initial={{
                                            left: `${event.x}%`,
                                            top: `${event.y}%`,
                                            scale: 1,
                                            opacity: 1
                                        }}
                                        animate={{
                                            left: `${event.x + (Math.random() - 0.5) * 15}%`,
                                            top: `${event.y + (Math.random() - 0.5) * 15}%`,
                                            scale: 0,
                                            opacity: 0
                                        }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className={`absolute w-3 h-3 rounded-sm ${event.color || 'bg-amber-400'} z-[205]`}
                                    />
                                ))}
                            </React.Fragment>
                        );
                    }

                    return null;
                })}
            </AnimatePresence>
        </div>
    );
};
