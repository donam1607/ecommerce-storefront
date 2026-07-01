import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useComparison } from "../context/ComparisonContext";
import RippleButton from "../components/RippleButton";
import {
  ShoppingCart, Star, ArrowLeft, Shield, Truck, RefreshCw,
  ChevronLeft, ChevronRight, X, ZoomIn, Zap, Award, GitCompare,
  BookOpen, MessageSquare, List, Send, CheckCircle, Flame
} from "lucide-react";
import { PRODUCTS } from "../data/products";
import { formatVND, toVndInt } from "../utils/money";
import { authHeaders } from "../utils/api";
import { trackUserEvent } from "../utils/analytics";

const API_URL = "https://shoptech-backend.onrender.com";

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

  // 3. Array-like object mode (e.g. { "0": "Intel i5", "1": "85GB" })
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

const renderMarkdown = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  
  const pushCurrentList = (key) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-6 my-4 space-y-2 text-slate-700 dark:text-slate-350 font-medium text-sm sm:text-base">
          {currentList.map((item, idx) => (
            <li key={idx} className="leading-relaxed">{parseInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const parseInlineMarkdown = (inlineText) => {
    const parts = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(inlineText)) !== null) {
      const before = inlineText.substring(lastIndex, match.index);
      if (before) parts.push(before);
      parts.push(<strong key={match.index} className="font-extrabold text-slate-900 dark:text-white">{match[1]}</strong>);
      lastIndex = regex.lastIndex;
    }
    
    const after = inlineText.substring(lastIndex);
    if (after) parts.push(after);
    
    return parts.length > 0 ? parts : inlineText;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check list item
    if (line.startsWith('* ') || line.startsWith('- ')) {
      currentList.push(line.substring(2));
      continue;
    }
    
    // If not a list item, push any existing list first
    pushCurrentList(i);
    
    if (line === '') {
      continue;
    }
    
    // Check Headers
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-7 mb-4 leading-snug border-b border-slate-100 dark:border-slate-800 pb-2">
          {parseInlineMarkdown(line.substring(2))}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-6 mb-3.5 leading-snug">
          {parseInlineMarkdown(line.substring(3))}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-5 mb-3 leading-snug">
          {parseInlineMarkdown(line.substring(4))}
        </h3>
      );
    } else {
      // Regular paragraph
      elements.push(
        <p key={i} className="text-slate-700 dark:text-slate-350 font-medium text-sm sm:text-base leading-relaxed mb-4">
          {parseInlineMarkdown(lines[i])}
        </p>
      );
    }
  }
  
  // Push remaining list if any
  pushCurrentList('end');
  
  return <div className="space-y-1">{elements}</div>;
};

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { addToComparison, isCompared } = useComparison();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [magnifier, setMagnifier] = useState({ visible: false, x: 0, y: 0, sourceX: 0, sourceY: 0, width: 0, height: 0 });
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Reviews States
  const [reviewsData, setReviewsData] = useState({ reviews: [], pagination: {}, summary: { avgRating: 0, totalCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } });
  const [reviewsPage, setReviewsPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newName, setNewName] = useState("");
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Analysis States
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);
  const [editedAnalysisContent, setEditedAnalysisContent] = useState("");
  const [savingAnalysis, setSavingAnalysis] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(true);
  const [canReviewProduct, setCanReviewProduct] = useState(false);
  const [checkingReviewEligibility, setCheckingReviewEligibility] = useState(false);

  // Similar Products States
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // User States
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch product core data
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/products/${id}`);
        if (!response.ok) throw new Error("Sản phẩm không tồn tại");
        const data = await response.json();
        const normProduct = { ...data, price: toVndInt(data.price) };
        setProduct(normProduct);
        
        // Fetch extra insights
        fetchReviews(id, 1);
        fetchAnalysis(id);
        fetchReviewEligibility(id);
        fetchSimilarProducts(id, normProduct);
        trackUserEvent('view_product', {
          productId: normProduct.id,
          metadata: { name: normProduct.name, category: normProduct.category, price: normProduct.price },
        });
      } catch (error) {
        const localProduct = PRODUCTS.find(p => p.id === parseInt(id));
        if (localProduct) {
          const normProduct = { ...localProduct, price: toVndInt(localProduct.price) };
          setProduct(normProduct);
          fetchSimilarProducts(id, normProduct);
          trackUserEvent('view_product', {
            productId: normProduct.id,
            metadata: { name: normProduct.name, category: normProduct.category, price: normProduct.price },
          });
        } else {
          setProduct(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Fetch reviews list
  const fetchReviews = async (productId, page = 1) => {
    setLoadingReviews(true);
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}/reviews?page=${page}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setReviewsData(data);
        setReviewsPage(page);
      }
    } catch (error) {
      console.error("Fetch reviews error:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch analysis article
  const fetchAnalysis = async (productId) => {
    setLoadingAnalysis(true);
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}/analysis`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
        setEditedAnalysisContent(data.content || "");
      }
    } catch (error) {
      console.error("Fetch analysis error:", error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const fetchReviewEligibility = async (productId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCanReviewProduct(false);
      return;
    }
    setCheckingReviewEligibility(true);
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}/reviews/eligibility`, {
        headers: authHeaders(),
      });
      const data = response.ok ? await response.json() : {};
      setCanReviewProduct(!!data.canReview);
    } catch {
      setCanReviewProduct(false);
    } finally {
      setCheckingReviewEligibility(false);
    }
  };

  // Fetch similar products
  const fetchSimilarProducts = async (productId, currentProduct) => {
    if (!currentProduct) return;
    setLoadingSimilar(true);
    try {
      const response = await fetch(`${API_URL}/api/products`);
      if (response.ok) {
        const data = await response.json();
        const filtered = data
          .filter(p => p.id !== currentProduct.id && p.category === currentProduct.category)
          .slice(0, 8);
        setSimilarProducts(filtered.map(p => ({ ...p, price: toVndInt(p.price) })));
      } else {
        // Fallback local products
        const filtered = PRODUCTS
          .filter(p => p.id !== currentProduct.id && p.category === currentProduct.category)
          .slice(0, 8);
        setSimilarProducts(filtered.map(p => ({ ...p, price: toVndInt(p.price) })));
      }
    } catch (error) {
      console.error("Fetch similar products error:", error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Submit new review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newRating) return;
    if (!canReviewProduct) {
      showToast("Bạn cần đăng nhập bằng tài khoản đã mua và nhận sản phẩm này để đánh giá.", "error");
      return;
    }
    setSubmittingReview(true);
    try {
      const payload = {
        rating: newRating,
        comment: newComment.trim(),
      };

      const response = await fetch(`${API_URL}/api/products/${id}/reviews`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast("Đánh giá của bạn đã được gửi thành công!", "success");
        setNewComment("");
        setNewName("");
        fetchReviews(id, 1);
        
        // Refresh product rating
        const prodRes = await fetch(`${API_URL}/api/products/${id}`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProduct(prev => ({ ...prev, rating: prodData.rating, reviews: prodData.reviews }));
        }
      } else {
        const err = await response.json().catch(() => ({}));
        showToast(err.message || "Gửi đánh giá thất bại", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối khi gửi đánh giá", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Update/Save Analysis
  const handleSaveAnalysis = async () => {
    setSavingAnalysis(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/products/${id}/analysis`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: editedAnalysisContent })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
        setIsEditingAnalysis(false);
        showToast("Đã lưu bài viết phân tích thành công!", "success");
      } else {
        const err = await response.json().catch(() => ({}));
        showToast(err.message || "Lưu thất bại. Vui lòng thử lại.", "error");
      }
    } catch (error) {
      showToast("Lỗi lưu dữ liệu phân tích", "error");
    } finally {
      setSavingAnalysis(false);
    }
  };

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
        <Link to="/" className="bg-gradient-to-r from-blue-600 to-indigo-650 text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20">
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
    trackUserEvent('buy_now', {
      productId: product.id,
      metadata: { name: product.name, price: salePrice, quantity: qty },
    });
    for (let i = 0; i < qty; i++) addToCart(product);
    navigate("/checkout");
  };

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % images.length);
    setMagnifier((prev) => ({ ...prev, visible: false }));
  };
  const prevImage = () => {
    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
    setMagnifier((prev) => ({ ...prev, visible: false }));
  };
  const openLightbox = (index = activeImage) => {
    setActiveImage(index);
    setMagnifier((prev) => ({ ...prev, visible: false }));
    setIsLightboxOpen(true);
  };
  const handleMagnifierMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const sourceX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const sourceY = Math.max(0, Math.min(event.clientY - rect.top, rect.height));
    const lensRadius = 80;
    setMagnifier({
      visible: true,
      x: Math.max(lensRadius, Math.min(sourceX, rect.width - lensRadius)),
      y: Math.max(lensRadius, Math.min(sourceY, rect.height - lensRadius)),
      sourceX,
      sourceY,
      width: rect.width,
      height: rect.height,
    });
  };

  const selectThumbnail = (index) => {
    setActiveImage(index);
    setMagnifier((prev) => ({ ...prev, visible: false }));
  };

  // Helper values for review summary
  const summary = reviewsData.summary || { avgRating: product.rating, totalCount: product.reviews, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const totalCount = summary.totalCount || 0;
  const avgRating = summary.avgRating || product.rating || 0;
  const distribution = summary.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

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

        {/* TOP: Images + Essential Info Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/30 dark:shadow-slate-955/30 border border-white/60 dark:border-slate-800/50 transition-colors duration-300 mb-10">

          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div
              role="button" tabIndex={0}
              onClick={() => openLightbox(activeImage)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(activeImage); } }}
              onMouseMove={handleMagnifierMove}
              onMouseLeave={() => setMagnifier((prev) => ({ ...prev, visible: false }))}
              className="relative bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden aspect-square group w-full text-left cursor-zoom-in border border-slate-200/30 dark:border-slate-700/30"
              aria-label="Xem ảnh sản phẩm toàn màn hình"
            >
              <img
                src={images[activeImage]}
                alt={`${product.name} - Image ${activeImage + 1}`}
                className="w-full h-full object-cover"
              />
              {magnifier.visible && images[activeImage] && (
                <div
                  className="hidden sm:block absolute z-10 w-40 h-40 rounded-full overflow-hidden border-2 border-white/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-955/35 pointer-events-none"
                  style={{ left: magnifier.x - 80, top: magnifier.y - 80 }}
                  aria-hidden="true"
                >
                  <img
                    src={images[activeImage]}
                    alt=""
                    className="absolute max-w-none object-cover"
                    style={{
                      width: magnifier.width,
                      height: magnifier.height,
                      left: 80 - magnifier.sourceX * 2.5,
                      top: 80 - magnifier.sourceY * 2.5,
                      transform: "scale(2.5)",
                      transformOrigin: "top left",
                    }}
                  />
                </div>
              )}
              {/* Zoom indicator */}
              <div className="absolute top-3 right-3 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                <ZoomIn className="h-4 w-4" />
              </div>
              {/* Discount badge */}
              {product.discount > 0 && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-lg animate-pulse">
                  -{product.discount}% OFF
                </div>
              )}
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button type="button" onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer">
                    <ChevronLeft className="h-5 w-5 text-slate-755 dark:text-slate-200" />
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer">
                    <ChevronRight className="h-5 w-5 text-slate-755 dark:text-slate-200" />
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
              <div className="flex gap-2.5 overflow-x-auto px-1 py-1 scrollbar-none">
                {images.map((img, i) => (
                  <button key={i} onClick={() => selectThumbnail(i)}
                    className={`group/thumb flex-shrink-0 w-16 h-16 rounded-xl border-2 p-1 transition-all duration-200 cursor-pointer ${
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

            {/* Rating summary clickable jump to reviews block below */}
            <button
              onClick={() => {
                document.getElementById("detail-reviews-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-2 mb-4 w-fit hover:opacity-85"
            >
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(avgRating) ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`} />
                ))}
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{avgRating}</span>
              <span className="text-slate-400 dark:text-slate-500 text-sm">({totalCount} đánh giá)</span>
            </button>

            <p className="text-slate-600 dark:text-slate-400 mb-5 text-sm leading-relaxed">{product.description}</p>

            {/* Specifications - placed right below name/desc as user requested */}
            {displaySpecs.length > 0 && (
              <div className="mb-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white">Thông số kỹ thuật</h2>
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
                          {spec.legacy ? "Cấu hình" : spec.label}
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

            {/* Price section */}
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
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] text-center cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="h-4.5 w-4.5" />
                Mua ngay
              </RippleButton>
            </div>

            {/* Compare Button */}
            <RippleButton
              onClick={() => addToComparison(product)}
              className={`compare-toggle-btn w-full mt-3 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                isCompared(product?.id)
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white border-transparent shadow-lg shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.98]'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:scale-[1.01] active:scale-[0.98]'
              }`}
            >
              <GitCompare className="h-4.5 w-4.5" />
              <span>{isCompared(product?.id) ? "Đã chọn so sánh (Hủy)" : "Thêm vào danh sách so sánh"}</span>
            </RippleButton>

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              {[
                { icon: Truck, label: "Giao hàng siêu tốc", sub: "2h nội thành", color: "text-blue-500" },
                { icon: Shield, label: "Bảo hành 2 năm", sub: "Đổi mới linh hoạt", color: "text-emerald-500" },
                { icon: RefreshCw, label: "Đổi trả 30 ngày", sub: "Hoàn tiền 100%", color: "text-amber-500" },
              ].map(({ icon: Icon, label, sub, color }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <span className="text-[10px] text-slate-700 dark:text-slate-350 font-bold leading-tight">{label}</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM: Premium Column Sections (Analysis, then Reviews) */}
        <div className="space-y-8 mb-12 animate-fade-in">
          
          {/* Block 1: Analysis Article */}
          <div id="detail-analysis-section" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl overflow-hidden">
            {/* Collapsible Toggle Header */}
            <button
              type="button"
              onClick={() => setIsAnalysisOpen(v => !v)}
              className="w-full flex items-center justify-between p-6 sm:p-8 text-left cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
            >
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-500" /> Bài phân tích chuyên sâu từ Tech Lead
                </h3>
                <p className="text-xs text-slate-500 mt-1">Đọc bài đánh giá, phân tích tính năng và lời khuyên sử dụng thực tế.</p>
              </div>
              <ChevronRight className={`h-5 w-5 text-slate-400 flex-shrink-0 ml-4 transition-transform duration-300 ${isAnalysisOpen ? "rotate-90" : ""}`} />
            </button>

            {/* Collapsible Content */}
            {isAnalysisOpen && (
              <div className="border-t border-slate-100 dark:border-slate-800/80 px-6 sm:px-8 pb-8 pt-6 space-y-6">
                {/* Edit button — admins only */}
                {currentUser?.role === "admin" && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsEditingAnalysis(!isEditingAnalysis)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      {isEditingAnalysis ? "Hủy chỉnh sửa" : "Chỉnh sửa bài viết (Admin)"}
                    </button>
                  </div>
                )}

                {/* Edit Form */}
                {isEditingAnalysis ? (
                  <div className="space-y-4 max-w-4xl">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Nội dung bài viết (Hỗ trợ xuống dòng tự động)</label>
                      <textarea
                        rows={14}
                        value={editedAnalysisContent}
                        onChange={(e) => setEditedAnalysisContent(e.target.value)}
                        placeholder="Nhập nội dung phân tích chi tiết sản phẩm, các ưu và nhược điểm thực tế..."
                        className="w-full p-4 border border-slate-250 dark:border-slate-750 bg-white dark:bg-slate-955 text-slate-800 dark:text-white rounded-2xl focus:outline-none focus:border-blue-500 text-sm font-medium leading-relaxed shadow-inner"
                      />
                    </div>
                    <div className="flex gap-2">
                      <RippleButton
                        onClick={handleSaveAnalysis}
                        disabled={savingAnalysis}
                        className="bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl cursor-pointer"
                      >
                        {savingAnalysis ? "Đang lưu..." : "Lưu bài viết"}
                      </RippleButton>
                      <button
                        onClick={() => { setIsEditingAnalysis(false); setEditedAnalysisContent(analysis?.content || ""); }}
                        className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-355 text-xs font-black uppercase tracking-wider rounded-xl hover:opacity-90"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Content */
                  <div className="max-w-3xl leading-relaxed text-sm sm:text-base">
                    {loadingAnalysis ? (
                      <div className="space-y-3">
                        <div className="h-4 bg-slate-100 dark:bg-slate-855 rounded w-full animate-shimmer" />
                        <div className="h-4 bg-slate-100 dark:bg-slate-855 rounded w-5/6 animate-shimmer" />
                        <div className="h-4 bg-slate-100 dark:bg-slate-855 rounded w-2/3 animate-shimmer" />
                      </div>
                    ) : analysis?.content ? (
                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        {renderMarkdown(analysis.content)}
                      </div>
                    ) : (
                      <div className="text-center py-12 flex flex-col items-center">
                        <span className="text-4xl mb-3">📝</span>
                        <h4 className="font-extrabold text-slate-700 dark:text-white text-sm mb-1">Chưa có bài phân tích chuyên sâu</h4>
                        <p className="text-slate-400 dark:text-slate-500 text-xs max-w-xs">Đội ngũ kỹ thuật đang cập nhật bài viết chi tiết trải nghiệm thực tế cho sản phẩm này.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Block 2: Reviews */}
          <div id="detail-reviews-section" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl overflow-hidden">
            {/* Collapsible Toggle Header */}
            <button
              type="button"
              onClick={() => setIsReviewsOpen(v => !v)}
              className="w-full flex items-center justify-between p-6 sm:p-8 text-left cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
            >
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-indigo-500" /> Đánh giá &amp; Phản hồi khách hàng ({totalCount})
                </h3>
                <p className="text-xs text-slate-500 mt-1">Xem phản hồi thực tế từ những khách hàng đã sở hữu sản phẩm.</p>
              </div>
              <ChevronRight className={`h-5 w-5 text-slate-400 flex-shrink-0 ml-4 transition-transform duration-300 ${isReviewsOpen ? "rotate-90" : ""}`} />
            </button>

            {/* Collapsible Content */}
            {isReviewsOpen && (
            <div className="border-t border-slate-100 dark:border-slate-800/80 px-6 sm:px-8 pb-8 pt-6 animate-fade-in space-y-8">

              {/* Top Rating Summary Banner */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/40">
                <div className="md:col-span-4 flex flex-col items-center justify-center text-center md:border-r border-slate-200 dark:border-slate-800 pr-0 md:pr-6">
                  <span className="text-5xl font-black text-slate-900 dark:text-white">{avgRating}</span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">Điểm đánh giá chung</span>
                  <div className="flex mt-2 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4.5 w-4.5 ${i < Math.round(avgRating) ? "fill-amber-400 text-amber-450" : "text-slate-250 dark:text-slate-700"}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Dựa trên {totalCount} phản hồi</span>
                </div>

                <div className="md:col-span-8 space-y-2.5">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Phân tích xếp hạng</span>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = distribution[stars] || 0;
                    const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="w-10 font-bold text-slate-500 dark:text-slate-400 flex items-center gap-0.5 justify-end">
                          {stars} <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        </span>
                        <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-450 to-orange-400 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="w-8 text-right font-extrabold text-slate-600 dark:text-slate-355">{percent}%</span>
                        <span className="w-10 text-slate-400 text-[10px]">({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submitting form (Shopee style rating entry) */}
              {canReviewProduct ? (
              <form onSubmit={handleSubmitReview} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-0.5">Viết đánh giá của bạn</h4>
                  <p className="text-[11px] text-slate-500">Ý kiến đóng góp quý báu giúp ShopTech liên tục tối ưu hóa chất lượng phục vụ.</p>
                </div>

                {/* Rating Selector */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400">Chọn số sao:</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="hover:scale-125 transition-transform duration-100 cursor-pointer"
                      >
                        <Star className={`h-6 w-6 ${star <= newRating ? "fill-amber-400 text-amber-400" : "text-slate-250 dark:text-slate-700"}`} />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-black text-amber-500 uppercase tracking-widest">
                    {newRating === 5 && "Cực kỳ hài lòng"}
                    {newRating === 4 && "Hài lòng"}
                    {newRating === 3 && "Bình thường"}
                    {newRating === 2 && "Chưa hài lòng"}
                    {newRating === 1 && "Rất không hài lòng"}
                  </span>
                </div>

                {/* Anonymous Guest Name input (only if guest) */}
                {!currentUser && (
                  <div className="max-w-md">
                    <label className="block text-xs font-black text-slate-500 uppercase mb-1">Tên của bạn (Tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="Nhập tên hiển thị (mặc định: Ẩn danh)"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold text-slate-800 dark:text-white"
                    />
                  </div>
                )}

                {/* Review comment */}
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">Bình luận, trải nghiệm thực tế (Tùy chọn)</label>
                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Bàn phím gõ êm, màn hình sắc nét, máy hơi nóng khi chơi game nặng..."
                    className="w-full p-4 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-800 dark:text-white"
                  />
                </div>

                <RippleButton
                  type="submit"
                  disabled={submittingReview}
                  className="bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10 active:scale-95"
                >
                  <Send className="h-3.5 w-3.5" />
                  {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                </RippleButton>
              </form>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                    Đánh giá chỉ dành cho khách đã mua
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    {checkingReviewEligibility
                      ? "Đang kiểm tra quyền đánh giá..."
                      : currentUser
                        ? "Tài khoản này chưa có đơn đã giao thành công chứa sản phẩm này. Bạn vẫn có thể xem đánh giá của khách hàng khác bên dưới."
                        : "Vui lòng đăng nhập bằng tài khoản đã mua và nhận sản phẩm này để viết đánh giá. Bạn vẫn có thể xem đánh giá của khách hàng khác bên dưới."}
                  </p>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Tất cả đánh giá khách hàng</h4>

                {loadingReviews ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-shimmer p-4 rounded-xl space-y-2.5">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                      </div>
                    ))}
                  </div>
                ) : reviewsData.reviews && reviewsData.reviews.length > 0 ? (
                  <>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {reviewsData.reviews.map((rev) => (
                        <div key={rev.id} className="py-4 first:pt-0 space-y-1.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-800 dark:text-white text-xs sm:text-sm">{rev.name}</span>
                              {rev.badge === "verified" && (
                                <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                                  <CheckCircle className="h-2.5 w-2.5 fill-emerald-500/10" /> Đã mua hàng
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-405 font-bold">
                              {new Date(rev.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>

                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < rev.rating ? "fill-amber-400 text-amber-450" : "text-slate-250 dark:text-slate-700"}`} />
                            ))}
                          </div>

                          {rev.comment ? (
                            <p className="text-xs sm:text-sm text-slate-750 dark:text-slate-355 leading-relaxed font-semibold">{rev.comment}</p>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">Khách hàng không để lại bình luận chi tiết.</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {reviewsData.pagination?.totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 pt-4">
                        <button
                          disabled={reviewsPage === 1}
                          onClick={() => fetchReviews(id, reviewsPage - 1)}
                          className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-40 cursor-pointer text-slate-600 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-850"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-xs font-black text-slate-600 dark:text-slate-355">Trang {reviewsPage} / {reviewsData.pagination.totalPages}</span>
                        <button
                          disabled={reviewsPage === reviewsData.pagination.totalPages}
                          onClick={() => fetchReviews(id, reviewsPage + 1)}
                          className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-40 cursor-pointer text-slate-600 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-855"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!</p>
                )}
              </div>
            </div>
            )}
          </div>
        </div>

        {/* SECTION: Similar Products carousel (cùng danh mục) */}
        {similarProducts.length > 0 && (
          <div className="mt-8 mb-12 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="h-5 w-5 text-red-500 animate-pulse" /> Các sản phẩm tương tự
                </h3>
                <p className="text-xs text-slate-500 mt-1">Khám phá các sản phẩm cùng phân khúc bạn có thể quan tâm.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 pt-2 pb-2">
              {similarProducts.map((simProd) => {
                const simHasDiscount = simProd.discount > 0 || (simProd.discountedPrice !== null && simProd.discountedPrice !== undefined);
                const simSalePrice = simHasDiscount
                  ? (simProd.discountedPrice !== null && simProd.discountedPrice !== undefined
                      ? toVndInt(simProd.discountedPrice)
                      : Math.floor(simProd.price * (1 - simProd.discount / 100)))
                  : simProd.price;
                return (
                  <div key={simProd.id} className="min-w-0">
                    <Link
                      to={`/product/${simProd.id}`}
                      className="group/card block bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col relative h-full"
                      style={{ willChange: 'transform', transform: 'translateY(0)', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 32px -8px rgba(59,130,246,0.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                    >
                      {/* Glint hover effect */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20">
                        <div className="absolute top-0 -left-[150%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent skew-x-[-25deg] transition-all duration-1000 ease-out group-hover/card:left-[150%]" />
                      </div>

                      {/* Image */}
                      <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 aspect-[4/3]">
                        <img
                          src={simProd.images && simProd.images[0] ? simProd.images[0] : ""}
                          alt={simProd.name}
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100&auto=format&fit=crop" }}
                        />
                        {simProd.badge && (
                          <span className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                            {simProd.badge}
                          </span>
                        )}
                        {simProd.discount > 0 && (
                          <span className="absolute top-2 right-2 z-10 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                            -{simProd.discount}%
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-2 sm:p-3 flex-grow flex flex-col gap-1.5">
                        <div className="flex-grow">
                          <div className="min-h-[50px] sm:min-h-[58px]">
                          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors line-clamp-2 text-[11px] sm:text-sm leading-snug">
                            {simProd.name}
                          </h4>
                          {simProd.description && (
                            <p className="mt-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">{simProd.description}</p>
                          )}
                          </div>
                          <div className="flex items-center gap-1 pt-0.5">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                            <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{simProd.rating || 0}</span>
                            <span className="text-[8px] text-slate-400">({simProd.reviews || 0})</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="min-h-[34px] sm:min-h-[38px] flex flex-col justify-start">
                          {simHasDiscount ? (
                            <>
                              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">{formatVND(simSalePrice)}</span>
                              <span className={`text-[9px] sm:text-[10px] text-slate-400 line-through leading-tight ${simProd.discount > 0 ? "" : "opacity-0 select-none"}`}>
                                {formatVND(simProd.price)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">{formatVND(simProd.price)}</span>
                              <span className="text-[9px] sm:text-[10px] leading-tight opacity-0 select-none" aria-hidden="true">{formatVND(simProd.price)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
