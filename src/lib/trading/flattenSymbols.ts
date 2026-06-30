import { marketData } from "./marketData";

export function getAllSymbols(): string[] {
    const result: string[] = [];

    Object.values(marketData).forEach((category) => {
        if (Array.isArray(category)) {
            result.push(...category);
        } else {
            Object.values(category).forEach((group: any) => {
                if (Array.isArray(group)) {
                    result.push(...group);
                }
            });
        }
    });

    return [...new Set(result)];
}
