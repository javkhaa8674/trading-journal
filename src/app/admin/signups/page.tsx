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
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      <div className="flex h-96 items-center justify-center px-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🔒</div>
          <h2 className="text-xl font-semibold mb-2">Хандах эрхгүй</h2>
          <p className="text-gray-500 text-sm">
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
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">👑 Admin Panel</h1>
          <p className="text-xs md:text-sm text-gray-500">
            Хэрэглэгчийн бүртгэлийг зөвшөөрөх
          </p>
        </div>
        <div className="text-xs md:text-sm bg-green-100 text-green-700 px-2 md:px-3 py-1 rounded-full w-fit">
          Admin эрхтэй
        </div>
      </div>

      {/* Add email form - Mobile friendly */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          placeholder="Имэйл хаяг оруулах..."
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 text-sm md:text-base"
        />
        <button
          onClick={addApprovedEmail}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm md:text-base"
        >
          + Нэмэх
        </button>
      </div>

      {/* Mobile card view (mobile дээр card хэлбэрээр) */}
      {isMobile ? (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Зөвшөөрөгдсөн имэйл байхгүй байна.
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="border rounded-lg p-4 space-y-2 bg-white dark:bg-gray-900 dark:border-gray-800"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm md:text-base break-all">
                      {req.email}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                        {req.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEmail(req.id, req.email)}
                    className="text-red-500 hover:text-red-700 p-1"
                    aria-label="Устгах"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Desktop table view */
        <div className="border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm">Имэйл</th>
                <th className="px-4 py-3 text-left text-sm">Төлөв</th>
                <th className="px-4 py-3 text-left text-sm">Огноо</th>
                <th className="px-4 py-3 text-center text-sm">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Зөвшөөрөгдсөн имэйл байхгүй байна.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="border-t dark:border-gray-800">
                    <td className="px-4 py-3 text-sm break-all">{req.email}</td>
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
      )}

      {/* Info note */}
      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
        <p className="text-xs md:text-sm text-blue-800 dark:text-blue-300">
          💡 Зөвхөн энд бүртгэгдсэн имэйл хаягууд л системд бүртгүүлэх
          боломжтой.
        </p>
      </div>
    </div>
  );
}
