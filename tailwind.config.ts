// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class", // ✅ class-based dark mode
    content: [
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            // your existing config
        },
    },
    plugins: [],
};

export default config;