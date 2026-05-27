import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { CheckCircle2, CreditCard, Truck, MapPin, Phone, Store, QrCode, Loader2, Mail } from "lucide-react";
import { sendBankTransferNotification, sendStorePickupNotification } from "../services/emailService";
import { formatVND, toVndInt } from "../utils/money";

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    phone: "",
    paymentMethod: "bank",
  });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Tự động điền thông tin của user đã đăng nhập
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setForm(prev => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
          phone: u.phone || prev.phone,
          address: u.address || prev.address,
          city: u.city || prev.city,
          zip: u.zip || prev.zip,
        }));
      } catch (e) {
        console.error("Lỗi parse user từ localStorage ở Checkout", e);
      }
    }

    if (token) {
      const fetchLatestProfile = async () => {
        try {
          const response = await fetch("https://shoptech-backend.onrender.com/api/users/profile", {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setForm(prev => ({
              ...prev,
              name: data.name || prev.name,
              email: data.email || prev.email,
              phone: data.phone || prev.phone,
              address: data.address || prev.address,
              city: data.city || prev.city,
              zip: data.zip || prev.zip,
            }));
            
            // Đồng bộ lại localStorage user
            const updatedLocalUser = {
              ...JSON.parse(localStorage.getItem("user")),
              name: data.name,
              email: data.email,
              phone: data.phone,
              address: data.address,
              city: data.city,
              zip: data.zip
            };
            localStorage.setItem("user", JSON.stringify(updatedLocalUser));
          }
        } catch (err) {
          console.warn("Lỗi lấy thông tin cá nhân mới nhất tại Checkout, dùng dữ liệu cũ:", err);
        }
      };
      fetchLatestProfile();
    }
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + toVndInt(item.price) * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      if (form.paymentMethod === 'bank') {
        await sendBankTransferNotification({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          zip: form.zip,
          cart,
          total,
        });
      } else {
        await sendStorePickupNotification({ cart, total });
      }
    } catch (err) {
      console.error('Email notification error:', err);
    }

    setSending(false);
    setSubmitted(true);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    clearCart();
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center max-w-md w-full shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
            {form.paymentMethod === 'bank' ? 'Đơn hàng đã được ghi nhận! 🎉' : 'Cảm ơn bạn! 🎉'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            {form.paymentMethod === 'bank' 
              ? 'Vui lòng chuyển khoản theo thông tin QR ở trên. Đơn hàng sẽ được xử lý sau khi xác nhận thanh toán.'
              : 'Đơn hàng của bạn đã được ghi nhận. Hãy đến cửa hàng để nhận sản phẩm!'}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mb-8">
            <Mail className="inline h-3.5 w-3.5 mr-1" />
            Thông báo đã được gửi đến email shop.
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-full transition-all hover:scale-105"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8 text-center transition-colors duration-300">
        <div className="max-w-md">
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Giỏ hàng trống</h2>
          <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-500 transition-colors inline-block">
            Đi mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-8">Thanh toán</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Selector */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 transition-colors duration-300">
              <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Phương thức thanh toán
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bank Transfer Option */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: 'bank' })}
                  className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    form.paymentMethod === 'bank'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500 shadow-md shadow-blue-500/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    form.paymentMethod === 'bank' 
                      ? 'bg-blue-100 dark:bg-blue-900/50' 
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <QrCode className={`h-5 w-5 ${form.paymentMethod === 'bank' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${form.paymentMethod === 'bank' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      Chuyển khoản ngân hàng
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Quét QR để thanh toán</p>
                  </div>
                  {form.paymentMethod === 'bank' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </button>

                {/* Store Pickup Option */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: 'store' })}
                  className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    form.paymentMethod === 'store'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    form.paymentMethod === 'store' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/50' 
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <Store className={`h-5 w-5 ${form.paymentMethod === 'store' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${form.paymentMethod === 'store' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      Mua tại cửa hàng
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Thanh toán tiền mặt</p>
                  </div>
                  {form.paymentMethod === 'store' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Bank Transfer: QR + Shipping Form */}
            {form.paymentMethod === 'bank' && (
              <>
                {/* QR Code Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 transition-colors duration-300">
                  <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Thông tin chuyển khoản
                  </h2>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                      {/* QR Placeholder - Replace with your actual QR image */}
                      <img 
                        src="/qr-payment.png" 
                        alt="QR Code thanh toán" 
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="text-center p-4"><p class="text-4xl mb-2">📱</p><p class="text-xs text-slate-500 dark:text-slate-400 font-medium">QR Code<br/>Thanh toán</p></div>';
                        }}
                      />
                    </div>
                    <div className="text-center sm:text-left space-y-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Quét mã QR để chuyển khoản</p>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-semibold">Ngân hàng:</span> [Tên ngân hàng]
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-semibold">Số tài khoản:</span> [Số tài khoản]
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-semibold">Chủ tài khoản:</span> [Tên chủ TK]
                        </p>
                      </div>
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                          💡 Nội dung chuyển khoản: <strong>SHOPTECH [Tên bạn] [SĐT]</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 transition-colors duration-300">
                  <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Thông tin giao hàng
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Họ và tên</label>
                      <input required name="name" value={form.name} onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-sm transition-colors placeholder-slate-400 dark:placeholder-slate-500" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Email</label>
                      <input required type="email" name="email" value={form.email} onChange={handleChange}
                        placeholder="email@example.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-sm transition-colors placeholder-slate-400 dark:placeholder-slate-500" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Số điện thoại</label>
                      <input required name="phone" type="tel" value={form.phone} onChange={handleChange}
                        placeholder="0901 234 567"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-sm transition-colors placeholder-slate-400 dark:placeholder-slate-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Địa chỉ giao hàng</label>
                      <input required name="address" value={form.address} onChange={handleChange}
                        placeholder="123 Đường ABC, Phường XYZ"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-sm transition-colors placeholder-slate-400 dark:placeholder-slate-500" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Thành phố</label>
                      <input required name="city" value={form.city} onChange={handleChange}
                        placeholder="Hồ Chí Minh"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-sm transition-colors placeholder-slate-400 dark:placeholder-slate-500" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Mã bưu điện</label>
                      <input required name="zip" value={form.zip} onChange={handleChange}
                        placeholder="70000"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-sm transition-colors placeholder-slate-400 dark:placeholder-slate-500" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Store Pickup Info */}
            {form.paymentMethod === 'store' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 transition-colors duration-300">
                <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Thông tin cửa hàng
                </h2>
                <div className="space-y-4">
                  {/* Store Address */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-white">Địa chỉ cửa hàng</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        123 Đường ABC, Phường XYZ, Quận 1, TP. Hồ Chí Minh
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Giờ mở cửa: 8:00 - 21:00 (Thứ 2 - Chủ nhật)
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-white">Liên hệ</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Hotline: <a href="tel:+84901234567" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">0901 234 567</a>
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Zalo: <a href="https://zalo.me/0901234567" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">0901 234 567</a>
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Email: <a href="mailto:dodinhnam160703@gmail.com" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">dodinhnam160703@gmail.com</a>
                      </p>
                    </div>
                  </div>

                  {/* Map placeholder */}
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Google Maps</p>
                      <a
                        href="https://maps.google.com/?q=123+Đường+ABC,+Quận+1,+HCMC"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold mt-1 inline-block"
                      >
                        Mở trong Google Maps →
                      </a>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      🏪 Bạn có thể đến cửa hàng để xem trực tiếp sản phẩm và thanh toán tiền mặt. Liên hệ trước qua Hotline để kiểm tra hàng còn!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Summary */}
          <div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sticky top-28 transition-colors duration-300">
              <h2 className="font-black text-slate-800 dark:text-white mb-4">Đơn hàng</h2>
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      <img src={item.images?.[0] || item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex-shrink-0">
                      {formatVND(toVndInt(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {form.paymentMethod === 'store' ? 'Không áp dụng' : (shipping === 0 ? "MIỄN PHÍ" : formatVND(shipping))}
                  </span>
                </div>
                <div className="flex justify-between font-black text-slate-800 dark:text-white text-base pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Tổng cộng</span>
                  <span>{formatVND(total)}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : form.paymentMethod === 'bank' ? (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Xác nhận đã chuyển khoản
                  </>
                ) : (
                  <>
                    <Store className="h-4 w-4" />
                    Xác nhận mua tại cửa hàng
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
