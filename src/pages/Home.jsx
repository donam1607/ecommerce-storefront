import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { PRODUCTS } from "../data/products";
import { ShoppingCart, Star, Search, Cpu, Monitor, Keyboard, Headphones, Smartphone, Battery } from "lucide-react";
import { formatVND, toVndInt } from "../utils/money";

const CATEGORIES_ICONS = {
  "laptop": Cpu,
  "monitor": Monitor,
  "keyboard": Keyboard,
  "headphones": Headphones,
  "smartphone": Smartphone,
  "accessories": Battery
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
  if (b.includes("best") || b.includes("bán chạy") || b.includes("ban chay") || b.includes("hot")) {
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

export default function Home() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState(PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(["Laptop", "Monitor", "Keyboard", "Headphones", "Smartphone", "Accessories"]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeCondition, setActiveCondition] = useState("All");
  const [addedId, setAddedId] = useState(null);
  const navigate = useNavigate();

  // Search parameters from URL
  const [searchParams, setSearchParams] = useSearchParams();
  const searchUrl = searchParams.get("search") || "";
  const [search, setSearch] = useState(searchUrl);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const API_URL = "https://shoptech-backend.onrender.com";
        const response = await fetch(`${API_URL}/api/products`);
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
        }
      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.badge && p.badge.toLowerCase().includes(search.toLowerCase())) ||
      (p.specs && p.specs.some(s => s.toLowerCase().includes(search.toLowerCase())));
      
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    
    // Condition badge filtering
    let matchCondition = true;
    if (activeCondition !== "All") {
      if (!p.badge) {
        matchCondition = false;
      } else {
        const b = p.badge.toLowerCase();
        if (activeCondition === "New") {
          matchCondition = b.includes("new") || b.includes("mới") || b.includes("moi");
        } else if (activeCondition === "Like New") {
          matchCondition = b.includes("like new") || b.includes("likenew") || b.includes("99%") || b.includes("98%") || b.includes("95%");
        } else if (activeCondition === "Old") {
          matchCondition = b.includes("old") || b.includes("cũ") || b.includes("cu") || b.includes("used") || b.includes("lướt");
        }
      }
    }
    
    return matchSearch && matchCat && matchCondition;
  });

  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleBuyNow = (product) => {
    addToCart(product);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-20 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <span className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-300 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6">
            🔥 Summer Tech Sale 2026
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6">
            Next-Gen Tech,<br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Best Prices.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-450 text-base mb-8">
            Mua sắm các mẫu laptop, điện thoại thông minh và phụ kiện công nghệ mới nhất. Cam kết bảo hành chính hãng và chính sách đổi trả thuận tiện.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, thương hiệu, cấu hình..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:bg-white/15 focus:border-blue-455 transition-all text-sm shadow-inner"
            />
            <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <button
              onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              Mua sắm ngay
            </button>
            <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-8 py-3.5 rounded-full transition-all hover:scale-105">
              Xem ưu đãi
            </button>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory("All")}
            className={`flex-shrink-0 px-4.5 py-2 rounded-full text-sm font-bold transition-all ${
              activeCategory === "All"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Tất cả danh mục
          </button>
          {categories.map((name) => {
            const Icon = CATEGORIES_ICONS[name.toLowerCase()] || Cpu;
            return (
              <button
                key={name}
                onClick={() => setActiveCategory(name)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4.5 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === name
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Condition Filter Tabs (New, Like New, Old) */}
      <section className="bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide text-xs sm:text-sm font-bold">
          <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] mr-2">Tình trạng:</span>
          {[
            { id: "All", label: "Tất cả tình trạng" },
            { id: "New", label: "Hàng mới (New)" },
            { id: "Like New", label: "Like New (99%)" },
            { id: "Old", label: "Đã qua sử dụng (Old)" }
          ].map((cond) => (
            <button
              key={cond.id}
              onClick={() => setActiveCondition(cond.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl transition-all ${
                activeCondition === cond.id
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                  : "bg-white/40 dark:bg-slate-800/40 text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {cond.label}
            </button>
          ))}
        </div>
      </section>

      {/* Products Grid */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              {activeCategory === "All" ? "Tất cả sản phẩm" : activeCategory}
            </h2>
            <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">{filtered.length} sản phẩm được tìm thấy</p>
          </div>
          {search && (
            <button
              onClick={handleClearSearch}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 dark:text-slate-500 text-lg font-semibold">Không tìm thấy sản phẩm nào khớp với từ khóa "{search}"</p>
            <button onClick={handleClearSearch} className="mt-4 text-blue-600 dark:text-blue-400 hover:underline font-bold">
              Xem tất cả sản phẩm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-950/60 hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all duration-300 flex flex-col"
              >
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
                </Link>

                {/* Info */}
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-widest">{product.category}</span>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-extrabold text-slate-850 dark:text-slate-100 mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 text-sm">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{product.description}</p>

                    {/* Compact Specs Preview */}
                    {product.specs && product.specs.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-850/60 space-y-1">
                        {product.specs.slice(0, 3).map((spec, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            <span className="w-1 h-1 rounded-full bg-blue-500 dark:bg-blue-450 flex-shrink-0" />
                            <span className="truncate" title={spec}>{spec}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-2.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{product.rating || 0}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">({product.reviews || 0})</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    <span className="text-lg font-black text-slate-900 dark:text-white">{formatVND(product.price)}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl font-bold text-[11px] transition-all duration-200 ${
                          addedId === product.id
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 active:scale-95"
                        }`}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        {addedId === product.id ? "Đã thêm!" : "Thêm giỏ"}
                      </button>
                      <button
                        onClick={() => handleBuyNow(product)}
                        className="bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-[11px] py-2 rounded-xl transition-all hover:shadow-md hover:shadow-blue-600/20 active:scale-95 text-center flex items-center justify-center"
                      >
                        Mua ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="bg-slate-900 dark:bg-slate-950 text-white py-16 px-4 mt-8 border-t border-slate-850 dark:border-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="text-4xl mb-3">🚚</div>
            <h3 className="font-bold text-lg mb-2">Miễn phí vận chuyển</h3>
            <p className="text-slate-400 text-sm">Cho tất cả các đơn hàng trên 150$. Dịch vụ giao hàng hỏa tốc trong ngày.</p>
          </div>
          <div className="p-6">
            <div className="text-4xl mb-3">🛡️</div>
            <h3 className="font-bold text-lg mb-2">Bảo hành 2 năm</h3>
            <p className="text-slate-400 text-sm">Tất cả sản phẩm chính hãng công nghệ cao đều đi kèm bảo hành lâu dài.</p>
          </div>
          <div className="p-6">
            <div className="text-4xl mb-3">↩️</div>
            <h3 className="font-bold text-lg mb-2">Đổi trả 30 ngày</h3>
            <p className="text-slate-400 text-sm">Không hài lòng? Hãy gửi trả hàng trong vòng 30 ngày, hoàn tiền 100%.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
