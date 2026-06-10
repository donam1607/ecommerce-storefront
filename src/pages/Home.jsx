import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import RippleButton from "../components/RippleButton";
import ScrollReveal from "../components/ScrollReveal";
import { 
  ShoppingCart, Star, Search, Cpu, Monitor, Keyboard, Headphones, 
  Smartphone, Battery, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, Check, X,
  Flame, ShieldCheck, HelpCircle, Truck, ArrowRight, TrendingUp, Sparkles, Award, WifiOff, Loader2
} from "lucide-react";

import { formatVND, toVndInt } from "../utils/money";
import { fetchWithRetry, API_BASE } from "../utils/api";

const CATEGORIES_ICONS = {
  "laptop": Cpu,
  "monitor": Monitor,
  "keyboard": Keyboard,
  "headphones": Headphones,
  "smartphone": Smartphone,
  "accessories": Battery
};

const CATEGORIES_GRADIENTS = {
  "laptop": "from-blue-500/10 to-indigo-500/10 hover:border-blue-500/30 text-blue-600 dark:text-blue-400",
  "monitor": "from-emerald-500/10 to-teal-500/10 hover:border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
  "keyboard": "from-amber-500/10 to-orange-500/10 hover:border-amber-500/30 text-amber-600 dark:text-amber-400",
  "headphones": "from-purple-500/10 to-pink-500/10 hover:border-purple-500/30 text-purple-600 dark:text-purple-400",
  "smartphone": "from-rose-500/10 to-red-500/10 hover:border-rose-500/30 text-rose-600 dark:text-rose-400",
  "accessories": "from-cyan-500/10 to-blue-500/10 hover:border-cyan-500/30 text-cyan-600 dark:text-cyan-400"
};

const getBadgeClass = (badge) => {
  if (!badge) return "";
  const b = badge.toLowerCase().trim();
  if (b.includes("like new") || b.includes("likenew") || b.includes("99%") || b.includes("98%") || b.includes("95%")) {
    return "bg-indigo-600 text-white border border-indigo-400";
  }
  if (b.includes("bảo hành") || b.includes("bao hanh") || b.includes("warranty") || b.includes("bh")) {
    return "bg-teal-600 text-white border border-teal-400";
  }
  if (b.includes("old") || b.includes("cũ") || b.includes("cu") || b.includes("used") || b.includes("lướt")) {
    return "bg-slate-500 text-white border border-slate-400";
  }
  if (b.includes("new") || b.includes("mới") || b.includes("moi")) {
    return "bg-emerald-600 text-white border border-emerald-400";
  }
  if (b.includes("best") || b.includes("bán chạy") || b.includes("ban chay") || b.hot) {
    return "bg-amber-500 text-white border border-amber-400";
  }
  if (b.includes("top") || b.includes("vip") || b.includes("gaming") || b.includes("pro")) {
    return "bg-purple-600 text-white border border-purple-400";
  }
  if (b.includes("sale") || b.includes("giảm giá") || b.includes("giam gia") || b.includes("off") || b.includes("khuyến mãi") || b.includes("khuyen mai")) {
    return "bg-red-600 text-white border border-red-400";
  }
  return "bg-blue-600 text-white border border-blue-400";
};

const isPromotionalProduct = (product) => {
  const hasDiscountPercent = product.discount > 0;
  const hasLowerDiscountedPrice =
    product.discountedPrice !== null &&
    product.discountedPrice !== undefined &&
    toVndInt(product.discountedPrice) < toVndInt(product.price);
  const badge = product.badge ? product.badge.toLowerCase() : "";
  const hasPromoBadge =
    badge.includes("sale") ||
    badge.includes("off") ||
    badge.includes("giảm giá") ||
    badge.includes("giam gia") ||
    badge.includes("khuyến mãi") ||
    badge.includes("khuyen mai") ||
    badge.includes("ưu đãi") ||
    badge.includes("uu dai");

  return hasDiscountPercent || hasLowerDiscountedPrice || hasPromoBadge;
};

