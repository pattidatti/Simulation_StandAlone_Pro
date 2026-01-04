/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Disable automatic dark mode based on system preference
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            colors: {
                'bg-dark': 'var(--bg-main)', // Kept for compatibility, mapped to light main
                'bg-main': 'var(--bg-main)',
                'bg-card': 'var(--bg-card)',
                'text-main': 'var(--text-main)',
                'text-muted': 'var(--text-muted)',
                'neon-accent': 'var(--neon-accent)',
                game: {
                    gold: '#FFD700', // Classic Gold
                    wood: '#8B4513', // SaddleBrown
                    wood_light: '#DEB887', // BurlyWood
                    stone: '#708090', // SlateGray
                    stone_light: '#A9A9A9', // DarkGray
                    accent: '#4ade80', // Green-400
                    danger: '#ef4444', // Red-500
                    paper: '#fdf6e3', // Parchment-like
                    ink: '#1e293b', // Slate-800
                    glass: 'rgba(30, 41, 59, 0.7)', // Dark glass
                    glass_light: 'rgba(255, 255, 255, 0.1)' // Light glass overlay
                }
            },
        },
    },
    plugins: [],
}
