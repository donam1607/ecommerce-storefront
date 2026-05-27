import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, ShoppingCart, User, Moon, Sun, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { CartContext } from '../context/CartContext';

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

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-600/30">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-xl text-slate-800 dark:text-white">
            Shop<span className="text-blue-600">Tech</span>
          </span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md relative mx-4">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none text-slate-900 dark:text-white text-sm transition-all"
            onChange={(e) => {
              // trigger search event globally if needed, or redirect to home with query
            }}
          />
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-3">
          <button onClick={toggleDark} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 transition-colors">
            {dark ? <Sun className="h-5 w-5 text-yellow-450" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button onClick={() => navigate('/cart')} className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 transition-colors">
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          {/* User Auth Info */}
          <div className="relative" ref={dropdownRef}>
            {user ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-sm font-bold border border-slate-200 dark:border-slate-700"
                >
                  <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-55 transition-colors duration-300">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-850">
                      <p className="text-xs text-slate-400 dark:text-slate-500">Đăng nhập với</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                      </span>
                    </div>

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors font-semibold"
                      >
                        <LayoutDashboard className="h-4.5 w-4.5 text-blue-500" />
                        Trang quản trị
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors font-semibold"
                    >
                      <User className="h-4.5 w-4.5 text-emerald-500" />
                      Trang cá nhân
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-semibold text-left"
                    >
                      <LogOut className="h-4.5 w-4.5" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 px-4.5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/10 active:scale-95"
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
