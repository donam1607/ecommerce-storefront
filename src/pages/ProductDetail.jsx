import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { ShoppingCart, Star, ArrowLeft, Shield, Truck, RefreshCw, Check } from "lucide-react";
import { PRODUCTS } from "../data/products";


export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  const product = PRODUCTS.find((p) => p.id === parseInt(id));

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <p className="text-6xl mb-4">🔍</p>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Product not found</h2>
        <p className="text-slate-500 mb-6">The product you're looking for doesn't exist.</p>
        <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-500 transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-8 text-sm font-medium">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          {/* Image */}
          <div className="bg-slate-100 rounded-2xl overflow-hidden aspect-square">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">{product.category}</span>
            <h1 className="text-3xl font-black text-slate-900 mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                ))}
              </div>
              <span className="font-bold text-slate-700 text-sm">{product.rating}</span>
              <span className="text-slate-400 text-sm">({product.reviews} reviews)</span>
            </div>

            <p className="text-slate-600 mb-6">{product.description}</p>

            {/* Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {product.specs.map((spec, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  {spec}
                </div>
              ))}
            </div>

            {/* Price & Actions */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-black text-slate-900">${product.price.toLocaleString()}</span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-semibold text-slate-700">Qty:</span>
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 hover:bg-slate-100 transition-colors font-bold text-slate-700"
                >−</button>
                <span className="px-4 py-2 font-bold text-slate-800 border-x border-slate-300">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-2 hover:bg-slate-100 transition-colors font-bold text-slate-700"
                >+</button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all ${
                added
                  ? "bg-emerald-500 text-white"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-98"
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              {added ? "Added to Cart! ✓" : "Add to Cart"}
            </button>

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
              <div className="flex flex-col items-center text-center gap-1">
                <Truck className="h-5 w-5 text-blue-600" />
                <span className="text-xs text-slate-600 font-medium">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-xs text-slate-600 font-medium">2-Year Warranty</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                <span className="text-xs text-slate-600 font-medium">30-Day Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
