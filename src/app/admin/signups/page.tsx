// app/admin/signups/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";

type SignupRequest = {
  id: number;
  email: string;
  status: string;
  created_at: string;
};

export default function AdminSignupsPage() {
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check admin role and load data
  useEffect(() => {
    const checkAndLoad = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!roleData || roleData.role !== "admin") {
        setUserRole("user");
        setLoading(false);
        return;
      }

      setUserRole("admin");
      await loadRequests();
    };

    checkAndLoad();
  }, []);

  const loadRequests = async () => {
    const { data } = await supabase
      .from("allowed_signups")
      .select("*")
      .order("created_at", { ascending: false });

    setRequests(data || []);
    setLoading(false);
  };

  const addApprovedEmail = async () => {
    if (!newEmail) return;

    const { error } = await supabase
      .from("allowed_signups")
      .insert({ email: newEmail, status: "approved" });

    if (error) {
      alert("Алдаа: " + error.message);
    } else {
      setNewEmail("");
      loadRequests();
      alert(`✅ ${newEmail} амжилттай нэмэгдлээ!`);
    }
  };

  const deleteEmail = async (id: number, email: string) => {
    if (!confirm(`${email} -г устгах уу?`)) return;

    const { error } = await supabase
      .from("allowed_signups")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Алдаа: " + error.message);
    } else {
      loadRequests();
    }
  };

  // Admin биш бол
  if (userRole === "user") {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">🔒</div>
          <h2 className="text-xl font-semibold mb-2">Хандах эрхгүй</h2>
          <p className="text-gray-500">
            Танд энэ хуудсанд хандах эрх байхгүй байна.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-gray-500">Уншиж байна...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">👑 Admin Panel</h1>
          <p className="text-sm text-gray-500">
            Хэрэглэгчийн бүртгэлийг зөвшөөрөх
          </p>
        </div>
        <div className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
          Admin эрхтэй
        </div>
      </div>

      {/* Add email form */}
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="Имэйл хаяг оруулах..."
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        />
        <button
          onClick={addApprovedEmail}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          + Нэмэх
        </button>
      </div>

      {/* Approved emails table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left">Имэйл</th>
              <th className="px-4 py-3 text-left">Төлөв</th>
              <th className="px-4 py-3 text-left">Огноо</th>
              <th className="px-4 py-3 text-center">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Зөвшөөрөгдсөн имэйл байхгүй байна.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="border-t dark:border-gray-800">
                  <td className="px-4 py-3">{req.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => deleteEmail(req.id, req.email)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️ Устгах
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