export default function Home() {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverWaking, setServerWaking] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [categories, setCategories] = useState(["Laptop", "Monitor", "Keyboard", "Headphones", "Smartphone", "Accessories"]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeBrand, setActiveBrand] = useState("All");
  const [activeSubCategory, setActiveSubCategory] = useState("All");
  const [activeCondition, setActiveCondition] = useState("All");
  const [promoOnly, setPromoOnly] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const navigate = useNavigate();
  const flashTrackRef = useRef(null);

  // Sorting & Price Range States
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState("all");
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null); // 'category' | 'condition' | 'price' | 'sort' | null

  // Search parameters from URL
  const [searchParams, setSearchParams] = useSearchParams();
  const searchUrl = searchParams.get("search") || "";
  const [search, setSearch] = useState(searchUrl);

  // Rotating featured product slideshow in Hero
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [flashIndex, setFlashIndex] = useState(0);
  
  // Countdown Timer for Flash Sale
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setFetchError(false);

      // Show "server waking" banner after 3 seconds if still loading
      const wakingTimer = setTimeout(() => setServerWaking(true), 3000);

      try {
        const response = await fetchWithRetry(`${API_BASE}/api/products`, {}, 3, 2000);
        clearTimeout(wakingTimer);
        setServerWaking(false);

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const mapped = data.map((p) => ({ ...p, price: toVndInt(p.price) }));
            setProducts(mapped);
            
            // Dynamic category extraction
            const extractedCats = Array.from(new Set(mapped.map((p) => p.category))).filter(Boolean);
            if (extractedCats.length > 0) {
              setCategories(extractedCats);
            }
          }
        } else {
          setFetchError(true);
        }
      } catch (error) {
        clearTimeout(wakingTimer);
        setServerWaking(false);
        setFetchError(true);
        console.error("Lỗi tải sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Helper lists for featured and flash sale sections
  const hotProducts = products.filter((p) => p.isHot === true);
  const featuredList = hotProducts.length > 0 ? hotProducts : products.slice(0, 4);

  const discountedProducts = products.filter(isPromotionalProduct);
  const flashSaleProducts = discountedProducts;
  const brands = Array.from(new Set(
    products
      .filter((p) => activeCategory === "All" || p.category === activeCategory)
      .filter((p) => activeSubCategory === "All" || p.subCategory === activeSubCategory)
      .map((p) => p.brand)
      .filter(Boolean)
  )).sort();
  const subCategories = Array.from(new Set(
    products
      .filter((p) => activeCategory === "All" || p.category === activeCategory)
      .map((p) => p.subCategory)
      .filter(Boolean)
  )).sort();

  useEffect(() => {
    if (activeBrand !== "All" && !brands.includes(activeBrand)) {
      setActiveBrand("All");
    }
  }, [activeBrand, brands]);

  // Interval for Hero product slide rotation
  useEffect(() => {
    const listLen = featuredList.length;
    if (listLen === 0) return;
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % listLen);
    }, 4500);
    return () => clearInterval(interval);
  }, [featuredList.length]);

  const scrollFlashTo = (index) => {
    const track = flashTrackRef.current;
    if (!track || flashSaleProducts.length === 0) return;

    const nextIndex = (index + flashSaleProducts.length) % flashSaleProducts.length;
    const target = track.children[nextIndex];
    if (!target) return;

    track.scrollTo({
      left: target.offsetLeft,
      behavior: "smooth",
    });
    setFlashIndex(nextIndex);
  };

  useEffect(() => {
    if (flashSaleProducts.length <= 1) return;
    const interval = setInterval(() => {
      scrollFlashTo(flashIndex + 1);
    }, 4200);
    return () => clearInterval(interval);
  }, [flashIndex, flashSaleProducts.length]);

  // Countdown timer clock ticking
  useEffect(() => {
    const target = new Date();
    target.setHours(23, 59, 59, 999); // Countdown to end of today

    const updateTimer = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft({ hours: hrs, minutes: mins, seconds: secs });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(search.toLowerCase())) ||
      (p.badge && p.badge.toLowerCase().includes(search.toLowerCase())) ||
      (p.specs && p.specs.some(s => s.toLowerCase().includes(search.toLowerCase())));
      
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchBrand = activeBrand === "All" || p.brand === activeBrand;
    const matchSubCategory = activeSubCategory === "All" || p.subCategory === activeSubCategory;
    
    // Condition badge filtering
    let matchCondition = true;
    if (activeCondition !== "All") {
      if (!p.badge) {
        matchCondition = false;
      } else {
        const b = p.badge.toLowerCase();
        if (activeCondition === "New") {
          matchCondition = b === "new" || b.includes("mới 100") || b.includes("hàng mới") || b.includes("hang moi");
        } else if (activeCondition === "Like New") {
          matchCondition = b === "like new" || b === "likenew" || b.includes("99%") || b.includes("98%") || b.includes("95%");
        } else if (activeCondition === "Old") {
          matchCondition = b === "old" || b.includes("cũ") || b.includes("cu") || b.includes("used") || b.includes("lướt");
        }
      }
    }

    // Price range filtering
    let matchPrice = true;
    const priceVal = toVndInt(p.price);
    if (priceRange === "under_5m") {
      matchPrice = priceVal < 5000000;
    } else if (priceRange === "5m_15m") {
      matchPrice = priceVal >= 5000000 && priceVal <= 15000000;
    } else if (priceRange === "15m_30m") {
      matchPrice = priceVal >= 15000000 && priceVal <= 30000000;
    } else if (priceRange === "over_30m") {
      matchPrice = priceVal > 30000000;
    } else if (priceRange === "custom") {
      const min = customMin ? Number(customMin) : 0;
      const max = customMax ? Number(customMax) : Infinity;
      matchPrice = priceVal >= min && priceVal <= max;
    }

    const matchPromo = !promoOnly || isPromotionalProduct(p);
    
    return matchSearch && matchCat && matchBrand && matchSubCategory && matchCondition && matchPrice && matchPromo;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "best_seller") {
      return (b.reviews || 0) - (a.reviews || 0);
    }
    if (sortBy === "price_asc") {
      return toVndInt(a.price) - toVndInt(b.price);
    }
    if (sortBy === "price_desc") {
      return toVndInt(b.price) - toVndInt(a.price);
    }
    if (sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return 0;
  });

  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedId(product.id);
    showToast(`Đã thêm thành công "${product.name}" vào giỏ hàng!`, "success");
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleBuyNow = (product) => {
    addToCart(product);
    showToast(`Đã thêm "${product.name}" vào giỏ hàng! Đang chuyển hướng thanh toán...`, "info");
    navigate("/checkout");
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (val) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
  };

  const handleClearSearch = () => {
    setSearch("");
    setSearchParams({});
  };

  const handleCategoryCardClick = (cat) => {
    setActiveCategory(cat);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  };

  const handleViewAllPromotions = () => {
    setPromoOnly(true);
    setOpenDropdown(null);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  };

  const featuredProduct = featuredList.length > 0 ? featuredList[featuredIndex % featuredList.length] : null;
  const featuredHasDiscount = featuredProduct?.discount > 0;
  const featuredSalePrice = featuredProduct
    ? featuredProduct.discountedPrice !== null && featuredProduct.discountedPrice !== undefined
      ? toVndInt(featuredProduct.discountedPrice)
      : featuredHasDiscount
        ? Math.floor(featuredProduct.price * (1 - featuredProduct.discount / 100))
        : featuredProduct.price
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">

      {/* Server Cold-Start Warning Banner */}
      {serverWaking && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-2.5 flex items-center justify-center gap-3 text-xs font-bold shadow-lg animate-fade-in">
          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
          <span>🚀 Server đang khởi động (Render free tier ngủ sau 15 phút). Vui lòng chờ 30-60 giây...</span>
        </div>
      )}

      {/* Fetch Error Banner */}
      {fetchError && products.length === 0 && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-4 py-2.5 flex items-center justify-center gap-3 text-xs font-bold shadow-lg">
          <WifiOff className="h-4 w-4 flex-shrink-0" />
          <span>Không thể kết nối tới server. Hãy kiểm tra mạng hoặc thử lại sau.</span>
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-28 px-4 border-b border-slate-900">
        
        {/* Glow Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse"></div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Column: Headline, Search, Call to action */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-400/30 text-blue-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-blue-400" />
              Next-Gen Tech Shop 2026
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none">
              Trải Nghiệm Công Nghệ<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Xứng Tầm Tương Lai.
              </span>
            </h1>
            <p className="max-w-xl mx-auto lg:mx-0 text-slate-400 text-sm sm:text-base font-semibold leading-relaxed">
              Mua sắm các dòng máy Laptop Gaming, Smartphone và phụ kiện chính hãng chất lượng cao. Khám phá các ưu đãi độc quyền kèm chế độ bảo hành vàng 2 năm.
            </p>

            {/* Premium Search Box */}
            <div className="max-w-xl mx-auto lg:mx-0 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xs opacity-30 group-hover:opacity-60 transition duration-300"></div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm, thương hiệu, cấu hình..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:bg-slate-900 focus:border-blue-400 transition-all text-xs sm:text-sm shadow-xl font-semibold"
                />
                <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                {search && (
                  <button 
                    onClick={handleClearSearch}
                    className="absolute right-4 top-4 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2">
              <RippleButton
                onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:opacity-95 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <span>Khám phá sản phẩm</span>
                <ArrowRight className="h-4 w-4" />
              </RippleButton>
              <RippleButton
                onClick={() => document.getElementById('categories-showcase').scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black px-8 py-4 rounded-2xl transition-all hover:scale-[1.03] active:scale-95 cursor-pointer text-xs uppercase tracking-wider"
              >
                Tìm theo danh mục
              </RippleButton>
            </div>
          </div>

          {/* Right Column: Dynamic Featured Rotating Showcase Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[380px] group/showcase">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-[32px] blur-md opacity-25 group-hover/showcase:opacity-40 transition duration-500"></div>
              
              <div className="relative bg-slate-900/60 dark:bg-slate-900/40 backdrop-blur-xl border border-white/10 dark:border-slate-800/80 rounded-[28px] p-6 shadow-2xl transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-black tracking-widest uppercase text-blue-400 flex items-center gap-1">
                    <Award className="h-3 w-3" /> Nổi bật trong tháng
                  </span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((idx) => (
                      <span 
                        key={idx} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${featuredIndex === idx ? "w-4 bg-blue-500" : "w-1.5 bg-slate-700"}`}
                      />
                    ))}
                  </div>
                </div>

                {featuredProduct ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="aspect-[4/3] rounded-2xl bg-slate-950 overflow-hidden relative border border-white/5">
                      <img 
                        src={featuredProduct.images && featuredProduct.images[0] ? featuredProduct.images[0] : ""} 
                        alt={featuredProduct.name} 
                        className="w-full h-full object-cover group-hover/showcase:scale-105 transition duration-500"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop" }}
                      />
                      {featuredProduct.badge && (
                        <span className={`absolute top-2.5 left-2.5 text-white text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${getBadgeClass(featuredProduct.badge)}`}>
                          {featuredProduct.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[9px] font-extrabold uppercase text-purple-400 tracking-wider">
                        {[featuredProduct.category, featuredProduct.brand, featuredProduct.subCategory].filter(Boolean).join(" • ")}
                      </span>
                      <h3 className="font-extrabold text-white text-base truncate mt-0.5 group-hover/showcase:text-blue-400 transition-colors">
                        {featuredProduct.name}
                      </h3>
                      <p className="text-slate-400 text-xs line-clamp-1 mt-0.5 font-medium">{featuredProduct.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Giá ưu đãi</p>
                        <div className="mt-0.5">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <p className="font-black text-white text-base">{formatVND(featuredSalePrice)}</p>
                            {featuredHasDiscount && (
                              <span className="text-[10px] text-red-300 font-extrabold bg-red-500/15 px-1.5 py-0.5 rounded">
                                -{featuredProduct.discount}%
                              </span>
                            )}
                          </div>
                          {featuredHasDiscount && (
                            <p className="text-xs text-slate-500 line-through">
                              {formatVND(featuredProduct.price)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link 
                        to={`/product/${featuredProduct.id}`}
                        className="flex items-center gap-1 text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-wider bg-blue-500/10 hover:bg-blue-500/20 px-3.5 py-2 rounded-xl border border-blue-500/20 transition-all active:scale-95"
                      >
                        <span>Chi tiết</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[4/3] flex items-center justify-center bg-slate-950 rounded-2xl">
                    <span className="text-slate-500 text-xs font-semibold">Đang tải tiêu điểm...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Glassmorphic Stats & Trust Banner (Overlapping bottom of hero) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/60 shadow-xl rounded-3xl p-5 sm:p-6 py-6 sm:py-8 -mt-10 transition-colors duration-300">
          
          <div className="flex items-start gap-4 p-2.5">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Giao hàng siêu tốc</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Nhận hàng trong 2h tại nội thành HN/HCM</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-2.5">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Bảo hành dài hạn 2 năm</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Bảo hành linh kiện & đổi mới linh hoạt</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-2.5">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">30 ngày đổi trả miễn phí</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Hoàn tiền 100% nếu có lỗi từ nhà sản xuất</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-2.5">
            <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Kỹ thuật viên 24/7</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Hỗ trợ cài đặt phần mềm & bảo dưỡng trọn đời</p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Category Explorer Showcase (Visual Cards) */}
      <section id="categories-showcase" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10">
        <ScrollReveal>
          <div className="text-center space-y-2 mb-10">
            <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">Danh mục nổi bật</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Khám Phá Vũ Trụ Công Nghệ</h2>
            <p className="max-w-md mx-auto text-xs text-slate-500 font-semibold">Lựa chọn các thiết bị phù hợp với nhu cầu từ hệ sinh thái công nghệ đa dạng của chúng tôi.</p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, idx) => {
            const IconComponent = CATEGORIES_ICONS[cat.toLowerCase()] || Cpu;
            const gradientStyle = CATEGORIES_GRADIENTS[cat.toLowerCase()] || "from-blue-500/10 to-indigo-500/10 text-blue-600";
            const associatedCount = products.filter(p => p.category.toLowerCase() === cat.toLowerCase()).length;
            
            return (
              <ScrollReveal key={cat} delay={idx * 60} distance="15px">
                <button
                  onClick={() => handleCategoryCardClick(cat)}
                  className={`w-full group text-left bg-gradient-to-br ${gradientStyle} border border-slate-200/50 dark:border-slate-850/80 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between aspect-square`}
                >
                  <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">{cat}</h3>
                    <p className="text-[9px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider">{associatedCount || 6} thiết bị</p>
                  </div>
                </button>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* 4. Flash Sale Section with Real-Time Countdown */}
      {flashSaleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <ScrollReveal>
            <div className="bg-gradient-to-r from-red-600 via-rose-650 to-orange-600 rounded-[32px] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl mb-6">
              {/* Decorative glows */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-white animate-ping"></span>
                    <span className="text-[9px] font-black bg-white/25 text-white px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 fill-white text-white animate-bounce" /> Flash Sale Hôm Nay
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black">Xả Kho Công Nghệ Giá Cực Sốc</h2>
                  <p className="text-xs text-red-100 max-w-sm font-semibold">Ưu đãi giảm giá đặc biệt áp dụng cho sản phẩm cấu hình cao, bảo hành vàng. Số lượng cực kỳ giới hạn.</p>
                </div>

                {/* Countdown Timer Widget */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                  <span className="text-xs font-bold mr-1 text-red-50">Kết thúc sau:</span>
                  <div className="flex items-center gap-1 font-mono text-sm font-black">
                    <div className="bg-white/15 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 min-w-[42px] text-center">
                      {timeLeft.hours.toString().padStart(2, '0')}
                    </div>
                    <span>:</span>
                    <div className="bg-white/15 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 min-w-[42px] text-center">
                      {timeLeft.minutes.toString().padStart(2, '0')}
                    </div>
                    <span>:</span>
                    <div className="bg-white/15 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 min-w-[42px] text-center">
                      {timeLeft.seconds.toString().padStart(2, '0')}
                    </div>
                  </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleViewAllPromotions}
                    className="inline-flex items-center justify-center gap-1.5 bg-white text-red-600 hover:bg-red-50 font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-red-950/10 transition-all active:scale-95"
                  >
                    <span>Xem tất cả</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Flash Sale Product Slider */}
          <div className="relative">
            <button
              type="button"
              onClick={() => scrollFlashTo(flashIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-all active:scale-95"
              aria-label="Trượt sang trái"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollFlashTo(flashIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-all active:scale-95"
              aria-label="Trượt sang phải"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div
              ref={flashTrackRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none pb-2 px-1"
            >
            {flashSaleProducts.map((product, idx) => {
              const hasDiscountPercent = product.discount > 0;
              const discountPercent = hasDiscountPercent ? product.discount : 0;
              const salePrice =
                product.discountedPrice !== null && product.discountedPrice !== undefined
                  ? toVndInt(product.discountedPrice)
                  : hasDiscountPercent
                    ? Math.floor(product.price * (1 - discountPercent / 100))
                    : product.price;
              const soldPercentage = 45 + (idx * 12); // Mock claims
              return (
                <ScrollReveal
                  key={`flash-${product.id}`}
                  delay={idx * 80}
                  distance="25px"
                  className="snap-start flex-shrink-0 w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]"
                >
                  <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col relative">
                    
                    {/* Discount Tag */}
                    {hasDiscountPercent && (
                      <span className="absolute top-3 right-3 z-30 bg-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                        -{discountPercent}%
                      </span>
                    )}

                    {/* Image */}
                    <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-[4/3]">
                      <img
                        src={product.images && product.images[0] ? product.images[0] : ""}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100&auto=format&fit=crop" }}
                      />
                    </Link>

                    {/* Info */}
                    <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] text-red-500 font-extrabold uppercase tracking-widest flex items-center gap-0.5">
                          <Flame className="h-3 w-3 fill-red-500" /> {[product.brand, product.subCategory].filter(Boolean).join(" • ") || "Giá Sập Sàn"}
                        </span>
                        <Link to={`/product/${product.id}`}>
                          <h3 className="font-extrabold text-slate-850 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 text-sm">
                            {product.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-405 mt-0.5 line-clamp-1">{product.description}</p>
                        </Link>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-black text-slate-900 dark:text-white text-base">
                            {formatVND(salePrice)}
                          </span>
                          {hasDiscountPercent && (
                            <span className="text-xs text-slate-400 line-through">
                              {formatVND(product.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stock Claims Tracker */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 dark:text-slate-500">
                          <span>Đã bán: {Math.floor((soldPercentage / 100) * 15)}/15 cái</span>
                          <span>{soldPercentage}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000"
                            style={{ width: `${soldPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <RippleButton
                          onClick={() => handleAddToCart(product)}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] sm:text-[11px] py-2 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" /> Thêm giỏ
                        </RippleButton>
                        <RippleButton
                          onClick={() => handleBuyNow(product)}
                          className="bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] sm:text-[11px] py-2 rounded-xl transition-all hover:shadow-md hover:shadow-red-600/20 active:scale-95 cursor-pointer flex items-center justify-center"
                        >
                          Mua ngay
                        </RippleButton>
                      </div>
                    </div>

                  </div>
                </ScrollReveal>
              );
            })}
            </div>
          </div>
        </section>
      )}

      {/* 5. Main Product Feed Section (Scroll Reveal applied here) */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-30">
        
        <ScrollReveal>
          <div className="text-center space-y-2 mb-10">
            <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">Sản phẩm của chúng tôi</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Hệ Thống Thiết Bị ShopTech</h2>
            <p className="max-w-md mx-auto text-xs text-slate-500 font-semibold">Sử dụng bộ lọc thông minh để tìm sản phẩm với mức giá và tình trạng ưng ý nhất.</p>
          </div>
        </ScrollReveal>

        {/* Category Pills inside the feed container */}
        <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          <button
            onClick={() => {
              setActiveCategory("All");
              setActiveBrand("All");
              setActiveSubCategory("All");
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold transition-all duration-200 ${
              activeCategory === "All"
                ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Tất cả</span>
          </button>

          {categories.map((cat) => {
            const IconComponent = CATEGORIES_ICONS[cat.toLowerCase()] || Cpu;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setActiveBrand("All");
                  setActiveSubCategory("All");
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <IconComponent className="h-3.5 w-3.5" />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Selection Bar */}
        <ScrollReveal className="relative z-[1000]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 px-4 rounded-2xl shadow-sm transition-all duration-300">
            
            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Brand Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "brand" ? null : "brand")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border rounded-full transition-all ${
                    activeBrand !== "All"
                      ? "bg-blue-55 dark:bg-blue-950/40 text-blue-600 dark:text-blue-450 border-blue-200"
                      : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>Hãng: {activeBrand === "All" ? "Tất cả" : activeBrand}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openDropdown === "brand" ? "rotate-180" : ""}`} />
                </button>
                {openDropdown === "brand" && (
                  <div className="absolute left-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-[10000] animate-fade-in">
                    {[{ id: "All", label: "Tất cả hãng" }, ...brands.map((b) => ({ id: b, label: b }))].map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => { setActiveBrand(brand.id); setOpenDropdown(null); }}
                        className="w-full flex items-center justify-between px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span>{brand.label}</span>
                        {activeBrand === brand.id && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-category Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "subCategory" ? null : "subCategory")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border rounded-full transition-all ${
                    activeSubCategory !== "All"
                      ? "bg-blue-55 dark:bg-blue-950/40 text-blue-600 dark:text-blue-450 border-blue-200"
                      : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>Phân loại: {activeSubCategory === "All" ? "Tất cả" : activeSubCategory}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openDropdown === "subCategory" ? "rotate-180" : ""}`} />
                </button>
                {openDropdown === "subCategory" && (
                  <div className="absolute left-0 mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-[10000] animate-fade-in">
                    {[{ id: "All", label: "Tất cả phân loại" }, ...subCategories.map((s) => ({ id: s, label: s }))].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveSubCategory(item.id); setOpenDropdown(null); }}
                        className="w-full flex items-center justify-between px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span>{item.label}</span>
                        {activeSubCategory === item.id && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Condition Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "condition" ? null : "condition")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border rounded-full transition-all ${
                    activeCondition !== "All"
                      ? "bg-blue-55 dark:bg-blue-950/40 text-blue-600 dark:text-blue-450 border-blue-200"
                      : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>Tình trạng: {activeCondition === "All" ? "Tất cả" : activeCondition === "New" ? "Mới" : activeCondition === "Like New" ? "Like New" : "Cũ"}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openDropdown === "condition" ? "rotate-180" : ""}`} />
                </button>
                {openDropdown === "condition" && (
                  <div className="absolute left-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-[10000] animate-fade-in">
                    {[
                      { id: "All", label: "Tất cả tình trạng" },
                      { id: "New", label: "Hàng mới (New)" },
                      { id: "Like New", label: "Like New (99%)" },
                      { id: "Old", label: "Đã qua sử dụng (Old)" }
                    ].map((cond) => (
                      <button
                        key={cond.id}
                        onClick={() => { setActiveCondition(cond.id); setOpenDropdown(null); }}
                        className="w-full flex items-center justify-between px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span>{cond.label}</span>
                        {activeCondition === cond.id && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setPromoOnly((prev) => !prev)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border rounded-full transition-all ${
                  promoOnly
                    ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60"
                    : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                <Flame className={`h-3.5 w-3.5 ${promoOnly ? "fill-red-500 text-red-500" : ""}`} />
                <span>Đang ưu đãi</span>
              </button>

              {/* Price Range Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "price" ? null : "price")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border rounded-full transition-all ${
                    priceRange !== "all"
                      ? "bg-blue-55 dark:bg-blue-950/40 text-blue-600 dark:text-blue-450 border-blue-200"
                      : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>
                    Giá: {priceRange === "all" ? "Mọi mức giá" : 
                    priceRange === "under_5m" ? "Dưới 5tr" :
                    priceRange === "5m_15m" ? "5tr - 15tr" :
                    priceRange === "15m_30m" ? "15tr - 30tr" :
                    priceRange === "over_30m" ? "Trên 30tr" : "Giá tùy chọn"}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openDropdown === "price" ? "rotate-180" : ""}`} />
                </button>
                {openDropdown === "price" && (
                  <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-[10000] animate-fade-in space-y-0.5">
                    {[
                      { id: "all", label: "Mọi mức giá" },
                      { id: "under_5m", label: "Dưới 5 triệu" },
                      { id: "5m_15m", label: "5 triệu - 15 triệu" },
                      { id: "15m_30m", label: "15 triệu - 30 triệu" },
                      { id: "over_30m", label: "Trên 30 triệu" },
                      { id: "custom", label: "Nhập khoảng giá tùy ý..." }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { 
                          setPriceRange(item.id); 
                          if (item.id !== "custom") {
                            setOpenDropdown(null); 
                          }
                        }}
                        className="w-full flex items-center justify-between px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span>{item.label}</span>
                        {priceRange === item.id && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    ))}
                    
                    {priceRange === "custom" && (
                      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-950/20 rounded-b-2xl">
                        <input
                          type="number"
                          placeholder="Giá từ (đ)"
                          value={customMin}
                          onChange={(e) => setCustomMin(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Đến (đ)"
                          value={customMax}
                          onChange={(e) => setCustomMax(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(null)}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] py-1.5 rounded-lg uppercase transition-all"
                        >
                          Áp dụng giá
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sort Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-305 border-slate-200 dark:border-slate-700 rounded-full transition-all"
                >
                  <span>
                    Sắp xếp: {
                      sortBy === "newest" ? "Mới nhất" :
                      sortBy === "oldest" ? "Cũ nhất" :
                      sortBy === "best_seller" ? "Bán chạy" :
                      sortBy === "price_asc" ? "Giá tăng dần" : "Giá giảm dần"
                    }
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openDropdown === "sort" ? "rotate-180" : ""}`} />
                </button>
                {openDropdown === "sort" && (
                  <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-[10000] animate-fade-in">
                    {[
                      { id: "newest", label: "Mới nhất" },
                      { id: "oldest", label: "Cũ nhất" },
                      { id: "best_seller", label: "Bán chạy nhất" },
                      { id: "price_asc", label: "Giá tăng dần ↑" },
                      { id: "price_desc", label: "Giá giảm dần ↓" }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setSortBy(item.id); setOpenDropdown(null); }}
                        className="w-full flex items-center justify-between px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span>{item.label}</span>
                        {sortBy === item.id && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Results Count & Clean Filters Button */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold whitespace-nowrap">
                Tìm thấy {sorted.length} sản phẩm
              </span>
              {(activeCategory !== "All" || activeBrand !== "All" || activeSubCategory !== "All" || activeCondition !== "All" || promoOnly || sortBy !== "newest" || priceRange !== "all" || search !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("All");
                    setActiveBrand("All");
                    setActiveSubCategory("All");
                    setActiveCondition("All");
                    setPromoOnly(false);
                    setSortBy("newest");
                    setPriceRange("all");
                    setSearch("");
                    setCustomMin("");
                    setCustomMax("");
                    setSearchParams({});
                    setOpenDropdown(null);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500 rounded-full text-xs font-semibold transition-all active:scale-95"
                  title="Xóa tất cả bộ lọc"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Xóa lọc</span>
                </button>
              )}
            </div>
          </div>
        </ScrollReveal>

        {search && (
          <div className="text-xs text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/40 p-2 py-3 rounded-xl border border-slate-200/50 dark:border-slate-850/60 w-fit">
            <span>Từ khóa tìm kiếm:</span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400">"{search}"</span>
            <button
              onClick={() => { setSearch(""); setSearchParams({}); }}
              className="hover:bg-slate-200 dark:hover:bg-slate-800 p-0.5 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Product Cards Listing (Scroll Reveal integration: lướt tới đâu hiện tới đó) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
                <div className="animate-shimmer aspect-[4/3] rounded-xl w-full"></div>
                <div className="space-y-2">
                  <div className="h-3 animate-shimmer rounded w-1/3"></div>
                  <div className="h-4 animate-shimmer rounded w-3/4"></div>
                  <div className="h-3 animate-shimmer rounded w-1/2"></div>
                </div>
                <div className="h-6 animate-shimmer rounded w-2/3"></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 animate-shimmer rounded-xl"></div>
                  <div className="h-8 animate-shimmer rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 dark:text-slate-500 text-lg font-semibold">Không tìm thấy sản phẩm nào phù hợp bộ lọc.</p>
            <button onClick={handleClearSearch} className="mt-4 text-blue-600 dark:text-blue-400 hover:underline font-bold">
              Xem tất cả sản phẩm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sorted.map((product, idx) => (
              <ScrollReveal 
                key={product.id} 
                delay={(idx % 4) * 80} 
                distance="30px"
                duration={600}
              >
                <div className="group/card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-2 hover:border-blue-300 dark:hover:border-blue-900/60 transition-all duration-300 flex flex-col relative h-full">
                  
                  {/* Glint/Shine hover effect overlay */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20">
                    <div className="absolute top-0 -left-[150%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent skew-x-[-25deg] transition-all duration-1000 ease-out group-hover/card:left-[150%]" />
                  </div>

                  {/* Image */}
                  <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-[4/3]">
                    <img
                      src={product.images && product.images[0] ? product.images[0] : ""}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100&auto=format&fit=crop" }}
                    />
                    {product.badge && (
                      <span className={`absolute top-3 left-3 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md ${getBadgeClass(product.badge)}`}>
                        {product.badge}
                      </span>
                    )}
                    {product.discount > 0 && (
                      <span className="absolute top-3 right-3 z-30 bg-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                        -{product.discount}%
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-widest">
                        {[product.category, product.brand, product.subCategory].filter(Boolean).join(" • ")}
                      </span>
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-extrabold text-slate-850 dark:text-slate-100 group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors line-clamp-1 text-sm">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-405 mt-0.5 line-clamp-1">{product.description}</p>

                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{product.rating || 0}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">({product.reviews || 0})</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      {(product.discount > 0 || (product.discountedPrice !== null && product.discountedPrice !== undefined)) ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                              {formatVND(
                                product.discountedPrice !== null && product.discountedPrice !== undefined
                                  ? toVndInt(product.discountedPrice)
                                  : Math.floor(product.price * (1 - product.discount / 100))
                              )}
                            </span>
                            {product.discount > 0 && (
                              <span className="text-[10px] text-red-500 font-extrabold bg-red-50 dark:bg-red-950/30 px-1.5 py-0.2 rounded">
                                -{product.discount}%
                              </span>
                            )}
                          </div>
                          {product.discount > 0 && (
                            <span className="text-xs text-slate-400 line-through">
                              {formatVND(product.price)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          {formatVND(product.price)}
                        </span>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <RippleButton
                          onClick={() => handleAddToCart(product)}
                          className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl font-bold text-[10px] sm:text-[11px] transition-all duration-200 cursor-pointer ${
                            addedId === product.id
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 active:scale-95"
                          }`}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {addedId === product.id ? "Đã thêm!" : "Thêm giỏ"}
                        </RippleButton>
                        <RippleButton
                          onClick={() => handleBuyNow(product)}
                          className="bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-[10px] sm:text-[11px] py-2 rounded-xl transition-all hover:shadow-md hover:shadow-blue-600/20 active:scale-95 text-center flex items-center justify-center cursor-pointer"
                        >
                          Mua ngay
                        </RippleButton>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* 6. Why Choose Us / Value Proposition Showcase */}
      <section className="bg-slate-100 dark:bg-slate-900/30 py-20 px-4 border-y border-slate-200/50 dark:border-slate-850/60 relative z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <ScrollReveal>
            <div className="text-center space-y-2">
              <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">Giá trị cốt lõi</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Tại Sao Nên Lựa Chọn ShopTech?</h2>
              <p className="max-w-md mx-auto text-xs text-slate-500 font-semibold">Chúng tôi không chỉ bán thiết bị, chúng tôi đem lại dịch vụ công nghệ dẫn đầu.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollReveal delay={0} distance="20px">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-8 rounded-3xl space-y-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-xl">
                  💳
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Hỗ Trợ Trả Góp 0%</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Liên kết với hơn 20 ngân hàng thương mại hỗ trợ trả góp lãi suất 0% qua thẻ tín dụng hoặc hồ sơ duyệt nhanh chỉ trong 10 phút.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100} distance="20px">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-8 rounded-3xl space-y-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-extrabold text-xl">
                  🔄
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Thu Cũ Đổi Mới Giá Cao</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Thu mua lại các mẫu máy cũ với mức định giá cao nhất thị trường, trợ giá lên đời lên tới 2.000.000đ dành cho thành viên VIP.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200} distance="20px">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-8 rounded-3xl space-y-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-extrabold text-xl">
                  🔧
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Vệ Sinh & Cài Đặt Trọn Đời</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Tất cả laptop bán ra đều được tặng kèm gói vệ sinh máy, tra keo tản nhiệt MX-4 và cài đặt phần mềm hệ điều hành miễn phí trọn đời.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 7. Newsletter & Voucher CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <ScrollReveal>
          <div className="relative rounded-[40px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8 sm:p-12 md:p-16 overflow-hidden border border-white/10 shadow-2xl">
            {/* Glowing blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
              <span className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-300 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                📩 Đăng ký hội viên ShopTech
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Nhận Ngay Voucher Giảm Giá <br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Lên Tới 500.000đ</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto font-semibold">
                Đăng ký nhận bản tin công nghệ của ShopTech để không bỏ lỡ các đợt flash sale, xả kho hàng tuần và nhận ngay mã giảm giá độc quyền.
              </p>

              <form 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  showToast("Chúc mừng! Đăng ký thành công. Mã voucher đã được gửi tới email của bạn!", "success");
                }}
                className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 pt-4"
              >
                <input
                  type="email"
                  required
                  placeholder="Nhập địa chỉ email của bạn..."
                  className="flex-grow px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:bg-white/15 focus:border-blue-400 transition-all text-xs font-semibold"
                />
                <button
                  type="submit"
                  className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-650 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  Đăng ký nhận quà
                </button>
              </form>
            </div>
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
}
