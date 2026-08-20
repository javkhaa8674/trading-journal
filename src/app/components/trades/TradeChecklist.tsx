"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";

type ChecklistItem = {
  id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  category: string;
  is_required: boolean;
  sort_order: number;
  input_type: string;
};

type ResponseStatus =
  | "met"
  | "partially_met"
  | "not_met"
  | "not_applicable"
  | null;

type ChecklistResponse = {
  id: string;
  checklist_item_id: string;
  value: boolean | null;
  rating: number | null;
  text_value: string | null;
  response_status: ResponseStatus;
};

type ResponseState = {
  value: boolean | null;
  rating: number | null;
  text_value: string | null;
  response_status: ResponseStatus;
};

type Props = {
  tradeId: string;
};

const emptyResponse = (): ResponseState => ({
  value: null,
  rating: null,
  text_value: null,
  response_status: null,
});

export default function TradeChecklist({ tradeId }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [responses, setResponses] = useState<Record<string, ResponseState>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  /*
   * --------------------------------
   * LOAD CHECKLIST
   * --------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();

      if (!user) {
        if (!cancelled) {
          setError("Хэрэглэгч олдсонгүй.");
          setLoading(false);
        }

        return;
      }

      const [itemsResult, responsesResult] = await Promise.all([
        supabase
          .from("trade_checklist_items")
          .select(
            `
            id,
            title,
            title_en,
            description,
            category,
            is_required,
            sort_order,
            input_type
          `,
          )
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("sort_order", {
            ascending: true,
          }),

        supabase
          .from("trade_checklist_responses")
          .select(
            `
            id,
            checklist_item_id,
            value,
            rating,
            text_value,
            response_status
          `,
          )
          .eq("user_id", user.id)
          .eq("trade_id", tradeId),
      ]);

      if (itemsResult.error) {
        if (!cancelled) {
          setError(itemsResult.error.message);
          setLoading(false);
        }

        return;
      }

      if (responsesResult.error) {
        if (!cancelled) {
          setError(responsesResult.error.message);
          setLoading(false);
        }

        return;
      }

      const nextResponses: Record<string, ResponseState> = {};

      ((responsesResult.data ?? []) as ChecklistResponse[]).forEach(
        (response) => {
          nextResponses[response.checklist_item_id] = {
            value: response.value,
            rating: response.rating,
            text_value: response.text_value,
            response_status: response.response_status,
          };
        },
      );

      if (!cancelled) {
        setItems((itemsResult.data ?? []) as ChecklistItem[]);
        setResponses(nextResponses);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tradeId]);

  /*
   * --------------------------------
   * GROUP BY CATEGORY
   * --------------------------------
   */

  const categories = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();

    for (const item of items) {
      const current = map.get(item.category) ?? [];

      current.push(item);

      map.set(item.category, current);
    }

    return Array.from(map.entries());
  }, [items]);

  /*
   * --------------------------------
   * UPDATE RESPONSE
   * --------------------------------
   */

  const updateResponse = (itemId: string, response: ResponseState) => {
    setSaved(false);

    setResponses((current) => ({
      ...current,
      [itemId]: response,
    }));
  };

  /*
   * --------------------------------
   * ANSWERED
   * --------------------------------
   */

  const isAnswered = (item: ChecklistItem) => {
    const response = responses[item.id];

    if (!response) {
      return false;
    }

    switch (item.input_type) {
      case "boolean":
        return response.response_status !== null;

      case "rating":
        return response.rating !== null;

      case "text":
        return Boolean(response.text_value?.trim());

      default:
        return false;
    }
  };

  /*
   * --------------------------------
   * REQUIRED
   * --------------------------------
   */

  const requiredMissing = useMemo(() => {
    return items.filter((item) => item.is_required && !isAnswered(item));
  }, [items, responses]);

  /*
   * --------------------------------
   * ANSWERED COUNT
   * --------------------------------
   */

  const answeredCount = useMemo(() => {
    return items.filter(isAnswered).length;
  }, [items, responses]);

  /*
   * --------------------------------
   * SETUP VALIDATION RESULT
   * --------------------------------
   *
   * Score rules:
   *
   * Met             = 1
   * Partially Met   = 0.5
   * Not Met         = 0
   * Not Applicable  = excluded
   * Unanswered      = incomplete
   *
   * Percentage denominator:
   *
   * total applicable items
   */

  const checklistResult = useMemo(() => {
    const booleanItems = items.filter((item) => item.input_type === "boolean");

    const metItems = booleanItems.filter(
      (item) => responses[item.id]?.response_status === "met",
    );

    const partiallyMetItems = booleanItems.filter(
      (item) => responses[item.id]?.response_status === "partially_met",
    );

    const notMetItems = booleanItems.filter(
      (item) => responses[item.id]?.response_status === "not_met",
    );

    const notApplicableItems = booleanItems.filter(
      (item) => responses[item.id]?.response_status === "not_applicable",
    );

    const unansweredItems = booleanItems.filter(
      (item) =>
        responses[item.id]?.response_status === null || !responses[item.id],
    );

    const totalBooleanItems = booleanItems.length;

    const totalApplicable = totalBooleanItems - notApplicableItems.length;

    const score = metItems.length + partiallyMetItems.length * 0.5;

    const percentage =
      totalApplicable > 0 ? Math.round((score / totalApplicable) * 100) : 0;

    return {
      metCount: metItems.length,
      partiallyMetCount: partiallyMetItems.length,
      notMetCount: notMetItems.length,
      notApplicableCount: notApplicableItems.length,
      unansweredCount: unansweredItems.length,
      totalBooleanItems,
      totalApplicable,
      score,
      percentage,
    };
  }, [items, responses]);

  /*
   * --------------------------------
   * SAVE
   * --------------------------------
   */

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const user = await getCurrentUser();

      if (!user) {
        throw new Error("Хэрэглэгч олдсонгүй.");
      }

      if (requiredMissing.length > 0) {
        throw new Error(
          `${requiredMissing.length} required checklist item бөглөгдөөгүй байна.`,
        );
      }

      for (const item of items) {
        const response = responses[item.id];

        if (!response) {
          continue;
        }

        /*
         * --------------------------------
         * 1. RESPONSE
         * --------------------------------
         */

        const responsePayload = {
          user_id: user.id,
          trade_id: tradeId,
          checklist_item_id: item.id,

          value: item.input_type === "boolean" ? response.value : null,

          rating: item.input_type === "rating" ? response.rating : null,

          text_value: item.input_type === "text" ? response.text_value : null,

          response_status:
            item.input_type === "boolean" ? response.response_status : null,

          updated_at: new Date().toISOString(),
        };

        const { data: existingResponse, error: responseFindError } =
          await supabase
            .from("trade_checklist_responses")
            .select("id")
            .eq("user_id", user.id)
            .eq("trade_id", tradeId)
            .eq("checklist_item_id", item.id)
            .maybeSingle();

        if (responseFindError) {
          throw responseFindError;
        }

        if (existingResponse) {
          const { error } = await supabase
            .from("trade_checklist_responses")
            .update(responsePayload)
            .eq("id", existingResponse.id)
            .eq("user_id", user.id);

          if (error) {
            throw error;
          }
        } else {
          const { error } = await supabase
            .from("trade_checklist_responses")
            .insert(responsePayload);

          if (error) {
            throw error;
          }
        }

        /*
         * --------------------------------
         * 2. NORMALIZED RESULT
         * --------------------------------
         */

        const resultPayload = {
          trade_id: tradeId,
          checklist_item_id: item.id,

          value_boolean: item.input_type === "boolean" ? response.value : null,

          value_number: item.input_type === "rating" ? response.rating : null,

          value_text: item.input_type === "text" ? response.text_value : null,

          updated_at: new Date().toISOString(),
        };

        const { data: existingResult, error: resultFindError } = await supabase
          .from("trade_checklist_results")
          .select("id")
          .eq("trade_id", tradeId)
          .eq("checklist_item_id", item.id)
          .maybeSingle();

        if (resultFindError) {
          throw resultFindError;
        }

        if (existingResult) {
          const { error } = await supabase
            .from("trade_checklist_results")
            .update(resultPayload)
            .eq("id", existingResult.id);

          if (error) {
            throw error;
          }
        } else {
          const { error } = await supabase
            .from("trade_checklist_results")
            .insert(resultPayload);

          if (error) {
            throw error;
          }
        }
      }

      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Checklist хадгалахад алдаа гарлаа.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * --------------------------------
   * LOADING
   * --------------------------------
   */

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500">Checklist ачааллаж байна...</p>
      </div>
    );
  }

  /*
   * --------------------------------
   * EMPTY
   * --------------------------------
   */

  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Trade Checklist</h2>

        <p className="mt-2 text-sm text-gray-500">
          Идэвхтэй checklist item алга байна.
        </p>
      </div>
    );
  }

  /*
   * --------------------------------
   * UI
   * --------------------------------
   */

  return (
    <section className="rounded-xl border bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* HEADER */}

      <div className="border-b p-5 dark:border-gray-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Trade Checklist</h2>

            <p className="mt-1 text-sm text-gray-500">
              {answeredCount} / {items.length} бөглөгдсөн
            </p>
          </div>

          <div className="text-sm text-gray-500">
            Required: {requiredMissing.length}
          </div>
        </div>

        {/* RESULT */}

        <div className="mt-5 rounded-xl border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Setup Validation
              </p>

              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {checklistResult.score % 1 === 0
                    ? checklistResult.score
                    : checklistResult.score.toFixed(1)}{" "}
                  / {checklistResult.totalApplicable}
                </span>

                <span className="text-sm text-gray-500">
                  {checklistResult.percentage}%
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-500">Met</span>

                <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                  {checklistResult.metCount}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Partial</span>

                <span className="ml-2 font-semibold text-yellow-600 dark:text-yellow-400">
                  {checklistResult.partiallyMetCount}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Not Met</span>

                <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                  {checklistResult.notMetCount}
                </span>
              </div>

              <div>
                <span className="text-gray-500">N/A</span>

                <span className="ml-2 font-semibold text-gray-500">
                  {checklistResult.notApplicableCount}
                </span>
              </div>
            </div>
          </div>

          {/* PROGRESS */}

          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{
                  width: `${checklistResult.percentage}%`,
                }}
              />
            </div>
          </div>

          {/* UNANSWERED */}

          {checklistResult.unansweredCount > 0 && (
            <p className="mt-3 text-xs text-gray-500">
              {checklistResult.unansweredCount} setup item бөглөгдөөгүй байна.
            </p>
          )}

          {/* NO APPLICABLE ITEMS */}

          {checklistResult.totalApplicable === 0 && (
            <p className="mt-3 text-xs text-gray-500">
              Setup Validation score тооцох applicable item алга байна.
            </p>
          )}
        </div>
      </div>

      {/* ITEMS */}

      <div className="divide-y dark:divide-gray-800">
        {categories.map(([category, categoryItems]) => (
          <div key={category} className="p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {category}
            </h3>

            <div className="space-y-4">
              {categoryItems.map((item) => {
                const response = responses[item.id] ?? emptyResponse();

                return (
                  <div
                    key={item.id}
                    className="rounded-lg border p-4 dark:border-gray-700"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.title}</span>

                          {item.is_required && (
                            <span className="text-xs text-red-500">
                              Required
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="mt-1 text-sm text-gray-500">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* BOOLEAN */}

                      {item.input_type === "boolean" && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateResponse(item.id, {
                                value: true,
                                rating: null,
                                text_value: null,
                                response_status: "met",
                              })
                            }
                            className={`rounded-lg border px-4 py-2 text-sm ${
                              response.response_status === "met"
                                ? "border-green-500 bg-green-500 text-white"
                                : "dark:border-gray-600"
                            }`}
                          >
                            Met
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateResponse(item.id, {
                                value: null,
                                rating: null,
                                text_value: null,
                                response_status: "partially_met",
                              })
                            }
                            className={`rounded-lg border px-4 py-2 text-sm ${
                              response.response_status === "partially_met"
                                ? "border-yellow-500 bg-yellow-500 text-white"
                                : "dark:border-gray-600"
                            }`}
                          >
                            Partially Met
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateResponse(item.id, {
                                value: false,
                                rating: null,
                                text_value: null,
                                response_status: "not_met",
                              })
                            }
                            className={`rounded-lg border px-4 py-2 text-sm ${
                              response.response_status === "not_met"
                                ? "border-red-500 bg-red-500 text-white"
                                : "dark:border-gray-600"
                            }`}
                          >
                            Not Met
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateResponse(item.id, {
                                value: null,
                                rating: null,
                                text_value: null,
                                response_status: "not_applicable",
                              })
                            }
                            className={`rounded-lg border px-4 py-2 text-sm ${
                              response.response_status === "not_applicable"
                                ? "border-gray-500 bg-gray-500 text-white"
                                : "dark:border-gray-600"
                            }`}
                          >
                            N/A
                          </button>
                        </div>
                      )}

                      {/* RATING */}

                      {item.input_type === "rating" && (
                        <select
                          value={response.rating ?? ""}
                          onChange={(event) =>
                            updateResponse(item.id, {
                              value: null,
                              rating:
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value),
                              text_value: null,
                              response_status: null,
                            })
                          }
                          className="w-full rounded-lg border bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 md:max-w-xs"
                        >
                          <option value="">Select rating</option>

                          {[1, 2, 3, 4, 5].map((value) => (
                            <option key={value} value={value}>
                              {value} / 5
                            </option>
                          ))}
                        </select>
                      )}

                      {/* TEXT */}

                      {item.input_type === "text" && (
                        <textarea
                          value={response.text_value ?? ""}
                          onChange={(event) =>
                            updateResponse(item.id, {
                              value: null,
                              rating: null,
                              text_value: event.target.value,
                              response_status: null,
                            })
                          }
                          rows={3}
                          placeholder="Write your answer..."
                          className="w-full rounded-lg border bg-white p-3 text-sm dark:border-gray-600 dark:bg-gray-800"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}

      <div className="flex items-center justify-between border-t p-5 dark:border-gray-800">
        <div>
          {error && <p className="text-sm text-red-500">{error}</p>}

          {saved && !error && (
            <p className="text-sm text-green-500">Checklist хадгалагдлаа.</p>
          )}
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving || requiredMissing.length > 0}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Checklist"}
        </button>
      </div>
    </section>
  );
}
