"use client";

import { useEffect, useRef, useState } from "react";

const helpText =
  "Upload receipts, bank statements, or transaction screenshots to extract expenses for review.";

interface ImageImportActionProps {
  onImport: () => void;
}

export default function ImageImportAction({ onImport }: ImageImportActionProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ignoreNextFocusRef = useRef(false);

  useEffect(() => {
    if (!isHelpOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsHelpOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsHelpOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isHelpOpen]);

  return (
    <div ref={containerRef} className="flex items-center gap-2">
      <button
        type="button"
        onClick={onImport}
        className="inline-flex items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-white px-6 py-4 text-lg font-black text-amber-700 shadow-sm transition-colors hover:bg-amber-50"
      >
        <span className="text-2xl leading-none">+</span>
        Import from Image
      </button>

      <div className="relative">
        <button
          type="button"
          aria-label={helpText}
          aria-expanded={isHelpOpen}
          onMouseDown={() => {
            ignoreNextFocusRef.current = true;
          }}
          onFocus={() => {
            if (ignoreNextFocusRef.current) {
              ignoreNextFocusRef.current = false;
              return;
            }

            setIsHelpOpen(true);
          }}
          onClick={() => setIsHelpOpen((current) => !current)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-black text-stone-500 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          ?
        </button>

        {isHelpOpen && (
          <div
            role="tooltip"
            className="absolute right-0 top-11 z-20 w-72 rounded-2xl border border-amber-100 bg-white p-4 text-sm font-semibold leading-6 text-stone-600 shadow-xl"
          >
            {helpText}
          </div>
        )}
      </div>
    </div>
  );
}
