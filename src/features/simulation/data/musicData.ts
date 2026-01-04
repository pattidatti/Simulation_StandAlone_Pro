export interface MusicTrack {
    id: string; // The filename
    title: string; // Norwegian title
    duration?: number;
    mood?: 'Mysterious' | 'Epic' | 'Calm' | 'Dark';
}

export const MUSIC_PLAYLIST: MusicTrack[] = [
    { id: "Ashes of the Keep.mp3", title: "Festningens Aske", mood: 'Dark' },
    { id: "Banner at the Old Stone Keep.mp3", title: "Gamle Steiner", mood: 'Epic' },
    { id: "Banner at the Old Stone Keep (1).mp3", title: "Steinhallens Hymne", mood: 'Epic' },
    { id: "Burning Banners Over Stone.mp3", title: "Brennende Bannere", mood: 'Dark' },
    { id: "Candlelit Keep.mp3", title: "Lys i Hallen", mood: 'Calm' },
    { id: "Candlelit Keep (1).mp3", title: "Nattens Vakt", mood: 'Calm' },
    { id: "Crown of Quiet Rooms.mp3", title: "Stillhetens Krone", mood: 'Mysterious' },
    { id: "Crown of Quiet Rooms (1).mp3", title: "Kongens Tvil", mood: 'Mysterious' }
];

export const getTrackTitle = (id: string): string => {
    const track = MUSIC_PLAYLIST.find(t => t.id === id || t.id === `${id}.mp3`);
    if (track) return track.title;

    // Fallback: prettier filename
    return id.replace('.mp3', '').replace(/_/g, ' ');
};
