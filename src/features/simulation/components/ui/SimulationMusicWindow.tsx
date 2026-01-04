import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '../../SimulationAudioContext';
import { Play, Pause, SkipForward, SkipBack, Eye, EyeOff, Volume2, Music, X, Disc } from 'lucide-react';

interface SimulationMusicWindowProps {
    onClose: () => void;
}

export const SimulationMusicWindow: React.FC<SimulationMusicWindowProps> = ({ onClose }) => {
    const {
        currentTrackId,
        playlist,
        playNext,
        playPrevious,
        toggleIgnoreTrack,
        isIgnored,
        playMusic,
        stopMusic
    } = useAudio();

    const [isPlaying, setIsPlaying] = useState(!!currentTrackId);

    // Derived state
    const currentTrack = playlist.find(t => t.id === currentTrackId) || playlist[0];

    const handlePlayPause = () => {
        if (isPlaying && currentTrackId) {
            stopMusic();
            setIsPlaying(false);
        } else {
            if (currentTrackId) playMusic(currentTrackId);
            else playNext();
            setIsPlaying(true);
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Window Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", bounce: 0.3 }}
                className="relative w-full max-w-4xl h-[600px] bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Left Side: Visual Experience */}
                <div className="flex-1 relative flex flex-col items-center justify-center p-12 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border-r border-white/5">
                    {/* Dynamic Atmosphere Background based on track mood */}
                    <div className={`absolute inset-0 opacity-30 bg-gradient-to-tr ${currentTrack?.mood === 'Dark' ? 'from-rose-900/40' : 'from-indigo-600/20'} to-transparent transition-colors duration-1000`} />

                    {/* Spinning Disc / Visualizer */}
                    <div className="relative z-10 mb-12 group">
                        <div className={`w-64 h-64 rounded-full bg-slate-900 border-4 border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden ${isPlaying && currentTrackId ? 'animate-[spin_8s_linear_infinite]' : ''}`}>
                            {/* Inner Art (Abstract) */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(99,102,241,0.2)0%,transparent_70%)]" />
                            <div className="absolute inset-2 rounded-full border border-white/5 opacity-50" />
                            <div className="absolute inset-8 rounded-full border border-white/5 opacity-30" />

                            <Disc size={64} className="text-white/20" />
                        </div>

                        {/* Play/Pause Overlay on Hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={handlePlayPause}
                                className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all text-slate-900"
                            >
                                {isPlaying && currentTrackId ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                            </button>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="text-center space-y-2 z-10">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Nå Spiller</p>
                        <h2 className="text-3xl font-black text-white tracking-tighter max-w-sm leading-tight">
                            {currentTrack ? currentTrack.title : "Ingen Musikk"}
                        </h2>
                        {currentTrack?.mood && (
                            <span className="inline-block px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/5">
                                {currentTrack.mood} Mood
                            </span>
                        )}
                    </div>
                </div>

                {/* Right Side: Playlist & Controls */}
                <div className="w-full md:w-[400px] bg-black/20 flex flex-col">
                    <div className="p-8 pb-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Music size={16} className="text-indigo-400" /> Spilleliste
                        </h3>
                        <span className="text-[10px] font-bold text-slate-500">{playlist.length} Spor</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2">
                        {playlist.map((track, i) => {
                            const isActive = currentTrackId === track.id;
                            const ignored = isIgnored(track.id);

                            return (
                                <div
                                    key={track.id}
                                    className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${isActive
                                        ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-900/20'
                                        : ignored
                                            ? 'bg-transparent border-transparent opacity-40 grayscale hover:opacity-100 hover:bg-slate-800/50'
                                            : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'
                                        }`}
                                >
                                    <button
                                        onClick={() => {
                                            playMusic(track.id);
                                            setIsPlaying(true);
                                        }}
                                        className="flex items-center gap-4 flex-1 text-left min-w-0"
                                    >
                                        <span className={`text-xs font-bold w-6 text-center ${isActive ? 'text-indigo-400' : 'text-slate-600'}`}>
                                            {isActive ? <Volume2 size={14} className="mx-auto animate-pulse" /> : i + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                                {track.title}
                                            </p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleIgnoreTrack(track.id);
                                        }}
                                        className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${ignored
                                            ? 'opacity-100 text-rose-400 hover:bg-rose-500/10'
                                            : 'text-slate-500 hover:text-white hover:bg-white/10'
                                            }`}
                                        title={ignored ? "Gjenoppta" : "Ignorer"}
                                    >
                                        {ignored ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mini Controls Footer */}
                    <div className="p-6 border-t border-white/5 bg-black/40 flex items-center justify-between">
                        <button
                            onClick={playPrevious}
                            className="p-4 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                        >
                            <SkipBack size={20} />
                        </button>

                        <div className="h-10 w-[1px] bg-white/5" />

                        <button
                            onClick={handlePlayPause}
                            className="p-4 rounded-full hover:bg-white/5 text-white transition-colors scale-110 active:scale-95"
                        >
                            {isPlaying && currentTrackId ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                        </button>

                        <div className="h-10 w-[1px] bg-white/5" />

                        <button
                            onClick={playNext}
                            className="p-4 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                        >
                            <SkipForward size={20} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
