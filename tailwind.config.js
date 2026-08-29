/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                lactarDark: '#1e3a8a',
                lactarBlue: '#1d4ed8',
                lactarAccent: '#facc15',
                lactarGreen: '#10b981',
                lactarRed: '#ef4444'
            }
        }
    },
    plugins: [],
};