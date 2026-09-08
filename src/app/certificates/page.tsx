// src/app/certificates/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Certificate = {
  id: string;
  name: string;
  prop_firm_name: string;
  certificate_type: string;
  challenge_level: string;
  certificate_url?: string | null;
  created_at: string;
};

export default function CertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          router.replace("/login");
          return;
        }

        setUser(userData.user);

        const { data, error } = await supabase
          .from("certificates")
          .select("*")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCertificates(data || []);
      } catch (error) {
        console.error("Error loading certificates:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const deleteCertificate = async (id: string) => {
    const { error } = await supabase
      .from("certificates")
      .delete()
      .eq("id", id)
      .eq("user_id", user?.id);

    if (error) {
      console.error("Delete error:", error);
      alert("Certificate устгахад алдаа гарлаа.");
    } else {
      setCertificates(certificates.filter((cert) => cert.id !== id));
      setDeleteConfirm(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    const types: Record<string, string> = {
      standard: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      rapid:
        "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      elite:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
      high_stakes:
        "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
      bootcamp:
        "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
      aggressive: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
      royal: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    };
    return (
      types[type.toLowerCase()] ||
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    );
  };

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [lightboxImage]);

  // Keyboard event for closing lightbox with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">📜</div>
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Certificates</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Prop Firm Challenge Certificates
          </p>
        </div>

        <button
          onClick={() => router.push("/certificates/new")}
          className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-white transition-colors hover:bg-blue-600"
        >
          <span className="text-base sm:text-lg">+</span>
          <span>Certificate үүсгэх</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
          <p className="text-xs text-blue-600 dark:text-blue-400">Нийт</p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {certificates.length}
          </p>
        </div>
        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950">
          <p className="text-xs text-green-600 dark:text-green-400">
            Prop Firms
          </p>
          <p className="text-xl font-bold text-green-700 dark:text-green-300">
            {new Set(certificates.map((c) => c.prop_firm_name)).size}
          </p>
        </div>
        <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-950">
          <p className="text-xs text-purple-600 dark:text-purple-400">Төрөл</p>
          <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
            {new Set(certificates.map((c) => c.certificate_type)).size}
          </p>
        </div>
        <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950">
          <p className="text-xs text-orange-600 dark:text-orange-400">Шатлал</p>
          <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
            {new Set(certificates.map((c) => c.challenge_level)).size}
          </p>
        </div>
      </div>

      {/* List - Portrait A4 style cards with full image */}
      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
          <div className="mb-2 text-4xl">📜</div>
          <h3 className="text-base font-semibold">Certificate байхгүй</h3>
          <p className="text-sm text-gray-500">
            Шинэ certificate үүсгэх товчийг дарна уу.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="relative rounded-lg border bg-white shadow-sm hover:shadow-md transition-all dark:bg-gray-900 flex flex-col overflow-hidden cursor-pointer group"
              style={{ aspectRatio: "1 / 1.414" }} // A4 portrait ratio
            >
              {/* Action Buttons */}
              {deleteConfirm === cert.id ? (
                <div className="absolute right-2 top-2 flex gap-1 sm:gap-2 z-20">
                  <button
                    onClick={() => deleteCertificate(cert.id)}
                    className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                  >
                    Устгах
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="rounded bg-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-400"
                  >
                    Цуцлах
                  </button>
                </div>
              ) : (
                <div className="absolute right-2 top-2 flex gap-1 sm:gap-2 z-20">
                  <Link
                    href={`/certificates/${cert.id}`}
                    className="rounded p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 sm:bg-transparent sm:hover:bg-blue-100 transition-colors"
                    title="Edit certificate"
                  >
                    <svg
                      className="w-4 h-4 sm:w-3.5 sm:h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(cert.id)}
                    className="rounded p-1.5 bg-red-100 text-red-600 hover:bg-red-200 sm:bg-transparent sm:hover:bg-red-100 transition-colors"
                    title="Delete certificate"
                  >
                    <svg
                      className="w-4 h-4 sm:w-3.5 sm:h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Certificate Image - Clickable to open lightbox */}
              {cert.certificate_url ? (
                <div
                  className="flex-1 relative w-full cursor-pointer"
                  onClick={() => setLightboxImage(cert.certificate_url || null)}
                >
                  <Image
                    src={cert.certificate_url}
                    alt={cert.name}
                    fill
                    loading="eager"
                    className="object-contain bg-gray-50 dark:bg-gray-800 p-2 transition-transform duration-200 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        target.style.display = "none";
                        const link = document.createElement("a");
                        link.href = cert.certificate_url || "";
                        link.target = "_blank";
                        link.className =
                          "absolute inset-0 flex items-center justify-center w-full h-full gap-2 rounded-lg bg-blue-50 text-sm text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900 transition-colors";
                        link.textContent = "🔗 View Certificate";
                        parent.appendChild(link);
                      }
                    }}
                  />
                  {/* Zoom icon on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
                    <div className="rounded-full bg-white/90 p-3 shadow-lg dark:bg-gray-800/90">
                      <svg
                        className="w-6 h-6 text-gray-700 dark:text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                  <span className="text-4xl opacity-20">📜</span>
                </div>
              )}

              {/* Certificate Info - Overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-3 pt-8 pointer-events-none">
                <h3 className="text-sm font-semibold text-white truncate">
                  {cert.name}
                </h3>
                <p className="text-xs text-white/80 truncate">
                  {cert.prop_firm_name}
                </p>

                <div className="mt-1.5 flex flex-wrap gap-1">
                  <span
                    className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getTypeColor(
                      cert.certificate_type,
                    )}`}
                  >
                    {cert.certificate_type.toUpperCase()}
                  </span>
                  <span className="inline-block rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {cert.challenge_level}
                  </span>
                  <span className="inline-block rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {formatDate(cert.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal - No scroll */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setLightboxImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            aria-label="Close fullscreen view"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Image container - no scroll */}
          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-5xl h-full max-h-[90vh] flex items-center justify-center">
              <Image
                src={lightboxImage}
                alt="Certificate full view"
                width={1200}
                height={1600}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                unoptimized
                priority
              />
            </div>
          </div>

          {/* Download button */}
          <a
            href={lightboxImage}
            download
            className="absolute bottom-4 right-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
            aria-label="Download image"
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </a>

          {/* Close hint */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs hidden sm:block">
            Click outside or press ESC to close
          </p>
        </div>
      )}
    </div>
  );
}
