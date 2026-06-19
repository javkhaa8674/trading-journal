// src/lib/hooks/useBrokers.ts
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Broker, BrokerFormData } from "@/types/broker";

export function useBrokers() {
    const [brokers, setBrokers] = useState<Broker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBrokers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setBrokers([]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("brokers")
                .select("*")
                .eq("user_id", user.id)
                .order("is_default", { ascending: false })
                .order("name", { ascending: true });

            if (error) {
                console.error("Supabase error:", error);
                throw error;
            }

            setBrokers(data || []);
        } catch (err) {
            const errorMsg = err instanceof Error
                ? err.message
                : "Брокеруудыг уншихад алдаа гарлаа";
            setError(errorMsg);
            console.error("Error fetching brokers:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // src/lib/hooks/useBrokers.ts - addBroker функц
    const addBroker = useCallback(async (data: BrokerFormData) => {
        try {
            setError(null);

            // 1. Хэрэглэгчийн мэдээлэл авах
            const { data: { user }, error: userError } = await supabase.auth
                .getUser();

            if (userError) {
                console.error("User error:", userError);
                throw new Error("Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа");
            }

            if (!user) {
                throw new Error(
                    "Нэвтрээгүй байна. Та эхлээд нэвтрэх шаардлагатай.",
                );
            }

            console.log("Current user:", user); // Debug log
            console.log("User ID:", user.id); // Debug log

            // 2. Хэрэв is_default true бол бусад брокеруудын is_default-г false болгох
            if (data.is_default) {
                const { error: updateError } = await supabase
                    .from("brokers")
                    .update({ is_default: false })
                    .eq("user_id", user.id)
                    .eq("is_default", true);

                if (updateError) {
                    console.error(
                        "Error updating default brokers:",
                        updateError,
                    );
                    // Энэ алдааг үл тоомсорлож болно
                }
            }

            // 3. Insert хийх - user_id-г тодорхой оруулах
            const insertData = {
                name: data.name,
                logo_url: data.logo_url || null,
                leverage: data.leverage || null,
                website: data.website || null,
                description: data.description || null,
                is_default: data.is_default || false,
                user_id: user.id, // ЭНЭ ЧУХАЛ!
            };

            console.log("Inserting broker data:", insertData); // Debug log

            const { data: newBroker, error } = await supabase
                .from("brokers")
                .insert([insertData])
                .select()
                .single();

            if (error) {
                console.error("Insert error:", error);
                console.error("Error details:", error.details);
                console.error("Error hint:", error.hint);
                throw error;
            }

            console.log("New broker created:", newBroker); // Debug log

            setBrokers((prev) => [...prev, newBroker]);
            return { data: newBroker, error: null };
        } catch (err) {
            const errorMsg = err instanceof Error
                ? err.message
                : "Брокер нэмэхэд алдаа гарлаа";
            setError(errorMsg);
            console.error("Add broker error:", err);
            return { data: null, error: errorMsg };
        }
    }, []);

    const updateBroker = useCallback(
        async (id: string, data: Partial<BrokerFormData>) => {
            try {
                setError(null);

                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    throw new Error("Нэвтрээгүй байна");
                }

                // Хэрэв is_default true бол бусад брокеруудын is_default-г false болгох
                if (data.is_default) {
                    const { error: updateError } = await supabase
                        .from("brokers")
                        .update({ is_default: false })
                        .eq("user_id", user.id)
                        .eq("is_default", true)
                        .neq("id", id);

                    if (updateError) {
                        console.error(
                            "Error updating default brokers:",
                            updateError,
                        );
                    }
                }

                const { data: updatedBroker, error } = await supabase
                    .from("brokers")
                    .update(data)
                    .eq("id", id)
                    .eq("user_id", user.id)
                    .select()
                    .single();

                if (error) {
                    console.error("Update error:", error);
                    throw error;
                }

                setBrokers((prev) =>
                    prev.map((b) => b.id === id ? updatedBroker : b)
                );
                return { data: updatedBroker, error: null };
            } catch (err) {
                const errorMsg = err instanceof Error
                    ? err.message
                    : "Брокер засахад алдаа гарлаа";
                setError(errorMsg);
                console.error("Update broker error:", err);
                return { data: null, error: errorMsg };
            }
        },
        [],
    );

    const deleteBroker = useCallback(async (id: string) => {
        try {
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("Нэвтрээгүй байна");
            }

            // Брокертой холбогдсон account-уудыг шалгах
            const { count, error: countError } = await supabase
                .from("accounts")
                .select("*", { count: "exact", head: true })
                .eq("broker_id", id)
                .eq("user_id", user.id);

            if (countError) {
                console.error("Count error:", countError);
                throw countError;
            }

            if (count && count > 0) {
                throw new Error(
                    `Энэ брокертэй ${count} данс холбогдсон байна. Эхлээд данснуудыг өөрчлөх шаардлагатай.`,
                );
            }

            const { error } = await supabase
                .from("brokers")
                .delete()
                .eq("id", id)
                .eq("user_id", user.id);

            if (error) {
                console.error("Delete error:", error);
                throw error;
            }

            setBrokers((prev) => prev.filter((b) => b.id !== id));
            return { error: null };
        } catch (err) {
            const errorMsg = err instanceof Error
                ? err.message
                : "Брокер устгахад алдаа гарлаа";
            setError(errorMsg);
            console.error("Delete broker error:", err);
            return { error: errorMsg };
        }
    }, []);

    const getDefaultBroker = useCallback(() => {
        return brokers.find((b) => b.is_default) || brokers[0] || null;
    }, [brokers]);

    useEffect(() => {
        fetchBrokers();
    }, [fetchBrokers]);

    return {
        brokers,
        loading,
        error,
        fetchBrokers,
        addBroker,
        updateBroker,
        deleteBroker,
        getDefaultBroker,
    };
}
