"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";

type Account = {
  id: string;
  name: string;
  broker: string;
  mode: string;
  balance: number;
  status: string;
};

export default function EditAccountPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Account | null>(null);
  const [regenerateName, setRegenerateName] = useState(false);

  useEffect(() => {
    const loadAccount = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", accountId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setFormData(data);
      }

      setLoading(false);
    };

    loadAccount();
  }, [accountId, router]);

  // Regenerate account name based on current data
  const regenerateAccountName = () => {
    if (!formData) return;
    const timestamp = new Date().toLocaleString();
    const modeText = formData.mode === "live" ? "LIVE" : "DEMO";
    const newName = `${formData.broker} ${modeText} $${formData.balance.toLocaleString()} ${timestamp}`;
    setFormData({ ...formData, name: newName });
    setRegenerateName(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setSaving(true);
    setError(null);

    const user = await getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error: updateError } = await supabase
      .from("accounts")
      .update({
        name: formData.name,
        broker: formData.broker,
        mode: formData.mode,
        balance: formData.balance,
        status: formData.status,
      })
      .eq("id", accountId)
      .eq("user_id", user.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      router.push("/accounts");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-gray-500">Loading account...</div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        Error: {error || "Account not found"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Edit Account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Name - Editable */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium mb-1">
              Account Name
            </label>
            <button
              type="button"
              onClick={() => setRegenerateName(true)}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              🔄 Regenerate
            </button>
          </div>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Format: Broker + Mode + Balance + Timestamp
          </p>
        </div>

        {/* Regenerate Confirmation */}
        {regenerateName && (
          <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Regenerate account name with current values?
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={regenerateAccountName}
                className="rounded bg-yellow-500 px-3 py-1 text-xs text-white hover:bg-yellow-600"
              >
                Yes, Regenerate
              </button>
              <button
                type="button"
                onClick={() => setRegenerateName(false)}
                className="rounded border px-3 py-1 text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Broker */}
        <div>
          <label className="block text-sm font-medium mb-1">Broker *</label>
          <input
            type="text"
            value={formData.broker}
            onChange={(e) =>
              setFormData({ ...formData, broker: e.target.value })
            }
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Mode */}
        <div>
          <label className="block text-sm font-medium mb-1">Mode *</label>
          <select
            value={formData.mode}
            onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="demo">Demo</option>
            <option value="live">Live</option>
            <option value="backtest">Backtest</option>
            <option value="challengeStep1">Challenge Step 1</option>
            <option value="challengeStep2">Challenge Step 2</option>
            <option value="funded">Funded</option>
          </select>
        </div>
        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Balance */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Balance ($) *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={(e) =>
              setFormData({ ...formData, balance: parseFloat(e.target.value) })
            }
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            Error: {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push("/accounts")}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
