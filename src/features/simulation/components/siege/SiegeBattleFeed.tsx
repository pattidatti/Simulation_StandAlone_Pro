import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogMessage {
    content: string;
    timestamp?: number;
}

interface Props {
    messages: (string | LogMessage)[];
}

export const SiegeBattleFeed: React.FC<Props> = ({ messages }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Show only last 5 messages
    const recentMessages = messages.slice(0).reverse().slice(0, 5).reverse();

    return (
        <div className="h-full w-full flex flex-col font-mono text-[10px]">
            <div className="text-slate-500 font-bold uppercase text-[9px] mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Live Feed
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 scrollbar-none">
                <AnimatePresence initial={false}>
                    {recentMessages.map((m, i) => {
                        const content = typeof m === 'string' ? m : m.content;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="mb-1 leading-tight text-slate-400"
                            >
                                <span className={content.includes('!') ? 'text-amber-300' : 'text-slate-400'}>
                                    {content}
                                </span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};
