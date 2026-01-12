import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { GlobalProfileContent } from './GlobalProfileContent';

interface GlobalProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRoomPin?: string;
}

export const GlobalProfileModal: React.FC<GlobalProfileModalProps> = ({ isOpen, onClose, currentRoomPin }) => {

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-6xl h-full max-h-[90vh] bg-[#0A0A15] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-300">

                {/* Header Actions */}
                <div className="absolute top-8 right-8 z-50">
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors backdrop-blur-sm"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Wrapper */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
                    <GlobalProfileContent onClose={onClose} isModal={true} currentRoomPin={currentRoomPin} />
                </div>
            </div>
        </div>
    );
};
