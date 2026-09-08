// src/app/certificates/new/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CERTIFICATE_TYPES, CHALLENGE_LEVELS } from "@/types/certificate";

export default function NewCertificatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    prop_firm_name: "",
    certificate_type: "standard",
    challenge_level: "phase_1",
    certificate_url: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          router.replace("/login");
          return;
        }
        setUser(userData.user);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [router]);

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Зөвхөн PNG, JPG, JPEG, WEBP, GIF файлуудыг оруулна уу.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Файлын хэмжээ 5MB-аас ихгүй байх ёстой.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Upload file to Supabase Storage
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);

      // Generate unique filename with timestamp
      const fileExtension = file.name.split(".").pop();
      const timestamp = Date.now();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
      const filePath = `certificates/${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("certificates")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Файл хуулахад алдаа гарлаа.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let imageUrl = formData.certificate_url;

      // Upload file if selected
      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.from("certificates").insert([
        {
          name: formData.name,
          prop_firm_name: formData.prop_firm_name,
          certificate_type: formData.certificate_type,
          challenge_level: formData.challenge_level,
          certificate_url: imageUrl,
          user_id: user.id,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      router.push("/certificates");
    } catch (error) {
      console.error("Error creating certificate:", error);
      alert("Certificate үүсгэхэд алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (loadingData) {
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
    <div className="max-w-2xl mx-auto px-3 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/certificates"
            className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
          >
            ← Буцах
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">
            Шинэ Certificate үүсгэх
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900">
          <h2 className="text-lg font-semibold mb-4">Certificate мэдээлэл</h2>

          <div className="space-y-4">
            {/* Certificate Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Certificate нэр <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Жишээ: FTMO Challenge 001"
                className="w-full rounded-lg border px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            {/* Prop Firm Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Prop Firm нэр <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.prop_firm_name}
                onChange={(e) =>
                  setFormData({ ...formData, prop_firm_name: e.target.value })
                }
                placeholder="Жишээ: FTMO, 5%ers, The Funded Trader"
                className="w-full rounded-lg border px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            {/* Certificate Type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Certificate төрөл <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.certificate_type}
                onChange={(e) =>
                  setFormData({ ...formData, certificate_type: e.target.value })
                }
                className="w-full rounded-lg border px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              >
                {CERTIFICATE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Challenge Level */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Шатлал <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.challenge_level}
                onChange={(e) =>
                  setFormData({ ...formData, challenge_level: e.target.value })
                }
                className="w-full rounded-lg border px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              >
                {CHALLENGE_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Certificate Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Certificate зураг
              </label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="flex-1 rounded-lg border px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:text-blue-600 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-400"
                  />
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={removeFile}
                      className="rounded-lg bg-red-100 px-3 py-2 text-red-600 hover:bg-red-200 dark:bg-red-950 dark:text-red-400"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Preview - Fixed aspect ratio warning */}
                {previewUrl && (
                  <div className="relative rounded-lg border overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <div
                      className="relative w-full"
                      style={{ aspectRatio: "16/9" }}
                    >
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-xs text-white">
                      {selectedFile?.name} (
                      {((selectedFile?.size ?? 0) / 1024).toFixed(1)} KB)
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  PNG, JPG, JPEG, WEBP, GIF (max 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading
              ? "Зураг хуулж байна..."
              : loading
                ? "Үүсгэж байна..."
                : "Certificate үүсгэх"}
          </button>
          <Link
            href="/certificates"
            className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-center text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Цуцлах
          </Link>
        </div>
      </form>
    </div>
  );
}
