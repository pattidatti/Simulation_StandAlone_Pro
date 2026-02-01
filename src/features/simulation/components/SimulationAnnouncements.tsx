import React from 'react';
import { motion } from 'framer-motion';
import { Info, Zap, Megaphone, Bell } from 'lucide-react';

export type AnnouncementType = 'update' | 'info' | 'feedback' | 'alert';

interface Announcement {
    id: string;
    type: AnnouncementType;
    title: string;
    content: string;
    date: string;
}

// Current announcements - editable from here
const ANNOUNCEMENTS: Announcement[] = [
    {
        id: '1',
        type: 'Kommer snart',
        title: 'Neste Serveråpning',
        content: 'Neste offisielle server åpner i vinterferien! Oppdatering til beleringssystemet og mer! Husk å lage profil oppe til høyre for å lagre karakteren din!',
        date: '2026-02-05'
    },
    {
        id: '2',
        type: 'update',
        title: 'V0.8.4 Oppdatering',
        content: 'Saga-hjulet er balansert og terningene triller riktig.',
        date: '2026-02-01'
    },
    {
        id: '3',
        type: 'feedback',
        title: 'Din mening teller',
        content: 'Legg gjerne igjen feedback i chat-kanalen vår så vi kan gjøre Makthjulet enda bedre.',
        date: '2026-01-30'
    }
];

const getIcon = (type: AnnouncementType) => {
    switch (type) {
        case 'update': return <Zap size={14} className="text-emerald-400" />;
        case 'info': return <Bell size={14} className="text-blue-400" />;
        case 'feedback': return <Megaphone size={14} className="text-amber-400" />;
        case 'alert': return <Info size={14} className="text-rose-400" />;
        default: return <Bell size={14} />;
    }
};

export const SimulationAnnouncements: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="w-full max-w-5xl mt-8"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ANNOUNCEMENTS.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="group relative bg-slate-950/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-slate-950/60 min-h-[160px]"
                    >
                        {/* Subtle Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/0 via-white/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 blur transition-opacity" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-white/5">
                                        {getIcon(item.type)}
                                    </div>
                                    <span className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">
                                        {item.type}
                                    </span>
                                </div>
                                <span className="text-[9px] font-medium text-white/20 tabular-nums">
                                    {item.date}
                                </span>
                            </div>

                            <h4 className="text-sm font-bold text-white/90 mb-2 group-hover:text-white transition-colors">
                                {item.title}
                            </h4>

                            <p className="text-xs text-white/60 leading-relaxed font-light">
                                {item.content}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};
