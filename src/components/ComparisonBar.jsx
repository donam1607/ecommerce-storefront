import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, GitCompare, ArrowRight } from 'lucide-react';
import { useComparison } from '../context/ComparisonContext';

export default function ComparisonBar({ onOpenCompareModal }) {
  const { comparisonItems, removeFromComparison, clearComparison, lockedCategory } = useComparison();
  const [isMinimized, setIsMinimized] = useState(false);
  const barRef = useRef(null);

  // Auto-maximize when items are added/removed
  useEffect(() => {
    if (comparisonItems.length > 0) {
      setIsMinimized(false);
    }
  }, [comparisonItems.length]);

  // Click outside to minimize
  useEffect(() => {
    if (isMinimized || comparisonItems.length === 0) return;

    const handleClickOutside = (e) => {
      // Ignore click if it's inside the comparison bar
      if (barRef.current && barRef.current.contains(e.target)) {
        return;
      }
      
      // Ignore click if it's on a compare toggle button on a card or details page
      if (e.target.closest('.compare-toggle-btn')) {
        return;
      }

      setIsMinimized(true);
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isMinimized, comparisonItems.length]);

  if (comparisonItems.length === 0) return null;

  const totalSlots = 4;
  const remainingCount = totalSlots - comparisonItems.length;

  // Render Minimized Floating Bubble (Placed on the bottom-left corner)
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 left-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center cursor-pointer shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 border border-white/20 group animate-slide-up p-0"
        title="Hiển thị bảng chọn so sánh"
      >
        {/* Glow pulsing ring */}
        <span className="absolute -inset-1.5 bg-blue-500/30 rounded-full blur opacity-40 group-hover:opacity-70 transition duration-300 animate-pulse" />
        <GitCompare className="h-6 w-6 relative z-10 animate-glow-pulse" />
        
        {/* Numeric Badge */}
        <span className="absolute -top-1 -right-1 bg-red-500 text-white font-sans font-black text-[10px] w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-lg z-20">
          {comparisonItems.length}
        </span>
      </button>
    );
  }

  // Render Full Maximized Bar (Flat Row Layout, Click Outside to Minimize enabled, no explicit collapse button)
  return (
    <div 
      ref={barRef}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-4xl animate-slide-up"
    >
      {/* Glow aura background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl blur-md opacity-25 dark:opacity-40" />

      {/* Main glass panel */}
      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/60 shadow-2xl rounded-2xl p-3 flex items-center justify-between gap-4 transition-all duration-300">
        
        {/* Left Info: Small text */}
        <div className="flex items-center gap-2 flex-shrink-0 border-r border-slate-100 dark:border-slate-800 pr-3 h-8">
          <GitCompare className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 animate-glow-pulse" />
          <span className="text-[11px] font-black text-slate-800 dark:text-white whitespace-nowrap">
            So sánh ({comparisonItems.length}/4)
          </span>
        </div>

        {/* Center: Horizontal Scrollable Selected Products Chips */}
        <div className="flex flex-row overflow-x-auto scrollbar-none gap-2 flex-grow min-w-0 py-0.5 items-center">
          {comparisonItems.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/5 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-500/20 pl-2 pr-7 py-1 rounded-xl text-[11px] font-bold text-slate-800 dark:text-slate-200 min-w-[130px] max-w-[170px] flex-shrink-0 relative shadow-sm"
            >
              <img 
                src={item.images && item.images[0] ? item.images[0] : ""} 
                alt={item.name} 
                className="w-7 h-7 object-cover rounded bg-slate-50 dark:bg-slate-950 border border-blue-500/10"
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100&auto=format&fit=crop" }}
              />
              <span className="truncate flex-grow select-none">{item.name}</span>
              <button 
                onClick={() => removeFromComparison(item.id)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Xóa sản phẩm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Placeholder Slots */}
          {Array.from({ length: remainingCount }).map((_, idx) => (
            <div 
              key={`empty-${idx}`} 
              className="flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-950/5 px-3 py-1.5 rounded-xl text-[9px] font-bold text-slate-400 dark:text-slate-500 h-[28px] flex-shrink-0 select-none"
            >
              <span>+ Chọn thêm</span>
            </div>
          ))}
        </div>

        {/* Right Side: Compact Action CTA Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 border-l border-slate-100 dark:border-slate-800 pl-3 h-8">
          <button 
            onClick={clearComparison}
            className="p-2 rounded-xl border border-rose-200/50 dark:border-rose-900/40 text-rose-500 hover:text-white hover:bg-rose-500 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            title="Xóa tất cả sản phẩm"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          
          <button 
            onClick={onOpenCompareModal}
            disabled={comparisonItems.length < 2}
            className={`flex items-center justify-center gap-1 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer h-[30px] ${
              comparisonItems.length >= 2 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-600 text-white shadow-md shadow-blue-500/20' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>So sánh</span>
            {comparisonItems.length >= 2 ? (
              <ArrowRight className="h-3 w-3 animate-bounce-horizontal" />
            ) : (
              <span className="text-[9px] lowercase font-bold font-sans">
                (cần {2 - comparisonItems.length})
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
