import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { CheckCircle2, CreditCard, Truck, Lock } from "lucide-react";

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    phone: "",
    paymentMethod: "bank",
    cardNumber: "",
    expiry: "",
    cvv: ""
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 150 ? 0 : 9.99;
  const total = subtotal + shipping;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    clearCart();
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl p-12 text-center max-w-md w-full shadow-sm border border-slate-200">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Order Placed! 🎉</h2>
          <p className="text-slate-500 mb-2">Thank you for your purchase.</p>
          <p className="text-slate-400 text-sm mb-8">
            A confirmation email will be sent to <strong>{form.email}</strong>.
            Your order will arrive within 3–5 business days.
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-full transition-all hover:scale-105"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Your cart is empty</h2>
          <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-500 transition-colors inline-block">
            Go Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-slate-800 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
                  <input required name="name" value={form.name} onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm transition-colors" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                  <input required type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm transition-colors" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Address</label>
                  <input required name="address" value={form.address} onChange={handleChange}
                    placeholder="123 Main St"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">City</label>
                  <input required name="city" value={form.city} onChange={handleChange}
                    placeholder="New York"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">ZIP Code</label>
                  <input required name="zip" value={form.zip} onChange={handleChange}
                    placeholder="10001"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm transition-colors" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Payment Details
              </h2>
              {/* Payment Method Selector */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center text-sm">
                    <input type="radio" name="paymentMethod" value="bank" checked={form.paymentMethod === 'bank'} onChange={handleChange} className="mr-2" />
                    Bank Transfer
                  </label>
                  <label className="inline-flex items-center text-sm">
                    <input type="radio" name="paymentMethod" value="cash" checked={form.paymentMethod === 'cash'} onChange={handleChange} className="mr-2" />
                    Card
                  </label>
                  <label className="inline-flex items-center text-sm">
                    <input type="radio" name="paymentMethod" value="store" checked={form.paymentMethod === 'store'} onChange={handleChange} className="mr-2" />
                    Store Pickup
                  </label>
                </div>
              </div>
              {/* Conditional sections */}
              {form.paymentMethod === 'bank' && (
                <div className="mb-4 flex items-center gap-4">
                  <div className="h-24 w-24 bg-slate-100 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 text-xs">QR</div>
                  <span className="text-sm text-slate-600">Scan QR to pay to account XYZ123</span>
                </div>
              )}
              {form.paymentMethod === 'store' && (
                <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-800">Pickup Address</p>
                  <p className="text-xs text-slate-600">123 Main St, Cityville, Country</p>
                  <p className="text-xs text-slate-600">Phone: +1 234 567 890</p>
                </div>
              )}
              {/* Card Details – shown only for card (online) payment */}
              {form.paymentMethod === 'cash' && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Card Number</label>
                    <input required name="cardNumber" value={form.cardNumber} onChange={handleChange}
                      placeholder="1234 5678 9012 3456" maxLength={19}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm transition-colors font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Expiry</label>
                      <input required name="expiry" value={form.expiry} onChange={handleChange}
                        placeholder="MM/YY" maxLength={5}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm transition-colors font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">CVV</label>
                      <input required name="cvv" value={form.cvv} onChange={handleChange}
                        placeholder="123" maxLength={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm transition-colors font-mono" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-sm text-slate-400">
                    <Lock className="h-3.5 w-3.5" />
                    Your payment info is encrypted and secure.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Summary */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-28">
              <h2 className="font-black text-slate-800 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-800 flex-shrink-0">
                      ${(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 pt-4 space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-emerald-600">{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-black text-slate-800 text-base pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Place Order
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
