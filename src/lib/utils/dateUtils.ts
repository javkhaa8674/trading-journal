// lib/utils/dateUtils.ts
export const getSafeDate = (date: string | Date | null | undefined): Date | null => {
    if (!date) return null;
    try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
};

export const getSafeDateString = (date: string | number | Date | null | undefined): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? '' : d.toDateString();
    } catch {
        return '';
    }
};

export const getSafeTime = (date: string | Date | null | undefined): number => {
    const safeDate = getSafeDate(date);
    return safeDate ? safeDate.getTime() : 0;
};