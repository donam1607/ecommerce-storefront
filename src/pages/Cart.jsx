import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { formatVND, toVndInt } from "../utils/money";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const subtotal = cart.reduce((sum, item) => sum + toVndInt(item.price) * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center p-8 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 shadow-sm border border-slate-200 dark:border-slate-800 max-w-md w-full transition-colors duration-300">
          <ShoppingBag className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Giỏ hàng của bạn đang trống</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Hãy thêm các sản phẩm công nghệ tuyệt vời vào giỏ hàng nhé!</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105"
          >
            <ArrowRight className="h-4 w-4" />
            Bắt đầu mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white">Giỏ hàng của bạn</h1>
          <button
            onClick={clearCart}
            className="text-sm text-red-500 hover:text-red-600 font-semibold transition-colors"
          >
            Xóa tất cả
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex gap-4 hover:shadow-md dark:hover:shadow-slate-950/40 transition-all duration-300"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                  <img 
                    src={item.images && item.images.length > 0 ? item.images[0] : item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{item.category}</span>
                      <h3 className="font-bold text-slate-800 dark:text-white text-sm whitespace-normal break-words">{item.name}</h3>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-slate-450 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      </button>
                      <span className="px-3 py-1.5 font-bold text-sm text-slate-800 dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      </button>
                    </div>
                    <span className="font-black text-slate-800 dark:text-white">
                      {formatVND(toVndInt(item.price) * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sticky top-28 transition-colors duration-300">
              <h2 className="text-lg font-black text-slate-800 dark:text-white mb-6">Tóm tắt đơn hàng</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>Tạm tính ({cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>Phí vận chuyển</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {shipping === 0 ? "MIỄN PHÍ" : formatVND(shipping)}
                  </span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between">
                  <span className="font-black text-slate-800 dark:text-white">Tổng cộng</span>
                  <span className="font-black text-xl text-slate-800 dark:text-white">{formatVND(total)}</span>
                </div>
              </div>
              <Link
                to="/checkout"
                className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/20"
              >
                Tiến hành thanh toán →
              </Link>
              <Link
                to="/"
                className="block w-full text-center mt-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 text-sm font-medium transition-colors"
              >
                ← Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
