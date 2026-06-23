import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Trash2, ShoppingBag, ArrowRight, Package, Tag } from "lucide-react";
import { formatVND, toVndInt } from "../utils/money";
import QuantityControl from "../components/QuantityControl";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const subtotal = cart.reduce((sum, item) => sum + toVndInt(item.price) * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 flex flex-col items-center justify-center text-center p-8 transition-colors duration-300">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl shadow-slate-200/40 dark:shadow-slate-950/40 border border-white/60 dark:border-slate-800/50 max-w-md w-full animate-scale-in">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl flex items-center justify-center mx-auto">
              <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-black">0</span>
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Giỏ hàng đang trống</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm font-medium leading-relaxed">
            Hãy thêm các sản phẩm công nghệ tuyệt vời vào giỏ hàng và bắt đầu trải nghiệm mua sắm!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-3.5 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/25"
          >
            <ArrowRight className="h-4 w-4" />
            Bắt đầu mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/10 to-indigo-50/5 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 py-10 px-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Giỏ hàng của bạn
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm đang chờ thanh toán
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-bold transition-colors flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa tất cả
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-4 flex gap-4 hover:shadow-xl hover:shadow-slate-200/30 dark:hover:shadow-slate-950/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Image */}
                <Link to={`/product/${item.id}`} className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                    <img
                      src={item.images && item.images.length > 0 ? item.images[0] : item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider">{item.category}</span>
                      <h3 className="font-bold text-slate-800 dark:text-white text-sm whitespace-normal break-words leading-snug mt-0.5">
                        {item.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all flex-shrink-0 cursor-pointer hover:scale-110 active:scale-90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity */}
                    <QuantityControl
                      itemId={item.id}
                      quantity={item.quantity}
                      onUpdate={updateQuantity}
                    />

                    {/* Price */}
                    <span className="font-black text-slate-800 dark:text-white text-sm">
                      {formatVND(toVndInt(item.price) * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 sticky top-24 shadow-xl shadow-slate-200/20 dark:shadow-slate-950/20">
              <h2 className="text-lg font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Tạm tính ({cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm)
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white">{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Phí vận chuyển</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {shipping === 0 ? "MIỄN PHÍ" : formatVND(shipping)}
                  </span>
                </div>
                <div className="border-t border-dashed border-slate-200 dark:border-slate-700/60 pt-3 flex justify-between">
                  <span className="font-black text-slate-800 dark:text-white">Tổng cộng</span>
                  <span className="font-black text-xl text-blue-600 dark:text-blue-400">{formatVND(total)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35"
              >
                Tiến hành thanh toán →
              </Link>
              <Link
                to="/"
                className="block w-full text-center mt-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 text-sm font-medium transition-colors py-2"
              >
                ← Tiếp tục mua sắm
              </Link>

              {/* Trust signals */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-center gap-4 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                <span>🔒 Thanh toán bảo mật</span>
                <span>•</span>
                <span>📦 Giao hàng miễn phí</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
