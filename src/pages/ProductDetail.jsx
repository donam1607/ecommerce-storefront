import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import RippleButton from "../components/RippleButton";
import {
  ShoppingCart, Star, ArrowLeft, Shield, Truck, RefreshCw,
  ChevronLeft, ChevronRight, X, ZoomIn, Zap, Award
} from "lucide-react";
import { PRODUCTS } from "../data/products";
import { formatVND, toVndInt } from "../utils/money";

const getDisplaySpecs = (specs) => {
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
  if (Array.isArray(specs)) {
    return specs
      .map((value, index) => ({ key: `legacy-${index}`, label: `Thông số ${index + 1}`, value, unit: "", legacy: true }))
      .filter((field) => String(field.value).trim());
  }
  return [];
};

const formatSpecValue = (spec) => {
  const value = String(spec.value || '').trim();
  const unit = String(spec.unit || '').trim();
  if (!unit) return value;
  return value.toLowerCase().includes(unit.toLowerCase()) ? value : `${value} ${unit}`;
};

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const API_URL = "https://shoptech-backend.onrender.com";
        const response = await fetch(`${API_URL}/api/products/${id}`);
        if (!response.ok) throw new Error("Sản phẩm không tồn tại");
        const data = await response.json();
        setProduct({ ...data, price: toVndInt(data.price) });
      } catch (error) {
        const localProduct = PRODUCTS.find(p => p.id === parseInt(id));
        setProduct(localProduct ? { ...localProduct, price: toVndInt(localProduct.price) } : null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-slate-950 dark:to-slate-950 py-8 px-4">
        <div className="max-w-6xl mx-auto animate-fade-in">
          <div className="h-6 w-32 animate-shimmer rounded-xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white/80 dark:bg-slate-900/80 rounded-3xl p-8 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="animate-shimmer aspect-square rounded-2xl w-full" />
              <div className="flex gap-3">
                {[...Array(3)].map((_, i) => <div key={i} className="animate-shimmer w-20 h-20 rounded-xl" />)}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 w-24 animate-shimmer rounded-xl" />
              <div className="h-8 w-3/4 animate-shimmer rounded-xl" />
              <div className="h-4 w-40 animate-shimmer rounded-xl" />
              <div className="h-16 w-full animate-shimmer rounded-xl" />
              <div className="h-10 w-1/3 animate-shimmer rounded-xl" />
              <div className="h-14 w-full animate-shimmer rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <p className="text-6xl mb-4">🔍</p>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Không tìm thấy sản phẩm</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Sản phẩm bạn tìm không tồn tại hoặc đã bị xóa.</p>
        <Link to="/" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const hasDiscount = product.discount > 0 || (product.discountedPrice !== null && product.discountedPrice !== undefined);
  const salePrice = hasDiscount
    ? (product.discountedPrice !== null && product.discountedPrice !== undefined
        ? toVndInt(product.discountedPrice)
        : Math.floor(product.price * (1 - product.discount / 100)))
    : product.price;
  const displaySpecs = getDisplaySpecs(product.specs);

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    showToast(`Đã thêm thành công ${qty} sản phẩm "${product.name}" vào giỏ hàng!`, "success");
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    navigate("/checkout");
  };

  const nextImage = () => setActiveImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + images.length) % images.length);
  const openLightbox = (index = activeImage) => { setActiveImage(index); setIsLightboxOpen(true); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/10 to-indigo-50/5 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 py-8 px-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all mb-8 text-sm font-semibold hover:gap-3 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Quay lại sản phẩm
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/30 dark:shadow-slate-950/30 border border-white/60 dark:border-slate-800/50 transition-colors duration-300">

          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div
              role="button" tabIndex={0}
              onClick={() => openLightbox(activeImage)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(activeImage); } }}
              className="relative bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden aspect-square group w-full text-left cursor-zoom-in border border-slate-200/30 dark:border-slate-700/30"
              aria-label="Xem ảnh sản phẩm toàn màn hình"
            >
              <img
                src={images[activeImage]}
                alt={`${product.name} - Image ${activeImage + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Zoom indicator */}
              <div className="absolute top-3 right-3 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                <ZoomIn className="h-4 w-4" />
              </div>
              {/* Discount badge */}
              {product.discount > 0 && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-lg">
                  -{product.discount}% OFF
                </div>
              )}
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button type="button" onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer">
                    <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer">
                    <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                  </button>
                </>
              )}
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                  {activeImage + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto px-1 py-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => openLightbox(i)}
                    className={`group/thumb flex-shrink-0 w-18 h-18 rounded-xl border-2 p-1 transition-all duration-200 cursor-pointer ${
                      activeImage === i
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md shadow-blue-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 opacity-65 hover:opacity-100 hover:border-blue-300"
                    }`} aria-label={`Chọn ảnh ${i + 1}`}>
                    <span className="block h-full w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="flex flex-col justify-start">
            {/* Category + HOT badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/40">
                {product.category}
              </span>
              {product.isHot && (
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/40 flex items-center gap-1">
                  <Award className="h-3 w-3" /> HOT
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3 leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`} />
                ))}
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{product.rating}</span>
              <span className="text-slate-400 dark:text-slate-500 text-sm">({product.reviews} đánh giá)</span>
            </div>

            <p className="text-slate-600 dark:text-slate-400 mb-5 text-sm leading-relaxed">{product.description}</p>

            {/* Specs */}
            {displaySpecs.length > 0 && (
              <div className="mb-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white">Thông số kỹ thuật</h2>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Các cấu hình chính của sản phẩm</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300 text-[10px] font-black">
                    {displaySpecs.length} mục
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displaySpecs.map((spec) => (
                    <div key={spec.key} className="grid grid-cols-[40%_1fr] sm:grid-cols-[32%_1fr] hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="min-w-0 px-4 py-3 bg-slate-50/70 dark:bg-slate-800/35 border-l-2 border-blue-500">
                        <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                          {spec.legacy ? "Nổi bật" : spec.label}
                        </span>
                      </div>
                      <p className="px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                        {formatSpecValue(spec)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-end gap-4 mb-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800/40 dark:to-blue-950/20 rounded-2xl border border-slate-100 dark:border-slate-700/40">
              {hasDiscount ? (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                      {formatVND(salePrice)}
                    </span>
                    {product.discount > 0 && (
                      <span className="text-xs text-red-500 font-extrabold bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded-lg border border-red-100 dark:border-red-900/30">
                        -{product.discount}% OFF
                      </span>
                    )}
                  </div>
                  {product.discount > 0 && (
                    <span className="text-sm text-slate-400 line-through font-medium">{formatVND(product.price)}</span>
                  )}
                </div>
              ) : (
                <span className="text-3xl font-black text-slate-900 dark:text-white">{formatVND(product.price)}</span>
              )}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Số lượng:</span>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-slate-700 dark:text-slate-300 cursor-pointer">−</button>
                <span className="px-4 py-2.5 font-black text-slate-800 dark:text-white border-x border-slate-200 dark:border-slate-700 min-w-[3rem] text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-3 py-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-slate-700 dark:text-slate-300 cursor-pointer">+</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <RippleButton
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                  added
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:scale-[1.01] active:scale-[0.98]"
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                {added ? "Đã thêm! ✓" : "Thêm vào giỏ"}
              </RippleButton>
              <RippleButton
                onClick={handleBuyNow}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] text-center cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="h-4.5 w-4.5" />
                Mua ngay
              </RippleButton>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              {[
                { icon: Truck, label: "Giao hàng siêu tốc", sub: "2h nội thành", color: "text-blue-500" },
                { icon: Shield, label: "Bảo hành 2 năm", sub: "Đổi mới linh hoạt", color: "text-emerald-500" },
                { icon: RefreshCw, label: "Đổi trả 30 ngày", sub: "Hoàn tiền 100%", color: "text-amber-500" },
              ].map(({ icon: Icon, label, sub, color }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold leading-tight">{label}</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && images[activeImage] && (
        <div
          className="fixed inset-0 z-[100000] bg-slate-950/97 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button type="button" onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 z-20 w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-110"
            aria-label="Đóng ảnh">
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-110">
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-110">
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}

          <div className="max-w-6xl max-h-[88vh] w-full h-full flex items-center justify-center">
            <img
              src={images[activeImage]}
              alt={`${product.name} - Full ${activeImage + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain rounded-2xl"
            />
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full">
              {activeImage + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
