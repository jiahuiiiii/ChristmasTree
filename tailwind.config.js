/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'great-vibes': ['"Great Vibes"', 'cursive'],
                'cinzel': ['"Cinzel"', 'serif'],
            },
            colors: {
                'pink-glow': '#ffdae0',
                'gold': '#D4AF37',
                'hot-pink': '#FF69B4',
                'night-start': '#1f101b',
                'night-end': '#000000',
            },
        },
    },
    plugins: [],
}
