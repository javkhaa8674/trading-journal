// lib/utils/consoleFilter.ts
export const filterRechartsWarnings = () => {
    if (typeof window !== 'undefined') {
        const originalWarn = console.warn;
        console.warn = function (...args) {
            if (args[0]?.includes?.('width(-1) and height(-1)')) {
                return;
            }
            originalWarn.apply(console, args);
        };
    }
};