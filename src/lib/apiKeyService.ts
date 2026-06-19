import { supabase } from "@/lib/supabaseClient";

export interface ApiKeyData {
    id?: string;
    user_id?: string;
    provider: string;
    api_key: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    expires_at?: string | null;
}

export class ApiKeyService {
    /**
     * API key хадгалах (expires_at-тай хамт)
     */
    static async saveApiKey(
        provider: string,
        apiKey: string,
        expiresAt?: string | null,
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, error: "Хэрэглэгч олдсонгүй" };
            }

            const { data: existing } = await supabase
                .from("api_keys")
                .select("id")
                .eq("user_id", user.id)
                .eq("provider", provider)
                .single();

            if (existing) {
                const { error } = await supabase
                    .from("api_keys")
                    .update({
                        api_key: apiKey,
                        expires_at: expiresAt || null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", existing.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("api_keys")
                    .insert({
                        user_id: user.id,
                        provider: provider,
                        api_key: apiKey,
                        expires_at: expiresAt || null,
                    });

                if (error) throw error;
            }

            return { success: true };
        } catch (error: any) {
            console.error("Error saving API key:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * API key авах
     */
    static async getApiKey(provider: string): Promise<{
        success: boolean;
        data?: { api_key: string; expires_at?: string | null };
        error?: string;
    }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, error: "Хэрэглэгч олдсонгүй" };
            }

            const { data, error } = await supabase
                .from("api_keys")
                .select("api_key, expires_at")
                .eq("user_id", user.id)
                .eq("provider", provider)
                .eq("is_active", true)
                .single();

            if (error) {
                if (error.code === "PGRST116") {
                    return { success: false, error: "API key олдсонгүй" };
                }
                throw error;
            }

            return { success: true, data: data };
        } catch (error: any) {
            console.error("Error fetching API key:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * API key-ийн статус авах
     */
    static async getKeyStatus(provider: string): Promise<{
        status: "active" | "expiring_soon" | "expired" | "not_found";
        daysRemaining?: number;
        expiresAt?: string | null;
        message?: string;
    }> {
        try {
            const result = await this.getApiKey(provider);

            if (!result.success || !result.data) {
                return {
                    status: "not_found",
                    message: "API key олдсонгүй",
                };
            }

            const { expires_at } = result.data;

            if (!expires_at) {
                return {
                    status: "active",
                    message: "API key хүчинтэй (хугацаа тодорхойгүй)",
                };
            }

            const expiryDate = new Date(expires_at);
            const now = new Date();
            const daysRemaining = Math.ceil(
                (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );

            if (daysRemaining <= 0) {
                return {
                    status: "expired",
                    expiresAt: expires_at,
                    daysRemaining: 0,
                    message: "❌ API key-ийн хугацаа дууссан!",
                };
            } else if (daysRemaining <= 3) {
                return {
                    status: "expiring_soon",
                    expiresAt: expires_at,
                    daysRemaining,
                    message:
                        `⚠️ API key ${daysRemaining} хоногийн дараа дуусна`,
                };
            } else {
                return {
                    status: "active",
                    expiresAt: expires_at,
                    daysRemaining,
                    message:
                        `✅ API key хүчинтэй (${daysRemaining} хоног үлдсэн)`,
                };
            }
        } catch (error: any) {
            console.error("Error checking key status:", error);
            return {
                status: "not_found",
                message: "API key шалгахад алдаа гарлаа",
            };
        }
    }

    /**
     * API key устгах
     */
    static async deleteApiKey(
        provider: string,
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, error: "Хэрэглэгч олдсонгүй" };
            }

            const { error } = await supabase
                .from("api_keys")
                .delete()
                .eq("user_id", user.id)
                .eq("provider", provider);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error("Error deleting API key:", error);
            return { success: false, error: error.message };
        }
    }
}
