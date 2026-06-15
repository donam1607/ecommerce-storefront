import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, ShoppingCart, User, Moon, Sun, LogOut, LayoutDashboard, ChevronDown, ClipboardList } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { PRODUCTS } from '../data/products';

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

function Navbar() {
  const { cart } = useContext(CartContext);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Instant Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState(PRODUCTS);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);
  
  const syncUserFromStorage = () => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      setUser(null);
      return;
    }
    try {
      setUser(JSON.parse(savedUser));
    } catch (e) {
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    syncUserFromStorage();
    const onStorage = () => syncUserFromStorage();
    const onAuthChanged = () => syncUserFromStorage();
    window.addEventListener('storage', onStorage);
    window.addEventListener('auth-changed', onAuthChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-changed', onAuthChanged);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Click outside search container
  useEffect(() => {
    function handleClickOutsideSearch(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideSearch);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideSearch);
    };
  }, []);

  // Fetch products from backend for instant search
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const API_URL = "https://shoptech-backend.onrender.com";
        const response = await fetch(`${API_URL}/api/products`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const toVndInt = (p) => {
              if (!p) return 0;
              const clean = p.toString().replace(/[^0-9.]/g, "");
              const parsed = parseFloat(clean);
              if (isNaN(parsed)) return 0;
              return parsed < 100000 ? parsed * 25000 : parsed;
            };
            setAllProducts(data.map(p => ({ ...p, price: toVndInt(p.price) })));
          }
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách sản phẩm trong navbar:", err);
      }
    };
    fetchAllProducts();
  }, []);

  // Filter products based on search input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const matches = allProducts.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.specs && p.specs.some(s => s.toLowerCase().includes(q)))
    );
    setSearchResults(matches.slice(0, 6)); // Lấy tối đa 6 kết quả
  }, [searchQuery, allProducts]);

  const toggleDark = () => {
    setDark(!dark);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('auth-changed'));
    setDropdownOpen(false);
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-950/75 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-350 animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <ShoppingBag className="h-5.5 w-5.5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
            Shop<span className="text-blue-600 dark:text-blue-400">Tech</span>
          </span>
        </Link>

        {/* Dynamic Instant Search */}
        <div className="hidden md:flex flex-1 max-w-md relative mx-4" ref={searchContainerRef}>
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleSearchSubmit}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/30 dark:border-slate-800/30 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none text-slate-900 dark:text-white text-sm transition-all shadow-inner input-premium-focus"
            />
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>

          {/* Instant Search Results Dropdown */}
          {searchFocused && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-3 glass-premium-card rounded-2xl shadow-2xl overflow-hidden z-[99999] animate-scale-in">
              <div className="p-3.5 border-b border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                <span>Kết quả tìm kiếm ({searchResults.length})</span>
                {searchResults.length > 0 && <span className="text-[9px] text-blue-500 dark:text-blue-500 font-normal normal-case">Nhấp để xem nhanh</span>}
              </div>
              
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                  Không tìm thấy sản phẩm nào phù hợp.
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100/50 dark:divide-slate-800/45 scrollbar-thin">
                  {searchResults.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        navigate(`/product/${p.id}`);
                        setSearchQuery("");
                        setSearchFocused(false);
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200/40 dark:border-slate-700/40 flex-shrink-0">
                        <img
                          src={p.images && p.images[0] ? p.images[0] : ""}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100&auto=format&fit=crop" }}
                        />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-blue-600 dark:text-blue-400 uppercase tracking-wide text-[9px] font-black">{p.category}</span>
                          {p.badge && (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${getBadgeClass(p.badge)}`}>
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5" title={p.name}>
                          {p.name}
                        </h4>
                      </div>
                      
                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {Number(p.price).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* View all button */}
                  <div
                    onClick={() => {
                      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchFocused(false);
                    }}
                    className="p-3 text-center bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-900/30 dark:hover:bg-slate-900/80 text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer transition-colors border-t border-slate-100/50 dark:border-slate-800/50 flex items-center justify-center gap-1.5"
                  >
                    <span>Xem tất cả sản phẩm tìm thấy</span>
                    <span className="text-[10px] opacity-75">➔</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleDark} 
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {dark ? <Sun className="h-5 w-5 text-amber-400 fill-amber-400/20" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button 
            onClick={() => navigate('/cart')} 
            className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ShoppingCart className="h-5.5 w-5.5" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[9px] font-black rounded-full h-4.5 w-4.5 flex items-center justify-center shadow-md shadow-red-500/15">
                {totalItems}
              </span>
            )}
          </button>

          {/* User Auth Info with Anti-Cut-Off Dropdown */}
          <div className="relative" ref={dropdownRef}>
            {user ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 transition-all text-sm font-bold border border-slate-200 dark:border-slate-800 flex-shrink-0 cursor-pointer active:scale-97"
                >
                  <div className="h-5.5 w-5.5 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>

                {/* Dropdown Menu (Guaranteed Not Cut Off) */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-60 glass-premium-card rounded-2xl shadow-2xl py-3.5 z-[99999] animate-scale-in">
                    <div className="px-4.5 py-3 border-b border-slate-200/40 dark:border-slate-800/40">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">Tài khoản</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                      <span className="inline-block mt-2 text.5 uppercase font-black tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 text-[9px]">
                        {user.role === 'admin' ? '👑 Quản trị viên' : '👤 Thành viên'}
                      </span>
                    </div>

                    {user.role && user.role !== 'user' && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4.5 py-2.5 text-sm text-slate-700 dark:text-slate-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors font-semibold"
                      >
                        <LayoutDashboard className="h-4.5 w-4.5 text-blue-500 flex-shrink-0" />
                        Trang quản trị
                      </Link>
                    )}

                    <Link
                      to="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4.5 py-2.5 text-sm text-slate-700 dark:text-slate-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors font-semibold"
                    >
                      <ClipboardList className="h-4.5 w-4.5 text-blue-500 flex-shrink-0" />
                      Lịch sử đơn hàng
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4.5 py-2.5 text-sm text-slate-700 dark:text-slate-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors font-semibold"
                    >
                      <User className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0" />
                      Trang cá nhân
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4.5 py-2.5 text-sm text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/25 transition-colors font-semibold text-left border-t border-slate-200/40 dark:border-slate-800/40 mt-1 cursor-pointer"
                    >
                      <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/10 active:scale-95 cursor-pointer hover:scale-[1.03]"
              >
                <User className="h-4 w-4" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
