import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { CheckCircle2, CreditCard, Truck, MapPin, Phone, Store, QrCode, Loader2, Mail, Tag, Package } from "lucide-react";
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

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsValidatingCoupon(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const response = await fetch("https://shoptech-backend.onrender.com/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          cartItems: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: toVndInt(item.price),
            quantity: item.quantity,
            category: item.category,
            badge: item.badge
          }))
        })
      });

      const data = await response.json();
      if (response.ok && data.isValid) {
        setAppliedCoupon(data.coupon);
        setDiscountAmount(Number(data.discountAmount));
        setCouponSuccess(`Áp dụng mã ${data.coupon.code} thành công! Giảm ${formatVND(data.discountAmount)}`);
      } else {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponError(data.message || "Mã giảm giá không hợp lệ!");
      }
    } catch (err) {
      console.error("Lỗi validate coupon:", err);
      setCouponError("Không thể kết nối đến máy chủ để kiểm tra mã giảm giá!");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError("");
    setCouponSuccess("");
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

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
            headers: { "Authorization": `Bearer ${token}` }
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
            const updatedLocalUser = {
              ...JSON.parse(localStorage.getItem("user")),
              name: data.name, email: data.email, phone: data.phone,
              address: data.address, city: data.city, zip: data.zip
            };
            localStorage.setItem("user", JSON.stringify(updatedLocalUser));
          }
        } catch (err) {
          console.warn("Lỗi lấy thông tin cá nhân mới nhất tại Checkout:", err);
        }
      };
      fetchLatestProfile();
    }
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + toVndInt(item.price) * item.quantity, 0);
  const shipping = 0;
  const total = Math.max(0, subtotal + shipping - discountAmount);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const orderPayload = {
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        customerAddress: `${form.address}, ${form.city}, ${form.zip}`,
        paymentMethod: form.paymentMethod,
        totalAmount: total,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        discountAmount: discountAmount,
        orderItems: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: toVndInt(item.price),
          quantity: item.quantity,
          image: item.images?.[0] || item.image,
          badge: item.badge || null
        }))
      };

      await fetch("https://shoptech-backend.onrender.com/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      if (form.paymentMethod === 'bank') {
        await sendBankTransferNotification({
          name: form.name, email: form.email, phone: form.phone,
          address: form.address, city: form.city, zip: form.zip,
          cart, total,
        });
      } else {
        await sendStorePickupNotification({ cart, total });
      }
    } catch (err) {
      console.error('Lỗi khi tạo đơn hàng hoặc gửi email:', err);
    }

    setSending(false);
    setSubmitted(true);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    clearCart();
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm transition-all placeholder-slate-400 dark:placeholder-slate-500 backdrop-blur-sm";
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block";

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 flex items-center justify-center p-8 transition-colors duration-300">
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl p-12 text-center max-w-md w-full shadow-2xl shadow-slate-200/40 dark:shadow-slate-950/40 border border-white/60 dark:border-slate-800/50 animate-scale-in">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/25">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
            {form.paymentMethod === 'bank' ? 'Đơn hàng đã được ghi nhận! 🎉' : 'Cảm ơn bạn! 🎉'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-2 text-sm leading-relaxed">
            {form.paymentMethod === 'bank'
              ? 'Vui lòng chuyển khoản theo thông tin QR ở trên. Đơn hàng sẽ được xử lý sau khi xác nhận thanh toán.'
              : 'Đơn hàng của bạn đã được ghi nhận. Hãy đến cửa hàng để nhận sản phẩm!'}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mb-8">
            <Mail className="inline h-3.5 w-3.5 mr-1" />
            Thông báo đã được gửi đến email shop.
          </p>
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-3.5 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 flex items-center justify-center p-8 text-center transition-colors duration-300">
        <div className="max-w-md">
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Giỏ hàng trống</h2>
          <Link to="/" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity inline-block shadow-lg shadow-blue-500/20">
            Đi mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/10 to-indigo-50/5 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 py-8 px-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white">Thanh toán</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Kiểm tra đơn hàng và hoàn tất thanh toán</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Selector */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
              <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Phương thức thanh toán
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bank Transfer */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: 'bank' })}
                  className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
                    form.paymentMethod === 'bank'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500 shadow-md shadow-blue-500/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.paymentMethod === 'bank' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-slate-100 dark:bg-slate-800'}`}>
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

                {/* Store Pickup */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: 'store' })}
                  className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
                    form.paymentMethod === 'store'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.paymentMethod === 'store' ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-slate-100 dark:bg-slate-800'}`}>
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
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
                  <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Thông tin chuyển khoản
                  </h2>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img
                        src={`https://img.vietqr.io/image/tcb-19037793290014-compact.png?amount=${total}&addInfo=SHOPTECH%20${encodeURIComponent(form.name || 'KHACH')}%20${form.phone || ''}&accountName=DO%2520DINH%2520NAM`}
                        alt="QR Code thanh toán tự động qua VietQR"
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="text-center p-4"><p class="text-4xl mb-2">📱</p><p class="text-xs text-slate-500 font-medium">Lỗi tải VietQR<br/>Vui lòng thử lại</p></div>';
                        }}
                      />
                    </div>
                    <div className="text-center sm:text-left space-y-2">
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Quét mã QR VietQR để chuyển khoản tự động</p>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-semibold">Ngân hàng:</span> Techcombank (Kỹ thương Việt Nam)</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-semibold">Số tài khoản:</span> 19037793290014</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-semibold">Chủ tài khoản:</span> ĐỖ ĐÌNH NAM</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-semibold">Số tiền cần chuyển:</span> <strong className="text-red-500">{formatVND(total)}</strong></p>
                      </div>
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                          💡 Nội dung chuyển khoản tự động quét: <strong>SHOPTECH {form.name || 'KHACH'} {form.phone || ''}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
                  <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Thông tin giao hàng
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Họ và tên</label>
                      <input required name="name" value={form.name} onChange={handleChange} placeholder="Nguyễn Văn A" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Số điện thoại</label>
                      <input required name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="0901 234 567" className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Địa chỉ giao hàng</label>
                      <input required name="address" value={form.address} onChange={handleChange} placeholder="123 Đường ABC, Phường XYZ" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Thành phố</label>
                      <input required name="city" value={form.city} onChange={handleChange} placeholder="Hồ Chí Minh" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Mã bưu điện</label>
                      <input required name="zip" value={form.zip} onChange={handleChange} placeholder="70000" className={inputClass} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Store Pickup Info */}
            {form.paymentMethod === 'store' && (
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
                <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Thông tin cửa hàng
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-white">Địa chỉ cửa hàng</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">NGUYỄN ĐẠT STORE, Bình Chánh, Thành phố Hồ Chí Minh</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Giờ mở cửa: 8:00 - 21:00 (Thứ 2 - Chủ nhật)</p>
                    </div>
                  </div>

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
                        Email: <a href="mailto:dodinhnam160703@gmail.com" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">dodinhnam160703@gmail.com</a>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="w-full h-40 bg-slate-200 dark:bg-slate-800">
                      <iframe
                        src="https://maps.google.com/maps?q=NGUY%E1%BB%84N%20%C4%90%E1%BA%A0T%20STORE%20Binh%20Chanh&t=&z=15&ie=UTF8&iwloc=&output=embed"
                        width="100%" height="100%" style={{ border: 0 }}
                        allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                        title="NGUYỄN ĐẠT STORE Google Map"
                      ></iframe>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-center">
                      <a
                        href="https://www.google.com/maps/place/NGUY%E1%BB%84N+%C4%90%E1%BA%A0T+STORE/@10.7906661,106.5683981,17z"
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center justify-center gap-1"
                      >
                        <MapPin className="h-3 w-3" />
                        Mở bản đồ lớn trên Google Maps →
                      </a>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                    <p className="text-xs text-emerald-700 dark:text-amber-400 font-medium">
                      🏪 Bạn có thể đến cửa hàng NGUYỄN ĐẠT STORE để xem trực tiếp sản phẩm và thanh toán tiền mặt. Liên hệ trước để shop chuẩn bị máy nhé!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 sticky top-28 shadow-xl shadow-slate-200/20 dark:shadow-slate-950/20">
              <h2 className="font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Đơn hàng của bạn
              </h2>

              <div className="space-y-3 mb-5">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200/40 dark:border-slate-700/40">
                      <img src={item.images?.[0] || item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">x{item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex-shrink-0">
                      {formatVND(toVndInt(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="border-t border-dashed border-slate-200 dark:border-slate-700/60 pt-4 pb-3">
                <p className="text-xs font-black text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-blue-500" />
                  Mã giảm giá
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã (Ví dụ: OLD50)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon}
                    className="flex-grow bg-slate-50/80 dark:bg-slate-800/80 text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 outline-none uppercase font-semibold disabled:opacity-75 transition-all"
                  />
                  {appliedCoupon ? (
                    <button type="button" onClick={handleRemoveCoupon} className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer">
                      Gỡ bỏ
                    </button>
                  ) : (
                    <button type="button" onClick={handleApplyCoupon} disabled={isValidatingCoupon || !couponCode.trim()}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer">
                      {isValidatingCoupon && <Loader2 className="h-3 w-3 animate-spin" />}
                      Áp dụng
                    </button>
                  )}
                </div>
                {couponError && <p className="text-rose-500 dark:text-rose-400 text-xs font-semibold mt-1.5">{couponError}</p>}
                {couponSuccess && <p className="text-emerald-500 dark:text-emerald-400 text-xs font-semibold mt-1.5">{couponSuccess}</p>}
              </div>

              {/* Totals */}
              <div className="border-t border-slate-200 dark:border-slate-700/60 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{formatVND(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Giảm giá ({appliedCoupon?.code})</span>
                    <span>-{formatVND(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Phí vận chuyển</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {form.paymentMethod === 'store' ? 'Không áp dụng' : (shipping === 0 ? "MIỄN PHÍ" : formatVND(shipping))}
                  </span>
                </div>
                <div className="flex justify-between font-black text-slate-800 dark:text-white text-base pt-3 border-t border-slate-200 dark:border-slate-700/60 mt-1">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600 dark:text-blue-400">{formatVND(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                {sending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Đang xử lý...</>
                ) : form.paymentMethod === 'bank' ? (
                  <><CreditCard className="h-4 w-4" />Xác nhận đã chuyển khoản</>
                ) : (
                  <><Store className="h-4 w-4" />Xác nhận mua tại cửa hàng</>
                )}
              </button>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                <span>🔒 Thanh toán bảo mật</span>
                <span>•</span>
                <span>📦 Giao hàng miễn phí</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
