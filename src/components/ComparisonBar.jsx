import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, GitCompare, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { useComparison } from '../context/ComparisonContext';
import { API_BASE, fetchWithRetry } from '../utils/api';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=160&auto=format&fit=crop';

export default function ComparisonBar({ onOpenCompareModal }) {
  const {
    comparisonItems,
    addToComparison,
    removeFromComparison,
    clearComparison,
    lockedCategory,
  } = useComparison();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    if (comparisonItems.length > 0) {
      setIsMinimized(false);
    } else {
      setIsPickerOpen(false);
    }
  }, [comparisonItems.length]);

  useEffect(() => {
    if (isMinimized || comparisonItems.length === 0) return;

    const handleClickOutside = (e) => {
      if (barRef.current && barRef.current.contains(e.target)) return;
      if (e.target.closest('.compare-toggle-btn')) return;
      setIsPickerOpen(false);
      setIsMinimized(true);
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isMinimized, comparisonItems.length]);

  useEffect(() => {
    if (!isPickerOpen || allProducts.length > 0) return;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await fetchWithRetry(`${API_BASE}/api/products`, {}, 2, 1000);
        const data = await response.json();
        setAllProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Không thể tải sản phẩm so sánh:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [isPickerOpen, allProducts.length]);

  const selectedIds = useMemo(
    () => new Set(comparisonItems.map((item) => item.id)),
    [comparisonItems]
  );

  const pickerProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return allProducts
      .filter((product) => !selectedIds.has(product.id))
      .filter((product) => !lockedCategory || product.category === lockedCategory)
      .filter((product) => {
        if (!keyword) return true;
        return [product.name, product.brand, product.category, product.subCategory]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      })
      .slice(0, 8);
  }, [allProducts, lockedCategory, searchTerm, selectedIds]);

  if (comparisonItems.length === 0) return null;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 left-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center cursor-pointer shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 border border-white/20 group animate-slide-up p-0"
        title="Hiển thị bảng chọn so sánh"
      >
        <span className="absolute -inset-1.5 bg-blue-500/30 rounded-full blur opacity-40 group-hover:opacity-70 transition duration-300 animate-pulse" />
        <GitCompare className="h-6 w-6 relative z-10 animate-glow-pulse" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white font-sans font-black text-[10px] w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-lg z-20">
          {comparisonItems.length}
        </span>
      </button>
    );
  }

  const slots = Array.from({ length: 4 }, (_, index) => comparisonItems[index] || null);

  const handlePickProduct = (product) => {
    addToComparison(product);
    setSearchTerm('');
    if (comparisonItems.length >= 3) setIsPickerOpen(false);
  };

  return (
    <div
      ref={barRef}
      className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-0.75rem)] max-w-6xl animate-slide-up"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-[24px] sm:rounded-[28px] blur-md opacity-20 dark:opacity-35" />

      {isPickerOpen && (
        <div className="absolute left-0 right-0 bottom-[calc(100%+0.6rem)] mx-auto max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm sản phẩm để so sánh..."
                className="h-10 sm:h-11 w-full rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-10 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-400"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Đóng chọn sản phẩm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {lockedCategory && (
              <p className="mt-2 text-[10px] font-bold text-slate-400">
                Chỉ hiển thị sản phẩm cùng danh mục: {lockedCategory}
              </p>
            )}
          </div>

          <div className="max-h-64 sm:max-h-72 overflow-y-auto p-3">
            {loadingProducts ? (
              <div className="h-28 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              </div>
            ) : pickerProducts.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-2">
                {pickerProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handlePickProduct(product)}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-2.5 text-left hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all"
                  >
                    <img
                      src={product.images?.[0] || ''}
                      alt={product.name}
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-contain bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                      onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 line-clamp-2">
                        {product.name}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-slate-400">
                        {product.brand || product.subCategory || product.category || 'Sản phẩm'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-28 flex flex-col items-center justify-center text-center text-slate-400">
                <Search className="h-6 w-6 mb-2" />
                <p className="text-xs font-bold">Không tìm thấy sản phẩm phù hợp</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/70 shadow-2xl rounded-[24px] sm:rounded-[28px] p-2.5 sm:p-4 transition-all duration-300">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex items-center gap-2 pr-3 border-r border-slate-100 dark:border-slate-800">
            <GitCompare className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-glow-pulse" />
            <span className="text-xs font-black text-slate-800 dark:text-white whitespace-nowrap">
              So sánh ({comparisonItems.length}/4)
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-3 min-w-0">
            {slots.map((item, index) => (
              item ? (
                <div
                  key={item.id}
                  className="relative min-w-0 rounded-2xl border border-blue-200/70 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20 p-1.5 sm:p-2 text-center shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => removeFromComparison(item.id)}
                    className="absolute right-1 top-1 z-10 h-5 w-5 sm:h-6 sm:w-6 inline-flex items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                    title="Xóa sản phẩm"
                  >
                    <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                  <img
                    src={item.images?.[0] || ''}
                    alt={item.name}
                    className="mx-auto h-9 w-11 sm:h-14 sm:w-16 rounded-xl object-contain bg-white dark:bg-slate-950 border border-blue-100 dark:border-blue-900/50"
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  />
                  <p className="mt-1 h-7 sm:h-8 text-[8px] sm:text-[10px] font-black leading-tight text-slate-800 dark:text-slate-100 line-clamp-2">
                    {item.name}
                  </p>
                </div>
              ) : (
                <button
                  key={`empty-${index}`}
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="min-w-0 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/30 p-1.5 sm:p-2 text-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all"
                >
                  <div className="mx-auto h-9 w-11 sm:h-14 sm:w-16 rounded-xl border border-dashed border-current flex items-center justify-center">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <p className="mt-1 h-7 sm:h-8 text-[8px] sm:text-[10px] font-black leading-tight">
                    Chọn thêm
                  </p>
                </button>
              )
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-slate-100 dark:border-slate-800">
            <button
              onClick={clearComparison}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl border border-rose-200/70 dark:border-rose-900/50 text-rose-500 hover:text-white hover:bg-rose-500 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              title="Xóa tất cả sản phẩm"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              onClick={onOpenCompareModal}
              disabled={comparisonItems.length < 2}
              className={`hidden sm:flex items-center justify-center gap-1 px-5 h-10 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                comparisonItems.length >= 2
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>{comparisonItems.length >= 2 ? 'So sánh' : `So sánh (cần ${2 - comparisonItems.length})`}</span>
              {comparisonItems.length >= 2 && <ArrowRight className="h-3.5 w-3.5 animate-bounce-horizontal" />}
            </button>
          </div>
        </div>

        <button
          onClick={onOpenCompareModal}
          disabled={comparisonItems.length < 2}
          className={`sm:hidden mt-2 w-full h-9 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all ${
            comparisonItems.length >= 2
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
          }`}
        >
          {comparisonItems.length >= 2 ? 'So sánh ngay' : `So sánh cần thêm ${2 - comparisonItems.length}`}
        </button>
      </div>
    </div>
  );
}
