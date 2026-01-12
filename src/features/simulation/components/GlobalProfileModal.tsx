import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { GlobalProfileContent } from './GlobalProfileContent';

interface GlobalProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRoomPin?: string;
}

export const GlobalProfileModal: React.FC<GlobalProfileModalProps> = ({ isOpen, onClose, currentRoomPin }) => {

    // Close on Escape & Scroll Lock
    useEffect(() => {
        if (isOpen) {
            // Lock Body Scroll
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleKeyDown);

            return () => {
                document.body.style.overflow = originalStyle;
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A15]/60 backdrop-blur-xl animate-in fade-in duration-300">
            {/* Grand Modal Frame */}
            <div className="w-full h-[100dvh] md:w-[80vw] md:max-w-[1400px] md:h-[80vh] bg-[#0A0A15] md:border border-white/10 md:rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-500 ease-out">

                {/* Header Actions (Floating) */}
                <div className="absolute top-6 right-6 md:top-8 md:right-8 z-50">
                    <button
                        onClick={onClose}
                        aria-label="Lukk profil"
                        className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-all backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-95"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Wrapper */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    <GlobalProfileContent onClose={onClose} currentRoomPin={currentRoomPin} />
                </div>
            </div>
        </div>,
        document.body
    );
};
