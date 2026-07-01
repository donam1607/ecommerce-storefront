import React, { useEffect, useState } from 'react';
import { 
  X, ShoppingCart, Star, Crown, Zap, GitCompare, ExternalLink, 
  Sparkles, SlidersHorizontal, Info, Check, AlertCircle, Plus, Search, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatVND } from '../utils/money';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useComparison } from '../context/ComparisonContext';
import { API_BASE, fetchWithRetry } from '../utils/api';

// Robust helper to extract displayable specs (supports objects with numerical keys)
const getDisplaySpecs = (specs) => {
  if (!specs) return [];
  
  // 1. Structured spec mode (fields array)
  if (Array.isArray(specs?.fields)) {
    return specs.fields
      .map((field) => ({
        key: field.key || field.label,
        label: field.label || "Thông số",
        value: field.value || "",
        unit: field.unit || "",
      }))
      .filter((field) => String(field.value).trim());
  }
  
  // 2. Simple array mode
  if (Array.isArray(specs)) {
    return specs
      .map((value, index) => ({ key: `legacy-${index}`, label: `Thông số ${index + 1}`, value, unit: "", legacy: true }))
      .filter((field) => String(field.value).trim());
  }

  // 3. Array-like object mode (e.g. { "0": "Intel i5", "1": "8GB" })
  if (typeof specs === 'object') {
    const values = [];
    let index = 0;
    while (specs[String(index)] !== undefined || specs[index] !== undefined) {
      const val = specs[String(index)] !== undefined ? specs[String(index)] : specs[index];
      values.push(val);
      index++;
    }
    if (values.length > 0) {
      return values
        .map((value, idx) => ({ key: `legacy-${idx}`, label: `Thông số ${idx + 1}`, value, unit: "", legacy: true }))
        .filter((field) => String(field.value).trim());
    }
  }

  return [];
};

const formatSpecValue = (spec) => {
  const value = String(spec.value || '').trim();
  const unit = String(spec.unit || '').trim();
  if (!unit) return value;
  return value.toLowerCase().includes(unit.toLowerCase()) ? value : `${value} ${unit}`;
};

