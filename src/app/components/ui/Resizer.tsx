"use client";

import React from "react";

export default function Resizer({
  onDrag,
}: {
  onDrag: (delta: number) => void;
}) {
  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;

    const onMove = (ev: MouseEvent) => {
      onDrag(ev.clientX - startX);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-1 cursor-col-resize bg-gray-300 hover:bg-blue-500"
    />
  );
}
