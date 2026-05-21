import React from "react";

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-12 px-4 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div>
          <div className="flex items-center gap-2 text-white mb-4">
            <div className="bg-primary-600 p-1.5 rounded-lg text-white">
              {/* placeholder icon */}
            </div>
            <span className="font-extrabold text-lg tracking-tight">ShopSphere</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Handcrafting premium accessories and selecting state of the art electronics for your everyday lifestyle needs since 2026.
          </p>
        </div>
        <div>
          <h4 className="text-white font-extrabold text-sm mb-4 tracking-wider uppercase">Products</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#" className="hover:text-white transition-colors">New Arrivals</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Best Sellers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Accessories</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Electronics</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-extrabold text-sm mb-4 tracking-wider uppercase">Support</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Shipping & Returns</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Warranty Info</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-extrabold text-sm mb-4 tracking-wider uppercase">Tech Stack</h4>
          <p className="text-xs leading-relaxed text-slate-500 mb-2">
            This storefront runs on Vite + React, styled using Tailwind CSS, powered by an Express backend and MongoDB.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">React 19</span>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">Vite 6</span>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">Tailwind v4</span>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">Node 24</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-slate-800 pt-8 text-center text-xs text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>© 2026 ShopSphere E-commerce. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
