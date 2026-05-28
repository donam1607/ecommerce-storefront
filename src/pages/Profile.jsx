import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, Lock, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Shield, Eye, EyeOff } from "lucide-react";

export default function Profile() {
  const API_URL = "https://shoptech-backend.onrender.com";

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [result, setResult] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  
  // Password states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      navigate("/login");
      return;
    }

    // Lấy thông tin user mới nhất từ Backend để đảm bảo chính xác
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/profile`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
          
          // Điền dữ liệu vào form
          setName(data.name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setCity(data.city || "");
          setZip(data.zip || "");
        } else {
          // Fallback sang localStorage nếu API lỗi
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
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setResult(null);

    // Kiểm tra mật khẩu trùng khớp nếu người dùng nhập mật khẩu mới
    if (password && password !== confirmPassword) {
      setResult({ success: false, message: "Mật khẩu xác nhận không trùng khớp!" });
      setUpdating(false);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      return;
    }

    const token = localStorage.getItem("token");
    const payload = {
      name,
      email,
      phone,
      address,
      city,
      zip
    };

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
        
        // Cập nhật lại localStorage user
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
        
        // Reset password fields
        setPassword("");
        confirmPassword && setConfirmPassword("");
        
        // Tải lại navbar state
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        {/* Quay lại trang chủ */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8 text-sm font-medium">
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang chủ
        </Link>

        {/* Tiêu đề trang */}
        <div className="text-center sm:text-left mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2.5">
            <span>Tài Khoản Cá Nhân</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý và thay đổi thông tin giao hàng cùng bảo mật của bạn.
          </p>
        </div>

        {/* Thông báo kết quả */}
        {result && (
          <div className={`mb-6 p-4 rounded-2xl border transition-all ${
            result.success 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400" 
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400"
          }`}>
            <div className="flex items-center gap-2 mb-1 font-bold">
              {result.success ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              {result.success ? "Thành công!" : "Lỗi"}
            </div>
            <p className="text-sm">{result.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Thông tin cá nhân */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm transition-colors duration-300">
            <h2 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Thông tin liên hệ & Giao hàng
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Họ tên */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Họ và tên *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Địa chỉ Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    placeholder="Ví dụ: 0901234567"
                  />
                </div>
              </div>

              {/* Địa chỉ giao hàng */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Địa chỉ giao hàng mặc định</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    placeholder="123 Đường ABC, Phường XYZ"
                  />
                </div>
              </div>

              {/* Thành phố */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Thành phố / Tỉnh</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                  placeholder="Ví dụ: Hồ Chí Minh"
                />
              </div>

              {/* Mã bưu điện */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Mã bưu điện (Zip Code)</label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                  placeholder="Ví dụ: 70000"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bảo mật & Đổi mật khẩu */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm transition-colors duration-300">
            <h2 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Đổi mật khẩu bảo mật
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Mật khẩu mới */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
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

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
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
            
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 italic">
              💡 Mẹo bảo mật: Hãy đổi mật khẩu định kỳ và sử dụng mật khẩu mạnh gồm ký tự đặc biệt, số, chữ in hoa.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl transition-all active:scale-[0.98]"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={updating}
              className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all active:scale-[0.98] disabled:opacity-75"
            >
              {updating && <Loader2 className="h-4 w-4 animate-spin" />}
              {updating ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
