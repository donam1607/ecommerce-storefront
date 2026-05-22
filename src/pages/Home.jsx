import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { ShoppingCart, Star, Search, Cpu, Monitor, Keyboard, Headphones, Smartphone, Battery } from "lucide-react";

const CATEGORIES = [
  { name: "Laptop", icon: Cpu },
  { name: "Monitor", icon: Monitor },
  { name: "Keyboard", icon: Keyboard },
  { name: "Headphones", icon: Headphones },
  { name: "Smartphone", icon: Smartphone },
  { name: "Accessories", icon: Battery },
];

const BADGE_COLORS = {
  "Best Seller": "bg-amber-500",
  "New": "bg-emerald-500",
  "Top Rated": "bg-purple-500",
  "Sale": "bg-red-500",
  "Hot": "bg-orange-500",
  "Gaming": "bg-blue-600",
};

export default function Home() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [addedId, setAddedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const API_URL = "https://shoptech-backend.onrender.com";
        const response = await fetch(`${API_URL}/api/products`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
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
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    return matchSearch && matchCat;
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-24 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-3xl"></div>
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
          <p className="max-w-2xl mx-auto text-slate-400 text-lg mb-10">
            Mua sắm các mẫu laptop, điện thoại thông minh và phụ kiện mới nhất từ các thương hiệu hàng đầu. Miễn phí vận chuyển cho đơn hàng trên $150.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Tìm kiếm laptop, điện thoại, tai nghe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:bg-white/15 focus:border-blue-400 transition-all text-sm"
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
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeCategory === "All"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Tất cả
          </button>
          {CATEGORIES.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => setActiveCategory(name)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === name
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {name}
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
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{filtered.length} sản phẩm được tìm thấy</p>
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 dark:text-slate-550 text-lg">Không tìm thấy sản phẩm nào khớp với từ khóa "{search}"</p>
            <button onClick={() => setSearch("")} className="mt-4 text-blue-600 dark:text-blue-400 hover:underline font-semibold">
              Xem tất cả sản phẩm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-slate-950/60 hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all duration-300 flex flex-col"
              >
                {/* Image */}
                <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-[4/3]">
                  <img
                    src={product.images && product.images[0] ? product.images[0] : ""}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.badge && (
                    <span className={`absolute top-3 left-3 ${BADGE_COLORS[product.badge]} text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider`}>
                      {product.badge}
                    </span>
                  )}
                </Link>

                {/* Info */}
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide">{product.category}</span>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 text-sm">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{product.description}</p>

                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{product.rating}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">({product.reviews})</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    <span className="text-lg font-black text-slate-800 dark:text-white">${product.price.toLocaleString()}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl font-bold text-[11px] transition-all duration-200 ${
                          addedId === product.id
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 active:scale-95"
                        }`}
                      >
                        <ShoppingCart className="h-3 w-3" />
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
      <section className="bg-slate-900 dark:bg-slate-950 text-white py-16 px-4 mt-8 border-t border-slate-800 dark:border-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="text-4xl mb-3">🚚</div>
            <h3 className="font-bold text-lg mb-2">Free Shipping</h3>
            <p className="text-slate-400 dark:text-slate-400 text-sm">On all orders over $150. Express delivery available.</p>
          </div>
          <div className="p-6">
            <div className="text-4xl mb-3">🛡️</div>
            <h3 className="font-bold text-lg mb-2">2-Year Warranty</h3>
            <p className="text-slate-400 dark:text-slate-400 text-sm">All products come with full manufacturer warranty.</p>
          </div>
          <div className="p-6">
            <div className="text-4xl mb-3">↩️</div>
            <h3 className="font-bold text-lg mb-2">30-Day Returns</h3>
            <p className="text-slate-400 dark:text-slate-400 text-sm">Not satisfied? Return it within 30 days, no questions asked.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
