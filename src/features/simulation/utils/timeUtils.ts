/**
 * SIMULATION TIME UTILITIES
 * 
 * Game Time Scale:
 * 1 Tick = 1 Real Minute
 * 1 Day = 30 Ticks (21m Day / 9m Night)
 * 1 Season = 4 Days (120 Ticks)
 * 1 Year = 16 Days (480 Ticks)
 */

export type DayPart = 'DAY' | 'NIGHT';

export const TICKS_PER_DAY = 30;
export const DAY_THRESHOLD = 21; // Day is 0-20, Night is 21-29
export const TICKS_PER_SEASON = 120;
export const TICKS_PER_YEAR = 480;

export const SEASONS_ORDER: ('Spring' | 'Summer' | 'Autumn' | 'Winter')[] = [
    'Spring', 'Summer', 'Autumn', 'Winter'
];

/**
 * Returns a 0-29 value representing the progress through the current day
 */
export const getDayTick = (totalTicks: number): number => {
    return totalTicks % TICKS_PER_DAY;
};

/**
 * Returns 'DAY' or 'NIGHT' based on the cycle
 */
export const getDayPart = (totalTicks: number): DayPart => {
    return getDayTick(totalTicks) < DAY_THRESHOLD ? 'DAY' : 'NIGHT';
};

/**
 * Maps the 30-minute cycle to a 24-hour clock for display
 * 06:00 - 18:00 (Day)
 * 18:00 - 06:00 (Night)
 */
export const getClockTime = (totalTicks: number, lastTickAt: number = 0): string => {
    // Interpolate for smooth UI movement
    let preciseTicks = totalTicks;
    if (lastTickAt > 0) {
        const elapsedMinutes = (Date.now() - lastTickAt) / 60000;
        // We limit interpolation to 1 tick to avoid jumping if the ticker is slow
        preciseTicks += Math.min(1.0, Math.max(0, elapsedMinutes));
    }

    const dayTick = preciseTicks % TICKS_PER_DAY;

    // Total Hours in Day = 24
    // Total Ticks in Day = 30
    // Simple Linear mapping: 0 -> 06:00, 30 -> 06:00 (next day)
    // Precise Hour = (dayTick / 30) * 24h starting from 6am

    const rawInGameHour = (dayTick / TICKS_PER_DAY) * 24;
    const hour = (6 + Math.floor(rawInGameHour)) % 24;
    const minutes = Math.floor((rawInGameHour % 1) * 60);

    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Returns the current season based on total ticks
 */
export const getSeasonForTick = (totalTicks: number): 'Spring' | 'Summer' | 'Autumn' | 'Winter' => {
    const seasonIdx = Math.floor((totalTicks % TICKS_PER_YEAR) / TICKS_PER_SEASON);
    return SEASONS_ORDER[seasonIdx] || 'Spring';
};

/**
 * Returns the year (starting from Year 1)
 */
export const getYearForTick = (totalTicks: number, startYear: number = 1): number => {
    return startYear + Math.floor(totalTicks / TICKS_PER_YEAR);
};
