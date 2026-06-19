import { supabase } from "@/lib/supabaseClient";

export interface ForexSymbol {
    id: string;
    symbol: string;
    name: string;
    exchange: string;
    type: string;
    is_active: boolean;
    pip_decimals: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export class ForexSymbolService {
    /**
     * Бүх идэвхтэй forex symbols-г авах
     */
    static async getActiveSymbols(): Promise<
        { success: boolean; data?: ForexSymbol[]; error?: string }
    > {
        try {
            const { data, error } = await supabase
                .from("forex_symbols")
                .select("*")
                .eq("is_active", true)
                .order("sort_order", { ascending: true });

            if (error) throw error;

            return { success: true, data: data };
        } catch (error: any) {
            console.error("Error fetching forex symbols:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Шинэ forex symbol нэмэх (Admin only)
     */
    static async addSymbol(
        symbolData: Omit<ForexSymbol, "id" | "created_at" | "updated_at">,
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from("forex_symbols")
                .insert(symbolData);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error("Error adding forex symbol:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Forex symbol шинэчлэх (Admin only)
     */
    static async updateSymbol(
        id: string,
        updates: Partial<ForexSymbol>,
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from("forex_symbols")
                .update(updates)
                .eq("id", id);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error("Error updating forex symbol:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Forex symbol устгах (Admin only)
     */
    static async deleteSymbol(
        id: string,
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from("forex_symbols")
                .delete()
                .eq("id", id);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error("Error deleting forex symbol:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Forex symbol идэвх/идэвхгүй болгох (Admin only)
     */
    static async toggleSymbolStatus(
        id: string,
        isActive: boolean,
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from("forex_symbols")
                .update({ is_active: isActive })
                .eq("id", id);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error("Error toggling forex symbol:", error);
            return { success: false, error: error.message };
        }
    }
}
