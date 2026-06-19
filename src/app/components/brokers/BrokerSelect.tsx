// src/app/components/brokers/BrokerSelect.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Broker } from "@/types/broker";

interface BrokerSelectProps {
  value?: string | null;
  onChange: (brokerId: string | null) => void;
  brokers: Broker[];
  onAddNew?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function BrokerSelect({
  value,
  onChange,
  brokers = [],
  onAddNew,
  placeholder = "Брокер сонгох",
  required = false,
  disabled = false,
}: BrokerSelectProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBroker = brokers.find((b) => b.id === value);

  const filteredBrokers = brokers.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew();
    } else {
      // Default: new page руу шилжих
      router.push("/brokers/new");
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          !value && required
            ? "border-red-500"
            : "border-gray-300 dark:border-gray-600"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {selectedBroker?.logo_url ? (
            <img
              src={selectedBroker.logo_url}
              alt={selectedBroker.name}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="text-lg flex-shrink-0">🏦</span>
          )}
          <span className="text-sm font-medium truncate">
            {selectedBroker?.name || placeholder}
          </span>
          {selectedBroker?.leverage && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded flex-shrink-0">
              {selectedBroker.leverage}
            </span>
          )}
          {selectedBroker?.is_default && (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded flex-shrink-0">
              ⭐ Default
            </span>
          )}
        </div>
        <span className="ml-2 flex-shrink-0">▾</span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Брокер хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-48">
            {filteredBrokers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <span className="text-3xl block mb-2">🏢</span>
                <p className="text-sm">Брокер олдсонгүй</p>
              </div>
            ) : (
              filteredBrokers.map((broker) => (
                <button
                  key={broker.id}
                  onClick={() => {
                    onChange(broker.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    broker.id === value ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  {broker.logo_url ? (
                    <img
                      src={broker.logo_url}
                      alt={broker.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-xl flex-shrink-0">🏦</span>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {broker.name}
                      </span>
                      {broker.is_default && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded flex-shrink-0">
                          ⭐
                        </span>
                      )}
                    </div>
                    {broker.leverage && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {broker.leverage} {broker.website && "•"}
                      </div>
                    )}
                  </div>
                  {broker.id === value && (
                    <span className="text-blue-500 flex-shrink-0">✓</span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Add new */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
            <button
              onClick={handleAddNew}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <span>➕</span>
              Шинэ брокер нэмэх
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
