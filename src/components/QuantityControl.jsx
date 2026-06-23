import React, { useState, useCallback, useRef, useEffect } from "react";
import { Plus, Minus } from "lucide-react";

/**
 * QuantityControl — animated quantity stepper for the cart.
 *
 * Features:
 *  • Spring bounce on quantity number when it changes
 *  • Floating "+1" / "-1" delta tag that flies up and fades out
 *  • Accessible aria-labels
 */
export default function QuantityControl({ itemId, quantity, onUpdate }) {
  const [bouncing, setBouncing] = useState(false);
  const [deltas, setDeltas] = useState([]); // [{ id, value, key }]
  const deltaCounter = useRef(0);
  const bounceTimer = useRef(null);

  // Clean up on unmount
  useEffect(() => () => clearTimeout(bounceTimer.current), []);

  const triggerChange = useCallback(
    (delta) => {
      const newQty = quantity + delta;
      if (newQty < 1) return; // guard: don't go below 1

      onUpdate(itemId, newQty);

      // Spring bounce
      clearTimeout(bounceTimer.current);
      setBouncing(true);
      bounceTimer.current = setTimeout(() => setBouncing(false), 480);

      // Spawn a floating delta tag
      const id = ++deltaCounter.current;
      setDeltas((prev) => [
        ...prev,
        { id, label: delta > 0 ? `+${delta}` : `${delta}`, positive: delta > 0 },
      ]);
      // Remove it after animation completes (700ms)
      setTimeout(() => {
        setDeltas((prev) => prev.filter((d) => d.id !== id));
      }, 700);
    },
    [itemId, quantity, onUpdate]
  );

  return (
    <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 relative select-none">
      {/* Decrement */}
      <button
        onClick={() => triggerChange(-1)}
        disabled={quantity <= 1}
        aria-label="Giảm số lượng"
        className="p-1.5 rounded-l-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:bg-slate-300 dark:active:bg-slate-600"
      >
        <Minus className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
      </button>

      {/* Quantity display with spring bounce — overflow-visible wrapper for delta tags */}
      <div className="relative flex items-center justify-center px-3 py-1.5 min-w-[2rem] overflow-visible">
        <span
          key={quantity}
          className={`font-black text-sm text-slate-800 dark:text-white block transition-transform ${
            bouncing ? "animate-qty-bounce" : ""
          }`}
        >
          {quantity}
        </span>

        {/* Floating delta tags — rendered outside normal flow */}
        {deltas.map((d) => (
          <span
            key={d.id}
            className={`absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] font-black pointer-events-none animate-qty-float-up z-50 ${
              d.positive
                ? "text-emerald-500 dark:text-emerald-400"
                : "text-rose-500 dark:text-rose-400"
            }`}
          >
            {d.label}
          </span>
        ))}
      </div>

      {/* Increment */}
      <button
        onClick={() => triggerChange(1)}
        aria-label="Tăng số lượng"
        className="p-1.5 rounded-r-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer active:bg-slate-300 dark:active:bg-slate-600"
      >
        <Plus className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
      </button>
    </div>
  );
}
