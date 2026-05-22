import React, { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, ShoppingCart, User, Heart, Moon, Sun } from 'lucide-react';
import { CartContext } from '../context/CartContext';

function Navbar() {
  const { cart } = useContext(CartContext);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-slate-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-primary-600 p-2 rounded-xl text-white shadow-md shadow-primary-600/30">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-xl text-slate-800 dark:text-white">
            Shop<span className="text-primary-600">Tech</span>
          </span>
        </Link>
        <div className="hidden md:flex flex-1 max-w-md relative mx-4">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-100 dark:bg-gray-800 focus:outline-none focus:bg-white focus:border-primary-500 text-sm"
            // optional onChange to handle search – handled in Home page
          />
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleDark} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors">
            {dark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
          </button>
          <button onClick={() => navigate('/cart')} className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors">
            <ShoppingCart className="h-6 w-6 text-slate-600 dark:text-gray-300" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors">
            <User className="h-6 w-6 text-slate-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
