import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Mail, Phone, MapPin, Shield, Truck, RefreshCw, HeartHandshake } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-slate-950 dark:bg-slate-950 border-t border-slate-800/60 mt-20 transition-colors duration-300">
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand column */}
        <div className="lg:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4 group w-fit">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Shop<span className="text-blue-400">Tech</span>
            </span>
          </Link>
          <p className="text-xs leading-relaxed text-slate-500 mb-5 max-w-[220px]">
            Chuyên cung cấp thiết bị công nghệ chính hãng, bảo hành dài hạn và dịch vụ hậu mãi tận tâm từ 2024.
          </p>
          <div className="space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2 hover:text-slate-300 transition-colors">
              <Mail className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
              <span>support@shoptech.vn</span>
            </div>
            <div className="flex items-center gap-2 hover:text-slate-300 transition-colors">
              <Phone className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
              <span>1800 6789 (Miễn phí)</span>
            </div>
            <div className="flex items-center gap-2 hover:text-slate-300 transition-colors">
              <MapPin className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
              <span>Hà Nội & TP. Hồ Chí Minh</span>
            </div>
          </div>
        </div>

        {/* Products */}
        <div>
          <h4 className="text-white font-black text-xs mb-5 tracking-widest uppercase">Sản Phẩm</h4>
          <ul className="space-y-3 text-xs text-slate-500">
            {["Laptop & Máy tính", "Màn hình", "Bàn phím & Chuột", "Tai nghe & Âm thanh", "Điện thoại", "Phụ kiện"].map(item => (
              <li key={item}>
                <Link to="/" className="hover:text-blue-400 transition-colors font-medium">{item}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white font-black text-xs mb-5 tracking-widest uppercase">Hỗ Trợ</h4>
          <ul className="space-y-3 text-xs text-slate-500">
            {[
              { label: "Chính sách bảo hành", href: "#" },
              { label: "Hướng dẫn mua hàng", href: "#" },
              { label: "Chính sách đổi trả", href: "#" },
              { label: "Câu hỏi thường gặp", href: "#" },
              { label: "Liên hệ kỹ thuật viên", href: "#" },
            ].map(({ label, href }) => (
              <li key={label}>
                <a href={href} className="hover:text-blue-400 transition-colors font-medium">{label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust badges */}
        <div>
          <h4 className="text-white font-black text-xs mb-5 tracking-widest uppercase">Cam Kết</h4>
          <div className="space-y-3">
            {[
              { icon: Truck, label: "Giao hàng siêu tốc", sub: "2h nội thành HN/HCM", color: "text-blue-400 bg-blue-950/40" },
              { icon: Shield, label: "Bảo hành chính hãng", sub: "Lên đến 2 năm", color: "text-emerald-400 bg-emerald-950/40" },
              { icon: RefreshCw, label: "Đổi trả 30 ngày", sub: "Hoàn tiền 100%", color: "text-amber-400 bg-amber-950/40" },
              { icon: HeartHandshake, label: "Hỗ trợ 24/7", sub: "Kỹ thuật viên chuyên nghiệp", color: "text-purple-400 bg-purple-950/40" },
            ].map(({ icon: Icon, label, sub, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`h-7 w-7 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-slate-300 text-xs font-bold leading-tight">{label}</p>
                  <p className="text-slate-600 text-[10px] mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800/50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <p>© 2026 ShopTech Vietnam. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-5">
            {["Chính sách bảo mật", "Điều khoản dịch vụ", "Cookie"].map(item => (
              <a key={item} href="#" className="hover:text-slate-400 transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
