"use client";

import { useEffect, useRef, useState } from "react";

interface PositionData {
    entry: number;
    tp: number;
    sl: number;
}

export function usePositionData(containerRef: React.RefObject<HTMLElement>) {
    const [positionData, setPositionData] = useState<PositionData | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const extractPositionData = (
        container: HTMLElement,
    ): PositionData | null => {
        try {
            const allText = container.textContent || "";

            const entryMatch = allText.match(/Entry:?\s*([\d.]+)/i);
            const tpMatch = allText.match(/TP:?\s*([\d.]+)/i);
            const slMatch = allText.match(/SL:?\s*([\d.]+)/i);

            // Alternative format
            if (!entryMatch && !tpMatch && !slMatch) {
                const priceMatch = allText.match(/Price:?\s*([\d.]+)/i);
                const takeProfitMatch = allText.match(
                    /Take Profit:?\s*([\d.]+)/i,
                );
                const stopLossMatch = allText.match(/Stop Loss:?\s*([\d.]+)/i);

                if (priceMatch || takeProfitMatch || stopLossMatch) {
                    return {
                        entry: priceMatch ? parseFloat(priceMatch[1]) : 0,
                        tp: takeProfitMatch
                            ? parseFloat(takeProfitMatch[1])
                            : 0,
                        sl: stopLossMatch ? parseFloat(stopLossMatch[1]) : 0,
                    };
                }
                return null;
            }

            return {
                entry: entryMatch ? parseFloat(entryMatch[1]) : 0,
                tp: tpMatch ? parseFloat(tpMatch[1]) : 0,
                sl: slMatch ? parseFloat(slMatch[1]) : 0,
            };
        } catch (error) {
            console.error("Error extracting position data:", error);
            return null;
        }
    };

    useEffect(() => {
        if (!containerRef.current) return;

        const checkData = () => {
            if (containerRef.current) {
                const data = extractPositionData(containerRef.current);
                if (data && (data.entry > 0 || data.tp > 0 || data.sl > 0)) {
                    setPositionData(data);
                }
            }
        };

        // Тогтмол шалгах
        intervalRef.current = setInterval(checkData, 2000);

        // DOM өөрчлөлт хянах
        const observer = new MutationObserver(() => {
            checkData();
        });

        observer.observe(containerRef.current, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            observer.disconnect();
        };
    }, [containerRef]);

    return positionData;
}
