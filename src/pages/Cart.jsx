import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 150 ? 0 : 9.99;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-8">
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-200 max-w-md w-full">
          <ShoppingBag className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-8">Add some amazing tech products to your cart!</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105"
          >
            <ArrowRight className="h-4 w-4" />
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-slate-800">Your Cart</h1>
          <button
            onClick={clearCart}
            className="text-sm text-red-500 hover:text-red-600 font-semibold transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-xs text-blue-600 font-semibold">{item.category}</span>
                      <h3 className="font-bold text-slate-800 text-sm truncate">{item.name}</h3>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 hover:bg-slate-100 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5 text-slate-600" />
                      </button>
                      <span className="px-3 py-1.5 font-bold text-sm text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5 text-slate-600" />
                      </button>
                    </div>
                    <span className="font-black text-slate-800">
                      ${(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-28">
              <h2 className="text-lg font-black text-slate-800 mb-6">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="font-semibold">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-emerald-600">
                    {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-slate-400">
                    Add ${(150 - subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
                <div className="border-t border-slate-200 pt-3 flex justify-between">
                  <span className="font-black text-slate-800">Total</span>
                  <span className="font-black text-xl text-slate-800">${total.toLocaleString()}</span>
                </div>
              </div>
              <Link
                to="/checkout"
                className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/20"
              >
                Proceed to Checkout →
              </Link>
              <Link
                to="/"
                className="block w-full text-center mt-3 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
