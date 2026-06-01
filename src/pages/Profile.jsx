import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { 
  User, Mail, Phone, MapPin, Lock, Loader2, CheckCircle2, 
  AlertCircle, ArrowLeft, Shield, Eye, EyeOff, ClipboardList, 
  ExternalLink, ShoppingBag, Trash2, Calendar, Star, Check, X,
  Clock, Truck, RotateCcw, AlertTriangle, ShieldCheck
} from "lucide-react";
import { formatVND, toVndInt } from "../utils/money";

export default function Profile() {
  const API_URL = "https://shoptech-backend.onrender.com";
  const { addToCart } = useCart();

  // Navigation tab state: 'info' | 'orders'
  const [activeTab, setActiveTab] = useState("info");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [result, setResult] = useState(null);

  // Form states (Info Tab)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  
  // Password states (Info Tab)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // User Orders History states
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderStatusFilter] = useState("all"); // all | pending | processing | shipping | delivered | cancelled

  // Order Details Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Cancel order modal states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelingOrder, setCancelingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("Thay đổi ý định mua hàng");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Return request modal states
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returningOrder, setReturningOrder] = useState(null);
  const [returnReason, setReturnReason] = useState("Sản phẩm lỗi kỹ thuật / Lỗi phần cứng");
  const [returnDesc, setReturnDesc] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const navigate = useNavigate();

  // Load profile data and orders
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      navigate("/login");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/profile`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
          
          setName(data.name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setCity(data.city || "");
          setZip(data.zip || "");
        } else {
          const localUser = JSON.parse(savedUser);
          setUser(localUser);
          setName(localUser.name || "");
          setEmail(localUser.email || "");
          setPhone(localUser.phone || "");
          setAddress(localUser.address || "");
          setCity(localUser.city || "");
          setZip(localUser.zip || "");
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin cá nhân:", err);
        const localUser = JSON.parse(savedUser);
        setUser(localUser);
        setName(localUser.name || "");
        setEmail(localUser.email || "");
        setPhone(localUser.phone || "");
        setAddress(localUser.address || "");
        setCity(localUser.city || "");
        setZip(localUser.zip || "");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
    fetchUserOrders();
  }, [navigate]);

  const fetchUserOrders = async () => {
    setLoadingOrders(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/orders/my-orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Lỗi tải đơn hàng của khách hàng:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setResult(null);

    if (password && password !== confirmPassword) {
      setResult({ success: false, message: "Mật khẩu xác nhận không trùng khớp!" });
      setUpdating(false);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      return;
    }

    const token = localStorage.getItem("token");
    const payload = { name, email, phone, address, city, zip };

    if (password) {
      payload.password = password;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: "Cập nhật thông tin cá nhân thành công!" });
        
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
        setUser(data);
        setPassword("");
        setConfirmPassword("");
        
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setResult({ success: false, message: data.message || "Cập nhật thất bại." });
      }
    } catch (err) {
      setResult({ success: false, message: "Lỗi kết nối server khi cập nhật." });
    } finally {
      setUpdating(false);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  // ---------------------------------------------------------
  // ACTION: HỦY ĐƠN HÀNG PHÍA KHÁCH HÀNG (CANCEL ORDER)
  // ---------------------------------------------------------
  const handleCancelOrderSubmit = async (e) => {
    e.preventDefault();
    setSubmittingCancel(true);
    const token = localStorage.getItem("token");
    const reasonText = cancelReason === "Khác" ? customCancelReason : cancelReason;

    try {
      const response = await fetch(`${API_URL}/api/orders/${cancelingOrder.id}/cancel-client`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ cancelReason: reasonText })
      });

      if (response.ok) {
        alert("Đã hủy đơn hàng thành công!");
        setIsCancelModalOpen(false);
        setIsDetailModalOpen(false);
        fetchUserOrders();
      } else {
        const data = await response.json();
        alert(data.message || "Lỗi khi hủy đơn hàng.");
      }
    } catch (err) {
      alert("Lỗi kết nối server.");
    } finally {
      setSubmittingCancel(false);
    }
  };

  // ---------------------------------------------------------
  // ACTION: MUA LẠI ĐƠN HÀNG CŨ (RE-ORDER)
  // ---------------------------------------------------------
  const handleReorder = async (order) => {
    // 1. Kiểm tra tồn kho của từng sản phẩm trước khi thêm vào giỏ
    try {
      const response = await fetch(`${API_URL}/api/products`);
      if (!response.ok) throw new Error("Không thể tải thông tin kho sản phẩm.");
      const currentProducts = await response.json();

      let someOutofStock = false;
      const failedItems = [];

      for (const item of order.orderItems) {
        const match = currentProducts.find(p => p.id === item.productId);
        if (!match || match.countInStock < item.quantity) {
          someOutofStock = true;
          failedItems.push(item.name);
        }
      }

      if (someOutofStock) {
        alert(`❌ Không thể mua lại toàn bộ đơn hàng do một số sản phẩm đã hết hàng hoặc không đủ tồn kho:\n- ${failedItems.join("\n- ")}`);
        return;
      }

      // 2. Nếu đủ kho, thêm tất cả vào giỏ hàng
      for (const item of order.orderItems) {
        addToCart({
          id: item.productId,
          name: item.name,
          price: item.price,
          images: [item.image],
          category: item.category || "Laptop",
          badge: item.badge || "New"
        });
      }

      alert("🎉 Đã thêm toàn bộ sản phẩm của đơn hàng cũ vào giỏ hàng thành công!");
      navigate("/cart");
    } catch (err) {
      alert("Lỗi khi mua lại đơn hàng: " + err.message);
    }
  };

  // ---------------------------------------------------------
  // ACTION: YÊU CẦU ĐỔI TRẢ / BẢO HÀNH (RETURN CLAIM)
  // ---------------------------------------------------------
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReturn(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/api/orders/${returningOrder.id}/return-client`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ reason: returnReason, description: returnDesc })
      });

      if (response.ok) {
        alert("Đã gửi yêu cầu đổi trả / bảo hành của bạn thành công! Bộ phận kỹ thuật sẽ sớm liên hệ lại.");
        setIsReturnModalOpen(false);
        setIsDetailModalOpen(false);
        fetchUserOrders();
      } else {
        const data = await response.json();
        alert(data.message || "Lỗi gửi yêu cầu.");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Helpers badge colors
  const getOrderStatusBadge = (status) => {
    const st = status || 'pending';
    if (st === 'pending') return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    if (st === 'processing') return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900';
    if (st === 'shipping') return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900';
    if (st === 'delivered') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900';
    if (st === 'cancelled') return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900';
    if (st === 'returned') return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getOrderStatusText = (status) => {
    const st = status || 'pending';
    if (st === 'pending') return 'Chờ duyệt';
    if (st === 'processing') return 'Đang đóng gói';
    if (st === 'shipping') return 'Đang giao hàng';
    if (st === 'delivered') return 'Giao thành công';
    if (st === 'cancelled') return 'Đã hủy đơn';
    if (st === 'returned') return 'Yêu cầu đổi trả';
    return st;
  };

  const getBadgeClass = (badge) => {
    if (!badge) return "bg-blue-600 text-white";
    const b = badge.toLowerCase().trim();
    if (b.includes("new")) return "bg-emerald-600 text-white";
    if (b.includes("like new") || b.includes("likenew") || b.includes("99")) return "bg-indigo-650 text-white";
    if (b.includes("old") || b.includes("cũ")) return "bg-slate-500 text-white";
    return "bg-blue-600 text-white";
  };

  // Filter orders local list
  const filteredOrders = orders.filter(o => {
    if (orderFilter === "all") return true;
    return o.orderStatus === orderFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-650" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Quay lại trang chủ */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6 text-xs font-bold uppercase tracking-wider">
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang chủ
        </Link>

        {/* Tiêu đề & Chọn Tab */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Tài Khoản ShopTech</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Quản lý thông tin liên hệ, lịch sử đặt hàng và hành trình đơn hàng.
            </p>
          </div>
          
          {/* Navigation tab bar */}
          <div className="flex bg-slate-200/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                activeTab === "info"
                  ? "bg-white dark:bg-slate-800 text-blue-650 dark:text-blue-400 shadow-sm"
                  : "text-slate-650 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
              }`}
            >
              <User size={14} />
              Thông tin liên hệ
            </button>
            <button
              onClick={() => { setActiveTab("orders"); fetchUserOrders(); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                activeTab === "orders"
                  ? "bg-white dark:bg-slate-800 text-blue-650 dark:text-blue-400 shadow-sm"
                  : "text-slate-650 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
              }`}
            >
              <ClipboardList size={14} />
              Lịch sử đơn hàng
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------
            TAB 1: THÔNG TIN LIÊN HỆ & BẢO MẬT
            --------------------------------------------------------- */}
        {activeTab === "info" && (
          <form onSubmit={handleSubmitProfile} className="space-y-6">
            {result && (
              <div className={`p-4 rounded-2xl border transition-all ${
                result.success 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400" 
                  : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400"
              }`}>
                <div className="flex items-center gap-2 mb-1 font-bold text-sm">
                  {result.success ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  {result.success ? "Thành công!" : "Gặp lỗi"}
                </div>
                <p className="text-xs">{result.message}</p>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm transition-colors duration-300">
              <h2 className="text-sm font-black text-slate-800 dark:text-white mb-6 uppercase tracking-wider text-blue-650 dark:text-blue-400 flex items-center gap-2">
                <User className="h-4.5 w-4.5" />
                Thông tin giao nhận mặc định
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Họ và tên *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-blue-500 transition-all font-semibold"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Địa chỉ Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-blue-500 transition-all font-semibold"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-blue-500 transition-all font-semibold"
                      placeholder="Ví dụ: 0901234567"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Địa chỉ giao hàng nhận máy</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-blue-500 transition-all font-semibold"
                      placeholder="123 Đường ABC, Phường XYZ"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Thành phố / Tỉnh</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-blue-500 transition-all font-semibold"
                    placeholder="Ví dụ: Hồ Chí Minh"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Mã bưu điện (Zip Code)</label>
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-blue-500 transition-all font-semibold"
                    placeholder="Ví dụ: 70000"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm transition-colors duration-300">
              <h2 className="text-sm font-black text-slate-800 dark:text-white mb-6 uppercase tracking-wider text-blue-650 dark:text-blue-400 flex items-center gap-2">
                <Shield className="h-4.5 w-4.5" />
                Đổi mật khẩu tài khoản
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-blue-500 transition-all font-semibold"
                      placeholder="Bỏ trống nếu không muốn đổi"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-1.5 block">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-blue-500 transition-all font-semibold"
                      placeholder="Bỏ trống nếu không muốn đổi"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={updating}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                {updating ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        )}

        {/* ---------------------------------------------------------
            TAB 2: LỊCH SỬ ĐƠN HÀNG (ORDER HISTORY LIST)
            --------------------------------------------------------- */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-fade-in">
            {/* Bộ lọc đơn hàng phía Client */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-wrap gap-2 items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Lọc theo trạng thái:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "all", label: "Tất cả" },
                  { key: "pending", label: "Chờ duyệt" },
                  { key: "processing", label: "Đang xử lý" },
                  { key: "shipping", label: "Đang giao" },
                  { key: "delivered", label: "Thành công" },
                  { key: "cancelled", label: "Đã hủy" }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setOrderStatusFilter(item.key)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                      orderFilter === item.key
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Danh sách các khối đơn hàng */}
            {loadingOrders ? (
              <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-blue-650 mx-auto" /></div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-bold text-xs">
                Bạn chưa có đơn đặt hàng nào trong danh mục này!
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((o) => {
                  const firstItem = o.orderItems?.[0];
                  const otherCount = o.orderItems ? o.orderItems.length - 1 : 0;
                  
                  return (
                    <div 
                      key={o.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4 hover:border-slate-350 dark:hover:border-slate-700 transition-all"
                    >
                      {/* Header khối đơn */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-black text-slate-850 dark:text-white">Mã đơn: #${o.id}</span>
                          <span className="text-[10px] text-slate-400 font-bold"><Calendar size={10} className="inline mr-1" />{new Date(o.createdAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${getOrderStatusBadge(o.orderStatus)}`}>
                            {getOrderStatusText(o.orderStatus)}
                          </span>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            {o.paymentStatus === 'paid' ? 'Đã thanh toán ✅' : 'Chưa thanh toán ⏳'}
                          </span>
                        </div>
                      </div>

                      {/* Thông tin sản phẩm đại diện */}
                      {firstItem && (
                        <div className="flex gap-4 items-start py-1">
                          <img 
                            src={firstItem.image} 
                            alt={firstItem.name} 
                            className="w-14 h-14 object-cover rounded-xl border border-slate-100 dark:border-slate-800 flex-shrink-0" 
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-850 dark:text-white line-clamp-1">{firstItem.name}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${getBadgeClass(firstItem.badge)}`}>
                                {firstItem.badge || 'New'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">SL: x{firstItem.quantity}</span>
                              <span className="text-[10px] text-slate-500 font-extrabold">{formatVND(toVndInt(firstItem.price))}</span>
                            </div>
                            {otherCount > 0 && (
                              <p className="text-[9px] text-slate-400 mt-2 font-bold italic">và {otherCount} sản phẩm công nghệ khác...</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dòng tiền & Nút Hành động */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-3.5 gap-3">
                        <div className="text-xs">
                          <span className="text-slate-400">Tổng số tiền thanh toán: </span>
                          <span className="text-sm font-black text-slate-905 dark:text-white">{formatVND(toVndInt(o.totalAmount))}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedOrder(o); setIsDetailModalOpen(true); }}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-xs"
                          >
                            Xem chi tiết đơn
                          </button>
                          
                          {/* Nút hủy nhanh */}
                          {o.orderStatus === 'pending' && (
                            <button
                              onClick={() => { setCancelingOrder(o); setIsCancelModalOpen(true); }}
                              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-500 font-bold text-[10px] border border-rose-200/20 rounded-xl transition-all cursor-pointer shadow-xs"
                            >
                              Hủy đơn hàng
                            </button>
                          )}
                          
                          {/* Nút mua lại nhanh */}
                          {['cancelled', 'delivered', 'returned'].includes(o.orderStatus) && (
                            <button
                              onClick={() => handleReorder(o)}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-xs"
                            >
                              Mua lại đơn cũ
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------
            MODAL: XEM CHI TIẾT ĐƠN HÀNG PHÍA KHÁCH HÀNG (TIMELINE & DETAILS)
            --------------------------------------------------------- */}
        {isDetailModalOpen && selectedOrder && (() => {
          // Tính toán các giá trị hóa đơn
          const calculateSubtotal = () => {
            return selectedOrder.orderItems.reduce((acc, item) => acc + (toVndInt(item.price) * item.quantity), 0);
          };
          const subtotal = calculateSubtotal();
          const discount = toVndInt(selectedOrder.discountAmount || 0);
          const finalTotal = subtotal + toVndInt(selectedOrder.shippingFee || 0) - discount;

          // Xử lý Timeline
          const statusOrder = ["pending", "processing", "shipping", "delivered"];
          const currentIdx = statusOrder.indexOf(selectedOrder.orderStatus);
          
          return (
            <div 
              onClick={() => setIsDetailModalOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto transition-all animate-scale-in"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-850">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Hành Trình Đơn Hàng #{selectedOrder.id}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold">Ngày đặt đơn: {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-500 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 text-xs">
                  
                  {/* TIẾN TRÌNH ĐƠN HÀNG (ORDER TIMELINE) */}
                  {['cancelled', 'returned'].includes(selectedOrder.orderStatus) ? (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="text-rose-500 flex-shrink-0 mt-0.5" size={18} />
                      <div>
                        <h4 className="font-black text-rose-800 dark:text-rose-400 uppercase tracking-wide">
                          {selectedOrder.orderStatus === 'cancelled' ? 'Đã hủy đơn hàng ❌' : 'Đã trả hàng / Bảo hành 💜'}
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                          {selectedOrder.orderStatus === 'cancelled' 
                            ? `Lý do hủy đơn: "${selectedOrder.cancelReason || 'Khách hàng tự hủy đơn'}"`
                            : `Chi tiết bảo hành: "${selectedOrder.returnRequest?.reason || 'Lỗi thiết bị phần cứng'}" (${selectedOrder.returnRequest?.description || ''})`
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/40">
                      <div className="relative flex justify-between items-center w-full">
                        {/* Thanh đường nối đằng sau */}
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 z-0"></div>
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 z-0"
                          style={{ width: `${currentIdx === -1 ? 0 : (currentIdx / 3) * 100}%` }}
                        ></div>

                        {/* Điểm các bước */}
                        {[
                          { key: "pending", label: "Đã Đặt Đơn", icon: Clock },
                          { key: "processing", label: "Đã Xác Nhận", icon: Check },
                          { key: "shipping", label: "Đang Giao", icon: Truck },
                          { key: "delivered", label: "Thành Công", icon: ShieldCheck }
                        ].map((step, idx) => {
                          const StepIcon = step.icon;
                          const isDone = currentIdx >= idx;
                          const isActive = currentIdx === idx;
                          
                          return (
                            <div key={idx} className="flex flex-col items-center relative z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                                isDone
                                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                                  : "bg-white border-slate-300 text-slate-450 dark:bg-slate-800 dark:border-slate-700"
                              } ${isActive ? "scale-110 ring-4 ring-blue-500/20" : ""}`}>
                                <StepIcon size={14} />
                              </div>
                              <span className={`text-[9px] font-black uppercase mt-2 ${
                                isDone ? "text-blue-650 dark:text-blue-400" : "text-slate-400"
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* KHỐI THÔNG TIN VẬN CHUYỂN */}
                    <div className="bg-slate-50 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2.5">
                      <h4 className="font-black uppercase text-blue-600 dark:text-blue-400 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                        <Truck size={14} />
                        <span>Thông tin giao nhận</span>
                      </h4>
                      <p><span className="text-slate-400">Người nhận máy:</span> <strong>{selectedOrder.customerName}</strong></p>
                      <p><span className="text-slate-400">Số điện thoại:</span> <strong>{selectedOrder.customerPhone}</strong></p>
                      <p><span className="text-slate-400">Địa chỉ giao:</span> <strong className="text-slate-650 dark:text-slate-350">{selectedOrder.customerAddress}</strong></p>
                      {selectedOrder.shippingUnit && (
                        <p>
                          <span className="text-slate-400">Đơn vị VC:</span> <strong>{selectedOrder.shippingUnit}</strong>
                        </p>
                      )}
                      {selectedOrder.trackingNumber && (
                        <p>
                          <span className="text-slate-400">Mã vận đơn:</span> 
                          <span className="ml-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 font-mono font-bold rounded">
                            {selectedOrder.trackingNumber}
                          </span>
                          <a 
                            href={`https://www.google.com/search?q=${selectedOrder.shippingUnit}+${selectedOrder.trackingNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-blue-500 underline ml-2 font-bold cursor-pointer"
                          >
                            Tra cứu hành trình 🌐
                          </a>
                        </p>
                      )}
                    </div>

                    {/* KHỐI THÔNG TIN THANH TOÁN */}
                    <div className="bg-slate-50 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
                      <h4 className="font-black uppercase text-blue-600 dark:text-blue-400 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                        <CreditCard size={14} />
                        <span>Dòng tiền thanh toán</span>
                      </h4>
                      <div className="flex justify-between text-slate-500">
                        <span>Tiền hàng tạm tính:</span>
                        <span className="font-bold">{formatVND(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Phí giao hàng bưu cục:</span>
                        <span className="font-bold">+{formatVND(toVndInt(selectedOrder.shippingFee || 0))}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-red-500 font-semibold">
                          <span>Mã giảm giá áp dụng ({selectedOrder.couponCode}):</span>
                          <span>-{formatVND(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-900 dark:text-white font-black text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span>Tổng tiền thực chi:</span>
                        <span className="text-blue-600 dark:text-blue-400">{formatVND(finalTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* DANH SÁCH CHI TIẾT SẢN PHẨM MUA */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-4.5 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-slate-750 dark:text-slate-300">
                      Chi tiết cấu hình sản phẩm mua
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedOrder.orderItems.map((item, index) => {
                        const serialNum = selectedOrder.serialNumbers?.[item.productId] || selectedOrder.serialNumbers?.[index];
                        return (
                          <div key={index} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                            <img src={item.image} alt={item.name} className="w-11 h-11 object-cover rounded-lg border border-slate-100 dark:border-slate-800 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-slate-900 dark:text-white">{item.name}</h5>
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${getBadgeClass(item.badge)}`}>
                                  {item.badge || 'New'}
                                </span>
                                <span className="text-slate-400 font-bold">SL: x{item.quantity}</span>
                                <span className="text-slate-500 font-bold">Giá: {formatVND(toVndInt(item.price))}</span>
                              </div>
                              {serialNum && (
                                <p className="text-[10px] text-blue-500 font-bold mt-2 font-mono">🎯 Số Serial Number: {serialNum} (Bảo hành tự động)</p>
                              )}
                            </div>
                            <div className="sm:text-right whitespace-nowrap">
                              <p className="text-[10px] text-slate-400">Thành tiền:</p>
                              <p className="font-black text-slate-900 dark:text-white mt-0.5">{formatVND(toVndInt(item.price) * item.quantity)}</p>
                              {selectedOrder.orderStatus === "delivered" && (
                                <button
                                  type="button"
                                  onClick={() => { setIsDetailModalOpen(false); navigate(`/product/${item.productId}`); }}
                                  className="mt-2 flex items-center justify-center gap-1 px-2.5 py-1 text-[9px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-650 rounded border border-amber-200/30 transition-all cursor-pointer"
                                >
                                  <Star size={10} className="fill-amber-400 stroke-amber-400" />
                                  Viết đánh giá
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* KHỐI NÚT HÀNH ĐỘNG DƯỚI ĐƠN HÀNG */}
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-5">
                    {/* Nút hủy đơn (Chờ duyệt) */}
                    {selectedOrder.orderStatus === 'pending' && (
                      <button
                        type="button"
                        onClick={() => { setCancelingOrder(selectedOrder); setIsCancelModalOpen(true); }}
                        className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-500 font-extrabold text-[11px] border border-rose-200/20 rounded-xl transition-all cursor-pointer"
                      >
                        Yêu cầu hủy đơn hàng ❌
                      </button>
                    )}

                    {/* Yêu cầu đổi trả bảo hành (Đã giao thành công) */}
                    {selectedOrder.orderStatus === 'delivered' && (
                      <button
                        type="button"
                        onClick={() => { setReturningOrder(selectedOrder); setIsReturnModalOpen(true); }}
                        className="px-5 py-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 text-purple-650 dark:text-purple-400 font-extrabold text-[11px] border border-purple-200/20 rounded-xl transition-all cursor-pointer"
                      >
                        Gửi yêu cầu Đổi trả / Bảo hành 🛡️
                      </button>
                    )}

                    {/* Mua lại đơn cũ */}
                    {['cancelled', 'delivered', 'returned'].includes(selectedOrder.orderStatus) && (
                      <button
                        type="button"
                        onClick={() => handleReorder(selectedOrder)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-500/20"
                      >
                        Mua lại đơn hàng này
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => setIsDetailModalOpen(false)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-extrabold text-[11px] rounded-xl transition-all cursor-pointer"
                    >
                      Đóng lại
                    </button>
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

        {/* ---------------------------------------------------------
            MODAL: NHẬP LÝ DO HỦY ĐƠN HÀNG (POPUP)
            --------------------------------------------------------- */}
        {isCancelModalOpen && (
          <div 
            onClick={() => setIsCancelModalOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999999] flex items-center justify-center p-4"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-in"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-slate-905 dark:text-white">Lý Do Hủy Đơn Hàng #{cancelingOrder?.id}</h4>
                <button onClick={() => setIsCancelModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
              </div>
              <form onSubmit={handleCancelOrderSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 mb-1.5">Vui lòng chọn lý do hủy đơn *</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <option value="Thay đổi ý định mua hàng">Thay đổi ý định mua hàng</option>
                    <option value="Tìm thấy sản phẩm giá rẻ hơn nơi khác">Tìm thấy sản phẩm giá rẻ hơn nơi khác</option>
                    <option value="Đặt nhầm cấu hình / Nhầm màu sắc">Đặt nhầm cấu hình / Nhầm màu sắc</option>
                    <option value="Thời gian giao nhận hàng quá lâu">Thời gian giao nhận hàng quá lâu</option>
                    <option value="Muốn thay đổi phương thức thanh toán">Muốn thay đổi phương thức thanh toán</option>
                    <option value="Khác">Lý do khác...</option>
                  </select>
                </div>

                {cancelReason === "Khác" && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-450 mb-1.5">Lý do hủy cụ thể *</label>
                    <textarea
                      value={customCancelReason}
                      onChange={(e) => setCustomCancelReason(e.target.value)}
                      required
                      placeholder="Mô tả lý do hủy đơn hàng của bạn để shop rút kinh nghiệm dịch vụ..."
                      rows="3"
                      className="w-full px-3.5 py-2 border border-slate-250 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-805 dark:text-slate-100 outline-none"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCancel}
                    className="px-5 py-2 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl disabled:bg-red-400"
                  >
                    {submittingCancel ? "Đang hủy..." : "Xác nhận Hủy Đơn"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------
            MODAL: YÊU CẦU ĐỔI TRẢ / BẢO HÀNH (POPUP)
            --------------------------------------------------------- */}
        {isReturnModalOpen && (
          <div 
            onClick={() => setIsReturnModalOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999999] flex items-center justify-center p-4"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-in"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-slate-905 dark:text-white">Yêu Cầu Đổi Trả / Bảo Hành Đơn #{returningOrder?.id}</h4>
                <button onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
              </div>
              <form onSubmit={handleReturnSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 mb-1.5">Lý do yêu cầu đổi trả / bảo hành *</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <option value="Sản phẩm lỗi kỹ thuật / Lỗi phần cứng">Sản phẩm lỗi kỹ thuật / Lỗi phần cứng</option>
                    <option value="Giao sai cấu hình / Sai sản phẩm đặt mua">Giao sai cấu hình / Sai sản phẩm đặt mua</option>
                    <option value="Sản phẩm trầy xước / Móp méo không giống cam kết">Sản phẩm trầy xước / Móp méo không giống cam kết</option>
                    <option value="Thiếu phụ kiện kèm theo đơn hàng">Thiếu phụ kiện kèm theo đơn hàng</option>
                    <option value="Sản phẩm hư hỏng do vận chuyển">Sản phẩm hư hỏng do vận chuyển</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 mb-1.5">Mô tả chi tiết lỗi phần cứng *</label>
                  <textarea
                    value={returnDesc}
                    onChange={(e) => setReturnDesc(e.target.value)}
                    required
                    placeholder="Vui lòng mô tả cụ thể tình trạng lỗi của thiết bị để kỹ thuật viên ShopTech chuẩn bị phương án bảo hành tốt nhất cho bạn..."
                    rows="4"
                    className="w-full px-3.5 py-2 border border-slate-250 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-805 dark:text-slate-100 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-330 font-bold rounded-xl"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReturn}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl disabled:bg-purple-400"
                  >
                    {submittingReturn ? "Đang gửi..." : "Gửi yêu cầu bảo hành"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
