// src/lib/hooks/useDraft.ts

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";

type DraftPsychology = {
  calmness_level: number | null;
  anxiety_level: number | null;
  fear_level: number | null;
  greed_level: number | null;
  frustration_level: number | null;
  confidence_level: number | null;
  focus_level: number | null;
  patience_level: number | null;
  decision_clarity_level: number | null;
  decision_pressure_level: number | null;
  rushed_decision: boolean | null;
  fomo: boolean | null;
  emotional_carryover: boolean | null;
};

type DraftChecklist = {
  checklist_item_id: string;
  response_status: string;
}[];

export function useDraft() {
  const [psychology, setPsychology] = useState<DraftPsychology | null>(null);
  const [checklist, setChecklist] = useState<DraftChecklist | null>(null);
  const [loading, setLoading] = useState(true);

  // Load drafts
  useEffect(() => {
    async function loadDrafts() {
      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load draft psychology
      const { data: psych } = await supabase
        .from("draft_psychology")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (psych) {
        // Remove id, user_id, trade_id, timestamps
        const { id, user_id, trade_id, created_at, updated_at, ...data } =
          psych;
        setPsychology(data);
      }

      // Load draft checklist
      const { data: checklistData } = await supabase
        .from("draft_checklist_responses")
        .select("checklist_item_id, response_status")
        .eq("user_id", user.id);

      if (checklistData) {
        setChecklist(checklistData);
      }

      setLoading(false);
    }

    loadDrafts();
  }, []);

  // Save draft psychology
  const savePsychology = async (data: DraftPsychology) => {
    const user = await getCurrentUser();
    if (!user) return;

    setPsychology(data);

    // Upsert to supabase
    const { error } = await supabase.from("draft_psychology").upsert(
      {
        user_id: user.id,
        ...data,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

    if (error) console.error("Error saving draft psychology:", error);
  };

  // Save draft checklist
  const saveChecklist = async (data: DraftChecklist) => {
    const user = await getCurrentUser();
    if (!user) return;

    setChecklist(data);

    // Delete existing draft checklist
    await supabase
      .from("draft_checklist_responses")
      .delete()
      .eq("user_id", user.id);

    // Insert new draft checklist
    if (data.length > 0) {
      const { error } = await supabase.from("draft_checklist_responses").insert(
        data.map((item) => ({
          user_id: user.id,
          checklist_item_id: item.checklist_item_id,
          response_status: item.response_status,
        })),
      );

      if (error) console.error("Error saving draft checklist:", error);
    }
  };

  // 🔗 Link drafts to trade (move to real tables)
  const linkToTrade = async (tradeId: string) => {
    const user = await getCurrentUser();
    if (!user) return { error: "User not found" };

    try {
      // 1. Move psychology to trade_psychology
      if (psychology) {
        const { error } = await supabase.from("trade_psychology").insert({
          trade_id: tradeId,
          user_id: user.id,
          ...psychology,
        });

        if (error) throw error;
      }

      // 2. Move checklist to trade_checklist_responses
      if (checklist && checklist.length > 0) {
        const { error } = await supabase
          .from("trade_checklist_responses")
          .insert(
            checklist.map((item) => ({
              trade_id: tradeId,
              user_id: user.id,
              checklist_item_id: item.checklist_item_id,
              response_status: item.response_status,
            })),
          );

        if (error) throw error;
      }

      // 3. Clear drafts
      await supabase.from("draft_psychology").delete().eq("user_id", user.id);

      await supabase
        .from("draft_checklist_responses")
        .delete()
        .eq("user_id", user.id);

      setPsychology(null);
      setChecklist(null);

      return { success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // Clear drafts
  const clearDrafts = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    await supabase.from("draft_psychology").delete().eq("user_id", user.id);

    await supabase
      .from("draft_checklist_responses")
      .delete()
      .eq("user_id", user.id);

    setPsychology(null);
    setChecklist(null);
  };

  return {
    psychology,
    checklist,
    loading,
    savePsychology,
    saveChecklist,
    linkToTrade,
    clearDrafts,
    hasDraft: !!(psychology || (checklist && checklist.length > 0)),
  };
}
