// tailwind.config.ts (v4-д ихэнх тохиргоо CSS-д шилжсэн)
import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};

export default config;