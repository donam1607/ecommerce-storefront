import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import RippleButton from "../components/RippleButton";
import { ShoppingCart, Star, ArrowLeft, Shield, Truck, RefreshCw, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { PRODUCTS } from "../data/products";
import { formatVND, toVndInt } from "../utils/money";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Scroll to top on product change
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
        console.error("Lỗi khi tải sản phẩm:", error);
        // Fallback: Tìm trong file PRODUCTS nếu API lỗi (giúp chạy local mượt hơn)
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 transition-colors duration-300">
        <div className="max-w-6xl mx-auto animate-fade-in">
          <div className="h-6 w-32 animate-shimmer rounded mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
            <div className="space-y-4">
              <div className="animate-shimmer aspect-square rounded-2xl w-full"></div>
              <div className="flex gap-3">
                <div className="animate-shimmer w-20 h-20 rounded-xl"></div>
                <div className="animate-shimmer w-20 h-20 rounded-xl"></div>
                <div className="animate-shimmer w-20 h-20 rounded-xl"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 w-24 animate-shimmer rounded"></div>
              <div className="h-8 w-3/4 animate-shimmer rounded"></div>
              <div className="h-4 w-40 animate-shimmer rounded"></div>
              <div className="h-16 w-full animate-shimmer rounded"></div>
              <div className="h-8 w-1/3 animate-shimmer rounded"></div>
              <div className="h-12 w-full animate-shimmer rounded-xl"></div>
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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Product not found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">The product you're looking for doesn't exist.</p>
        <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-500 transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    showToast(`Đã thêm thành công ${qty} sản phẩm "${product.name}" vào giỏ hàng!`, "success");
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    showToast(`Đã thêm "${product.name}" vào giỏ hàng! Đang chuyển hướng thanh toán...`, "info");
    navigate("/checkout");
  };

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8 text-sm font-medium">
          <ArrowLeft className="h-4 w-4" />
          Quay lại sản phẩm
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden aspect-square group">
              <img
                src={images[activeImage]}
                alt={`${product.name} - Image ${activeImage + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white dark:hover:bg-slate-700 hover:scale-110"
                  >
                    <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white dark:hover:bg-slate-700 hover:scale-110"
                  >
                    <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                  </button>
                </>
              )}
              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {activeImage + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      activeImage === i
                        ? "border-blue-500 ring-2 ring-blue-500/30 scale-105"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">{product.category}</span>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
                ))}
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{product.rating}</span>
              <span className="text-slate-400 dark:text-slate-500 text-sm">({product.reviews} đánh giá)</span>
            </div>

            <p className="text-slate-600 dark:text-slate-400 mb-6">{product.description}</p>

            {/* Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {product.specs.map((spec, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  {spec}
                </div>
              ))}
            </div>

            {/* Price & Actions */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{formatVND(product.price)}</span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Số lượng:</span>
              <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-slate-700 dark:text-slate-300"
                >−</button>
                <span className="px-4 py-2 font-bold text-slate-800 dark:text-white border-x border-slate-300 dark:border-slate-600">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-slate-700 dark:text-slate-300"
                >+</button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <RippleButton
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all cursor-pointer ${
                  added
                    ? "bg-emerald-500 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-850 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-[0.98]" 
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                {added ? "Đã thêm! ✓" : "Thêm vào giỏ"}
              </RippleButton>
              <RippleButton
                onClick={handleBuyNow}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-[0.98] text-center cursor-pointer"
              >
                Mua ngay
              </RippleButton>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col items-center text-center gap-1">
                <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">2-Year Warranty</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">30-Day Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