export default function ComparisonModal({ isOpen, onClose }) {
  const { comparisonItems, addToComparison, removeFromComparison, clearComparison } = useComparison();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [hoveredColIndex, setHoveredColIndex] = useState(null);
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Escape key listener & Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isProductPickerOpen || allProducts.length > 0) return;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await fetchWithRetry(`${API_BASE}/api/products`, {}, 2, 1000);
        const data = await response.json();
        setAllProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        showToast('Không thể tải danh sách sản phẩm để so sánh.', 'error');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [isProductPickerOpen, allProducts.length, showToast]);

  if (!isOpen) return null;

  // Extract prices to determine best/lowest price
  const getProductFinalPrice = (product) => {
    const hasDiscount = product.discount > 0;
    if (product.discountedPrice !== null && product.discountedPrice !== undefined) {
      return Number(product.discountedPrice);
    }
    return hasDiscount ? Math.floor(product.price * (1 - product.discount / 100)) : product.price;
  };

  const prices = comparisonItems.map(getProductFinalPrice);
  const minPrice = Math.min(...prices);

  // Extract ratings to determine best rating
  const ratings = comparisonItems.map(p => p.rating || 0);
  const maxRating = Math.max(...ratings);

  // Gather unique specifications across all compared products
  const uniqueSpecLabels = [];
  comparisonItems.forEach((item) => {
    const itemSpecs = getDisplaySpecs(item.specs);
    itemSpecs.forEach((spec) => {
      if (!uniqueSpecLabels.includes(spec.label)) {
        uniqueSpecLabels.push(spec.label);
      }
    });
  });

  const getSpecValueForProduct = (product, label) => {
    const specs = getDisplaySpecs(product.specs);
    const match = specs.find((s) => s.label === label);
    return match ? formatSpecValue(match) : '—';
  };

  const handleAddToCartQuick = (product) => {
    addToCart(product);
    showToast(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success');
  };

  // Difference checkers for highlighting rows
  const checkBrandDiffers = () => {
    const values = comparisonItems.map(p => (p.brand || '').toLowerCase().trim());
    return new Set(values).size > 1;
  };

  const checkCategoryDiffers = () => {
    const values = comparisonItems.map(p => (p.subCategory || '').toLowerCase().trim());
    return new Set(values).size > 1;
  };

  const checkConditionDiffers = () => {
    const values = comparisonItems.map(p => (p.badge || 'new').toLowerCase().trim());
    return new Set(values).size > 1;
  };

  const checkPriceDiffers = () => {
    return new Set(prices).size > 1;
  };

  const checkRatingDiffers = () => {
    return new Set(ratings).size > 1;
  };

  const checkSpecDiffers = (label) => {
    const values = comparisonItems.map(p => getSpecValueForProduct(p, label).toLowerCase().trim());
    return new Set(values).size > 1;
  };

  const lockedCategory = comparisonItems[0]?.category || null;
  const selectedProductIds = new Set(comparisonItems.map((item) => item.id));
  const pickerProducts = allProducts
    .filter((product) => !selectedProductIds.has(product.id))
    .filter((product) => !lockedCategory || product.category === lockedCategory)
    .filter((product) => {
      const q = productSearch.trim().toLowerCase();
      if (!q) return true;
      return [product.name, product.brand, product.category, product.subCategory]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    })
    .slice(0, 12);

  const colCount = comparisonItems.length;
  const gridTemplateColumns = `minmax(120px, 180px) repeat(${colCount}, minmax(120px, 1fr))`;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/75 dark:bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-7xl h-[90vh] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[28px] shadow-2xl flex flex-col overflow-hidden transition-all duration-300">
        
        {/* Glow decorative borders */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>So sánh sản phẩm</span>
                {comparisonItems.length > 0 && (
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-450 px-2 py-0.5 rounded-full font-bold">
                    {comparisonItems[0].category} ({comparisonItems.length}/4)
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-slate-550 dark:text-slate-450 font-semibold mt-0.5">Phân tích đối chiếu trực quan các thông số cấu hình</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3.5">
            {/* Highlight Differences Switch Toggle */}
            {comparisonItems.length > 1 && (
              <button
                type="button"
                onClick={() => setHighlightDifferences(!highlightDifferences)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
                  highlightDifferences
                    ? 'bg-amber-500/10 border-amber-300/40 text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/5'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <Sparkles className={`h-4 w-4 ${highlightDifferences ? 'fill-amber-400 text-amber-500 animate-spin-slow' : 'text-slate-400'}`} />
                <span>Nổi bật khác biệt</span>
              </button>
            )}

            <button
              onClick={() => {
                clearComparison();
                onClose();
              }}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:border-rose-500/30 bg-white dark:bg-slate-900 hover:bg-rose-50/10 text-slate-650 dark:text-slate-300 hover:text-rose-500 text-xs font-bold rounded-xl transition-all active:scale-95"
            >
              Xóa danh sách
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
              aria-label="Đóng"
            >
              <X className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Scrollable Compare Grid */}
        <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin">
          {comparisonItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8 animate-fade-in">
              <div className="h-16 w-16 rounded-3xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-850 shadow-inner">
                <AlertCircle className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <p className="text-slate-850 dark:text-white font-extrabold text-sm">Danh sách trống</p>
                <p className="text-xs text-slate-500 dark:text-slate-550 mt-1 font-semibold">Vui lòng thêm sản phẩm từ trang chủ hoặc chi tiết để so sánh.</p>
              </div>
              <button 
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-95 cursor-pointer"
              >
                Quay lại mua sắm
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/50 dark:border-slate-800/80 p-4 sm:p-5 shadow-sm">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {comparisonItems.map((product, idx) => {
                    const finalPrice = getProductFinalPrice(product);
                    const isLowestPrice = finalPrice === minPrice && comparisonItems.length > 1;
                    const isHighestRating = (product.rating || 0) === maxRating && maxRating > 0 && comparisonItems.length > 1;
                    const isHovered = hoveredColIndex === idx;

                    return (
                      <div
                        key={product.id}
                        onMouseEnter={() => setHoveredColIndex(idx)}
                        onMouseLeave={() => setHoveredColIndex(null)}
                        className={`relative min-h-[190px] rounded-2xl border p-3 text-center transition-all ${
                          isHovered
                            ? 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => removeFromComparison(product.id)}
                          className="absolute right-2 top-2 z-10 h-7 w-7 inline-flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
                          title="Loại bỏ"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <Link to={`/product/${product.id}`} onClick={onClose} className="block">
                          <div className="mx-auto h-24 w-28 rounded-xl bg-slate-50 dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800">
                            <img
                              src={product.images && product.images[0] ? product.images[0] : ""}
                              alt={product.name}
                              className="h-full w-full object-contain p-1.5"
                              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=160&auto=format&fit=crop"; }}
                            />
                          </div>
                          <p className="mt-3 min-h-[38px] text-[12px] font-black leading-snug text-slate-850 dark:text-slate-100 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400">
                            {product.name}
                          </p>
                        </Link>
                        <div className="mt-2 flex min-h-[18px] items-center justify-center gap-1.5">
                          {isLowestPrice && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-black uppercase text-emerald-600">Rẻ nhất</span>}
                          {isHighestRating && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[8px] font-black uppercase text-amber-600">Đánh giá cao</span>}
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">{formatVND(finalPrice)}</span>
                          <button
                            type="button"
                            onClick={() => handleAddToCartQuick(product)}
                            className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 transition-all"
                            title="Thêm nhanh vào giỏ hàng"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {comparisonItems.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setIsProductPickerOpen(true)}
                      className="min-h-[190px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/30 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-blue-600"
                    >
                      <div className="h-14 w-14 rounded-2xl border border-dashed border-current flex items-center justify-center">
                        <Plus className="h-7 w-7" />
                      </div>
                      <span className="text-xs font-black">Thêm sản phẩm</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Product Cards Row (COMPACT STICKY HEADER) */}
              <div 
                className="hidden"
                style={{ gridTemplateColumns }}
              >
                {/* Top left cell */}
                <div className="flex flex-col justify-center px-7 border-r border-slate-100 dark:border-slate-800/40">
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-550 tracking-wider">Sản phẩm so sánh</span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal font-semibold">
                    Rà chuột dọc cột để dò thông số.
                  </p>
                </div>

                {/* Compare items cards (Compact Layout) */}
                {comparisonItems.map((product, idx) => {
                  const finalPrice = getProductFinalPrice(product);
                  const isLowestPrice = finalPrice === minPrice && comparisonItems.length > 1;
                  const isHighestRating = (product.rating || 0) === maxRating && maxRating > 0 && comparisonItems.length > 1;
                  const isHovered = hoveredColIndex === idx;

                  return (
                    <div 
                      key={product.id} 
                      onMouseEnter={() => setHoveredColIndex(idx)}
                      onMouseLeave={() => setHoveredColIndex(null)}
                      className={`relative px-4 flex items-center gap-3 justify-between group transition-all duration-300 border-r border-slate-100 dark:border-slate-800/40 last:border-r-0 ${
                        isHovered ? 'bg-blue-500/[0.02] dark:bg-blue-400/[0.01]' : ''
                      }`}
                    >
                      {/* Column background hover highlight overlay */}
                      {isHovered && (
                        <div className="absolute inset-y-0 inset-x-0 border-x border-dashed border-blue-500/15 pointer-events-none z-0" />
                      )}

                      {/* Compact thumbnail image and title */}
                      <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                        {/* Compact Image */}
                        <div className="h-14 w-14 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden border border-slate-200/50 dark:border-slate-800/80 relative flex-shrink-0">
                          <img 
                            src={product.images && product.images[0] ? product.images[0] : ""} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100&auto=format&fit=crop" }}
                          />
                          
                          {/* Tiny Absolutes for Best Price/Rating */}
                          <div className="absolute -top-0.5 -left-0.5 flex flex-col gap-0.5 z-10">
                            {isLowestPrice && (
                              <span className="bg-emerald-500 text-white p-0.5 rounded-br-md shadow" title="Rẻ nhất">
                                <Zap className="h-2 w-2 fill-white" />
                              </span>
                            )}
                            {isHighestRating && (
                              <span className="bg-amber-500 text-white p-0.5 rounded-br-md shadow" title="Đánh giá cao">
                                <Crown className="h-2 w-2 fill-white" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title and price in small text */}
                        <div className="min-w-0 space-y-0.5">
                          <Link 
                            to={`/product/${product.id}`}
                            onClick={onClose}
                            className="font-black text-slate-850 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 text-[11px] leading-tight flex items-center gap-0.5"
                          >
                            <span>{product.name}</span>
                          </Link>
                          <div className="flex items-baseline gap-1">
                            <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">{formatVND(finalPrice)}</span>
                            {product.discount > 0 && (
                              <span className="text-[8px] font-black text-red-500">-{product.discount}%</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Small Quick Buy and Close icons on right */}
                      <div className="flex flex-col gap-1.5 relative z-10 flex-shrink-0">
                        <button
                          onClick={() => handleAddToCartQuick(product)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-950 hover:scale-105 text-blue-600 dark:text-blue-400 rounded-lg transition-all cursor-pointer"
                          title="Thêm nhanh vào giỏ hàng"
                        >
                          <ShoppingCart className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFromComparison(product.id)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/80 dark:hover:bg-rose-950/40 text-slate-450 hover:text-red-500 rounded-lg transition-all cursor-pointer hover:scale-105"
                          title="Loại bỏ"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* SECTION: THÔNG TIN CƠ BẢN */}
              <div className="bg-slate-50/70 dark:bg-slate-900/30 backdrop-blur-sm py-2 px-7 text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 border-l-[3px] border-l-blue-600 flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-blue-500" />
                <span>Thông tin cơ bản</span>
              </div>

              {/* Row: Thương hiệu */}
              <div 
                className={`grid py-2.5 items-center transition-all ${
                  highlightDifferences && checkBrandDiffers() 
                    ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.015] border-l-[3px] border-l-amber-500/70' 
                    : 'border-l-[3px] border-l-transparent'
                }`}
                style={{ gridTemplateColumns }}
              >
                <div className="px-7 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>Thương hiệu</span>
                  {highlightDifferences && checkBrandDiffers() && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Khác biệt" />
                  )}
                </div>
                {comparisonItems.map((p, idx) => (
                  <div 
                    key={p.id} 
                    className={`px-6 text-xs font-extrabold text-slate-800 dark:text-slate-200 transition-colors ${
                      hoveredColIndex === idx ? 'bg-blue-500/[0.02] dark:bg-blue-400/[0.01] text-blue-600 dark:text-blue-400' : ''
                    }`}
                  >
                    {p.brand || '—'}
                  </div>
                ))}
              </div>

              {/* Row: Phân loại */}
              <div 
                className={`grid py-2.5 items-center transition-all ${
                  highlightDifferences && checkCategoryDiffers() 
                    ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.015] border-l-[3px] border-l-amber-500/70' 
                    : 'border-l-[3px] border-l-transparent'
                }`}
                style={{ gridTemplateColumns }}
              >
                <div className="px-7 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>Phân loại</span>
                  {highlightDifferences && checkCategoryDiffers() && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Khác biệt" />
                  )}
                </div>
                {comparisonItems.map((p, idx) => (
                  <div 
                    key={p.id} 
                    className={`px-6 text-xs font-semibold text-slate-700 dark:text-slate-350 transition-colors ${
                      hoveredColIndex === idx ? 'bg-blue-500/[0.02] dark:bg-blue-400/[0.01]' : ''
                    }`}
                  >
                    {p.subCategory || '—'}
                  </div>
                ))}
              </div>

              {/* Row: Tình trạng */}
              <div 
                className={`grid py-2.5 items-center transition-all ${
                  highlightDifferences && checkConditionDiffers() 
                    ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.015] border-l-[3px] border-l-amber-500/70' 
                    : 'border-l-[3px] border-l-transparent'
                }`}
                style={{ gridTemplateColumns }}
              >
                <div className="px-7 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>Tình trạng</span>
                  {highlightDifferences && checkConditionDiffers() && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Khác biệt" />
                  )}
                </div>
                {comparisonItems.map((p, idx) => (
                  <div 
                    key={p.id} 
                    className={`px-6 transition-colors ${
                      hoveredColIndex === idx ? 'bg-blue-500/[0.02] dark:bg-blue-400/[0.01]' : ''
                    }`}
                  >
                    <span className="inline-block px-2 py-0.5 text-[8px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded border border-slate-200/50 dark:border-slate-750">
                      {p.badge || 'New'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Row: Giá bán */}
              <div 
                className={`grid py-3 items-center transition-all ${
                  highlightDifferences && checkPriceDiffers() 
                    ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.015] border-l-[3px] border-l-amber-500/70' 
                    : 'border-l-[3px] border-l-transparent'
                }`}
                style={{ gridTemplateColumns }}
              >
                <div className="px-7 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>Giá bán</span>
                  {highlightDifferences && checkPriceDiffers() && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Khác biệt" />
                  )}
                </div>
                {comparisonItems.map((p, idx) => {
                  const finalPrice = getProductFinalPrice(p);
                  const hasDiscount = p.discount > 0;
                  return (
                    <div 
                      key={p.id} 
                      className={`px-6 space-y-0.5 transition-colors ${
                        hoveredColIndex === idx ? 'bg-blue-500/[0.02] dark:bg-blue-400/[0.01]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {formatVND(finalPrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-[8px] font-black text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-1 py-0.2 rounded border border-red-100 dark:border-red-950/10">
                            -{p.discount}%
                          </span>
                        )}
                      </div>
                      {hasDiscount && (
                        <p className="text-[9px] text-slate-400 line-through">
                          {formatVND(p.price)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Row: Đánh giá */}
              <div 
                className={`grid py-3 items-center transition-all ${
                  highlightDifferences && checkRatingDiffers() 
                    ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.015] border-l-[3px] border-l-amber-500/70' 
                    : 'border-l-[3px] border-l-transparent'
                }`}
                style={{ gridTemplateColumns }}
              >
                <div className="px-7 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>Xếp hạng đánh giá</span>
                  {highlightDifferences && checkRatingDiffers() && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Khác biệt" />
                  )}
                </div>
                {comparisonItems.map((p, idx) => (
                  <div 
                    key={p.id} 
                    className={`px-6 flex flex-col gap-1 transition-colors ${
                      hoveredColIndex === idx ? 'bg-blue-500/[0.02] dark:bg-blue-400/[0.01]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">{p.rating || 0}</span>
                      <span className="text-[10px] text-slate-455 font-bold">({p.reviews || 0} đánh giá)</span>
                    </div>
                    {/* Visual Meter Bar */}
                    <div className="h-1 w-20 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500" 
                        style={{ width: `${(p.rating || 0) * 20}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* SECTION: THÔNG SỐ KỸ THUẬT */}
              <div className="bg-slate-50/70 dark:bg-slate-900/30 backdrop-blur-sm py-2 px-7 text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 border-l-[3px] border-l-blue-600 flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-500" />
                <span>Thông số kỹ thuật chi tiết</span>
              </div>

              {/* Dynamic specifications mapping */}
              {uniqueSpecLabels.length === 0 ? (
                <div className="grid py-4" style={{ gridTemplateColumns }}>
                  <div className="px-7 text-xs font-semibold text-slate-400">Không có thông số cụ thể nào được liệt kê.</div>
                  {comparisonItems.map((p, idx) => (
                    <div 
                      key={p.id} 
                      className={`px-6 text-xs text-slate-400 transition-colors ${
                        hoveredColIndex === idx ? 'bg-blue-500/[0.02] dark:bg-blue-400/[0.01]' : ''
                      }`}
                    >
                      —
                    </div>
                  ))}
                </div>
              ) : (
                uniqueSpecLabels.map((label) => {
                  const differs = checkSpecDiffers(label);
                  return (
                    <div 
                      key={label} 
                      className={`grid py-2.5 hover:bg-slate-50/[0.12] dark:hover:bg-slate-850/[0.03] transition-all duration-150 border-b border-slate-100/50 dark:border-slate-800/30 ${
                        highlightDifferences && differs 
                          ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.015] border-l-[3px] border-l-amber-500/70' 
                          : 'border-l-[3px] border-l-transparent'
                      }`} 
                      style={{ gridTemplateColumns }}
                    >
                      <div className="px-7 text-xs font-bold text-slate-500 self-start pt-0.5 flex items-center gap-1.5 leading-snug">
                        <span>{label}</span>
                        {highlightDifferences && differs && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" title="Khác biệt" />
                        )}
                      </div>
                      {comparisonItems.map((p, idx) => (
                        <div 
                          key={p.id} 
                          className={`px-6 text-xs font-semibold text-slate-750 dark:text-slate-300 leading-relaxed break-words transition-colors ${
                            hoveredColIndex === idx ? 'bg-blue-500/[0.02] dark:bg-blue-400/[0.01] text-slate-900 dark:text-white font-extrabold' : ''
                          }`}
                        >
                          {getSpecValueForProduct(p, label)}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}

              {/* SECTION: MÔ TẢ TÓM TẮT */}
              <div className="bg-slate-50/70 dark:bg-slate-900/30 backdrop-blur-sm py-2 px-7 text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 border-l-[3px] border-l-blue-600 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                <span>Giới thiệu ngắn & Khuyến mãi</span>
              </div>

              {/* Row: Mô tả tóm tắt */}
              <div className="grid py-4" style={{ gridTemplateColumns }}>
                <div className="px-7 text-xs font-bold text-slate-500">Mô tả tóm tắt</div>
                {comparisonItems.map((p, idx) => (
                  <div 
                    key={p.id} 
                    className={`px-6 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium transition-colors ${
                      hoveredColIndex === idx ? 'bg-blue-500/[0.02] dark:bg-blue-400/[0.01]' : ''
                    }`}
                  >
                    {p.description || '—'}
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

        {isProductPickerOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[78vh] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-scale-up">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Chọn thêm sản phẩm</p>
                  <p className="text-[10px] font-semibold text-slate-400">
                    {lockedCategory ? `Chỉ hiển thị sản phẩm cùng danh mục ${lockedCategory}.` : 'Tìm sản phẩm để thêm vào bảng so sánh.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen(false)}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tìm theo tên, hãng, phân loại..."
                    className="w-full h-11 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-4 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-400 dark:focus:border-blue-700"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-[48vh] overflow-y-auto p-4">
                {loadingProducts ? (
                  <div className="h-40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : pickerProducts.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {pickerProducts.map((product) => {
                      const finalPrice = getProductFinalPrice(product);
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            addToComparison(product);
                            setProductSearch('');
                            if (comparisonItems.length >= 3) setIsProductPickerOpen(false);
                          }}
                          className="text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all p-3 flex items-center gap-3"
                        >
                          <div className="h-16 w-16 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden flex-shrink-0">
                            <img
                              src={product.images && product.images[0] ? product.images[0] : ""}
                              alt={product.name}
                              className="h-full w-full object-contain p-1"
                              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=120&auto=format&fit=crop"; }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-850 dark:text-slate-100 line-clamp-2">{product.name}</p>
                            <p className="mt-1 text-[10px] font-bold text-slate-400">{product.brand || product.category || 'Sản phẩm'}</p>
                            <p className="mt-1 text-[11px] font-black text-blue-600 dark:text-blue-400">{formatVND(finalPrice)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-center text-slate-400">
                    <Search className="h-7 w-7 mb-2" />
                    <p className="text-xs font-bold">Không tìm thấy sản phẩm phù hợp</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

