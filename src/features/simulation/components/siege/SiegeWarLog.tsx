import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogMessage {
    content: string;
    timestamp?: number;
}

interface Props {
    messages: (string | LogMessage)[];
}

export const SiegeWarLog: React.FC<Props> = ({ messages }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="mt-auto w-full h-32 bg-slate-950/80 backdrop-blur-md rounded-xl border border-white/5 p-4 overflow-hidden shadow-inner flex flex-col">
            <h4 className="text-[10px] items-center flex gap-2 text-slate-500 font-bold uppercase mb-2 border-b border-white/5 pb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse box-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                Krigskorrespondent
            </h4>

            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                <AnimatePresence initial={false}>
                    {messages.slice(0).reverse().slice(0, 15).reverse().map((m, i) => { // Show last 15, newest at bottom
                        const content = typeof m === 'string' ? m : m.content;
                        const time = typeof m === 'string' ? new Date() : (m.timestamp ? new Date(m.timestamp) : new Date());

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-xs text-slate-300 font-mono leading-tight"
                            >
                                <span className="text-slate-600 mr-2">[{time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                <span className={content.includes('!') ? 'text-amber-200' : 'text-slate-300'}>{content}</span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {messages.length === 0 && (
                    <div className="text-slate-600 text-[10px] italic text-center mt-4">Ingen rapporter fra fronten ennå...</div>
                )}
            </div>
        </div>
    );
};
