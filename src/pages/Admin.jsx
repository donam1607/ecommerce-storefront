import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Users, ShoppingBag, X, Loader2, AlertCircle, ShieldAlert, Check, Upload, BarChart3, Boxes, UserCog, Wallet } from "lucide-react";
import { formatVND, toVndInt } from "../utils/money";

const API_URL = "https://shoptech-backend.onrender.com";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("stats"); // stats | products | users
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  
  // Auth states
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Modal Product states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add"); // add | edit
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Laptop");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("10");
  const [formBadge, setFormBadge] = useState("");
  const [formImages, setFormImages] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSpecs, setFormSpecs] = useState("");
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Modal User states (NEW)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalType, setUserModalType] = useState("add"); // add | edit
  const [editingUserId, setEditingUserId] = useState(null);
  const [formUserName, setFormUserName] = useState("");
  const [formUserEmail, setFormUserEmail] = useState("");
  const [formUserPassword, setFormUserPassword] = useState("");
  const [formUserRole, setFormUserRole] = useState("user");
  const [formUserPhone, setFormUserPhone] = useState("");
  const [formUserAddress, setFormUserAddress] = useState("");
  const [formUserCity, setFormUserCity] = useState("");
  const [formUserZip, setFormUserZip] = useState("");
  const [submittingUser, setSubmittingUser] = useState(false);

  const navigate = useNavigate();

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) {
      setIsAdmin(false);
      setCheckingAuth(false);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      if (user.role === "admin") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      setIsAdmin(false);
    }
    setCheckingAuth(false);
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    setLoadingProducts(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data.map((p) => ({ ...p, price: toVndInt(p.price) })) : []);
      } else {
        const data = await response.json();
        setError(data.message || "Không thể lấy danh sách sản phẩm.");
      }
    } catch (err) {
      setError("Lỗi kết nối server khi tải danh sách sản phẩm.");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const data = await response.json();
        setError(data.message || "Không thể lấy danh sách người dùng.");
      }
    } catch (err) {
      setError("Lỗi kết nối server khi tải danh sách người dùng.");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      // Luôn tải data cho thống kê + các tab
      fetchProducts();
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const totalProducts = products.length;
  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const totalStock = products.reduce((sum, p) => sum + (Number(p.countInStock) || 0), 0);
  const inventoryValue = products.reduce(
    (sum, p) => sum + toVndInt(p.price) * (Number(p.countInStock) || 0),
    0
  );
  const categoryStats = products.reduce((acc, p) => {
    const key = p.category || "Khác";
    const prev = acc[key] || { count: 0, stock: 0, value: 0 };
    const stock = Number(p.countInStock) || 0;
    const price = toVndInt(p.price);
    acc[key] = {
      count: prev.count + 1,
      stock: prev.stock + stock,
      value: prev.value + price * stock,
    };
    return acc;
  }, {});

  // Open Modal Product
  const openModal = (type, prod = null) => {
    setModalType(type);
    if (type === "edit" && prod) {
      setEditingId(prod.id);
      setFormName(prod.name);
      setFormCategory(prod.category);
      setFormPrice(prod.price.toString());
      setFormStock(prod.countInStock.toString());
      setFormBadge(prod.badge || "");
      setFormImages(prod.images ? prod.images.join(", ") : "");
      setFormDesc(prod.description);
      setFormSpecs(prod.specs ? prod.specs.join("\n") : "");
    } else {
      setEditingId(null);
      setFormName("");
      setFormCategory("Laptop");
      setFormPrice("");
      setFormStock("10");
      setFormBadge("");
      setFormImages("");
      setFormDesc("");
      setFormSpecs("");
    }
    setIsModalOpen(true);
  };

  // Handle Product CRUD
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSubmittingProduct(true);
    
    const token = localStorage.getItem("token");
    const payload = {
      name: formName,
      category: formCategory,
      price: parseFloat(formPrice),
      images: formImages.split(",").map(i => i.trim()).filter(Boolean),
      description: formDesc,
      specs: formSpecs.split("\n").map(s => s.trim()).filter(Boolean),
      countInStock: parseInt(formStock),
      badge: formBadge || null
    };

    const url = modalType === "add" 
      ? `${API_URL}/api/products` 
      : `${API_URL}/api/products/${editingId}`;
    
    const method = modalType === "add" ? "POST" : "PUT";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchProducts();
      } else {
        const data = await response.json();
        alert(data.message || "Đã xảy ra lỗi khi lưu sản phẩm.");
      }
    } catch (err) {
      alert("Không thể kết nối đến server.");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const data = await response.json();
        alert(data.message || "Không thể xóa sản phẩm này.");
      }
    } catch (err) {
      alert("Không thể kết nối đến server.");
    }
  };

  // Handle User Role & Delete
  const handleRoleChange = async (userId, newRole) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.message || "Không thể cập nhật quyền người dùng.");
      }
    } catch (err) {
      alert("Không thể kết nối đến server.");
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (currentUser?.id === userId) {
      alert("Bạn không thể tự xóa tài khoản của chính mình!");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${name}"?`)) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.message || "Không thể xóa người dùng này.");
      }
    } catch (err) {
      alert("Không thể kết nối đến server.");
    }
  };

  // Open Modal User (NEW)
  const openUserModal = (type, userObj = null) => {
    setUserModalType(type);
    if (type === "edit" && userObj) {
      setEditingUserId(userObj.id);
      setFormUserName(userObj.name);
      setFormUserEmail(userObj.email);
      setFormUserPassword(""); // Để trống nếu không muốn đổi
      setFormUserRole(userObj.role || "user");
      setFormUserPhone(userObj.phone || "");
      setFormUserAddress(userObj.address || "");
      setFormUserCity(userObj.city || "");
      setFormUserZip(userObj.zip || "");
    } else {
      setEditingUserId(null);
      setFormUserName("");
      setFormUserEmail("");
      setFormUserPassword("");
      setFormUserRole("user");
      setFormUserPhone("");
      setFormUserAddress("");
      setFormUserCity("");
      setFormUserZip("");
    }
    setIsUserModalOpen(true);
  };

  // Handle User Create/Edit Submit (NEW)
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setSubmittingUser(true);

    const token = localStorage.getItem("token");
    const payload = {
      name: formUserName,
      email: formUserEmail,
      role: formUserRole,
      phone: formUserPhone || null,
      address: formUserAddress || null,
      city: formUserCity || null,
      zip: formUserZip || null
    };

    if (formUserPassword) {
      payload.password = formUserPassword;
    } else if (userModalType === "add") {
      alert("Vui lòng điền mật khẩu cho thành viên mới!");
      setSubmittingUser(false);
      return;
    }

    const url = userModalType === "add"
      ? `${API_URL}/api/users`
      : `${API_URL}/api/users/${editingUserId}`;
    
    const method = userModalType === "add" ? "POST" : "PUT";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setIsUserModalOpen(false);
        fetchUsers();
      } else {
        alert(data.message || "Đã xảy ra lỗi khi lưu thông tin thành viên.");
      }
    } catch (err) {
      alert("Không thể kết nối đến server.");
    } finally {
      setSubmittingUser(false);
    }
  };

  // Handle local image upload for product (NEW)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("image", file);

    setUploadingImage(true);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        const currentImages = formImages ? formImages.split(",").map(i => i.trim()).filter(Boolean) : [];
        currentImages.push(data.imageUrl);
        setFormImages(currentImages.join(", "));
      } else {
        alert(data.message || "Tải ảnh lên thất bại.");
      }
    } catch (err) {
      alert("Lỗi kết nối khi tải ảnh lên.");
    } finally {
      setUploadingImage(false);
      e.target.value = ""; // reset file input
    }
  };

  // Remove single image from list (NEW)
  const handleRemoveImage = (indexToRemove) => {
    const currentImages = formImages ? formImages.split(",").map(i => i.trim()).filter(Boolean) : [];
    const updatedImages = currentImages.filter((_, idx) => idx !== indexToRemove);
    setFormImages(updatedImages.join(", "));
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 text-center transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col items-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Từ chối truy cập</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">
            Bạn cần đăng nhập bằng tài khoản Quản Trị Viên (Admin) để có quyền truy cập trang này.
          </p>
          <div className="flex gap-4 w-full">
            <button
              onClick={() => navigate("/login")}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              Đăng nhập Admin
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all active:scale-95"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Bảng Điều Khiển Admin</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Chào mừng, {currentUser?.name}. Quản lý sản phẩm và phân quyền người dùng.</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "stats"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Thống kê
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "products"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Sản phẩm
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "users"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <Users className="h-4 w-4" />
              Thành viên
            </button>
          </div>
        </div>

        {/* Tab 0: Stats */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-650 dark:text-blue-400 flex items-center justify-center">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Sản phẩm</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{totalProducts}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tổng số mặt hàng</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-650 dark:text-emerald-400 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Thành viên</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{totalUsers}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Trong đó admin: {totalAdmins}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-650 dark:text-amber-400 flex items-center justify-center">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Giá trị kho</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{formatVND(inventoryValue)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tổng giá trị tồn kho</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-650 dark:text-purple-400 flex items-center justify-center">
                  <UserCog className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Tồn kho</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{totalStock}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tổng số lượng sản phẩm</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-colors">
              <div className="p-6 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between gap-4">
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Thống kê theo danh mục</h2>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {loadingProducts || loadingUsers ? "Đang cập nhật..." : "Cập nhật theo dữ liệu hiện tại"}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-800 transition-colors">
                      <th className="px-6 py-4">Danh mục</th>
                      <th className="px-6 py-4">Số sản phẩm</th>
                      <th className="px-6 py-4">Tồn kho</th>
                      <th className="px-6 py-4">Giá trị kho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {Object.entries(categoryStats)
                      .sort((a, b) => b[1].value - a[1].value)
                      .map(([cat, s]) => (
                        <tr key={cat} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors text-sm text-slate-700 dark:text-slate-350">
                          <td className="px-6 py-4 font-bold text-slate-850 dark:text-white">{cat}</td>
                          <td className="px-6 py-4">{s.count}</td>
                          <td className="px-6 py-4">{s.stock}</td>
                          <td className="px-6 py-4 font-black">{formatVND(s.value)}</td>
                        </tr>
                      ))}
                    {Object.keys(categoryStats).length === 0 && (
                      <tr>
                        <td className="px-6 py-10 text-center text-slate-450 dark:text-slate-500" colSpan={4}>
                          Chưa có dữ liệu sản phẩm để thống kê.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Product Management */}
        {activeTab === "products" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-colors">
            
            {/* Action Bar */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Danh sách sản phẩm</h2>
              <button
                onClick={() => openModal("add")}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95"
              >
                <Plus className="h-4.5 w-4.5" />
                Thêm sản phẩm mới
              </button>
            </div>

            {loadingProducts ? (
              <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-650" /></div>
            ) : error ? (
              <div className="p-12 text-center text-red-500 flex flex-col items-center gap-2">
                <AlertCircle className="h-10 w-10 text-red-500" />
                <span>{error}</span>
                <button onClick={fetchProducts} className="mt-4 px-4 py-2 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-bold rounded-lg">Thử lại</button>
              </div>
            ) : products.length === 0 ? (
              <div className="p-20 text-center text-slate-400">Không có sản phẩm nào trong cửa hàng. Hãy thêm sản phẩm đầu tiên!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-800 transition-colors">
                      <th className="px-6 py-4">Ảnh</th>
                      <th className="px-6 py-4">Tên sản phẩm</th>
                      <th className="px-6 py-4">Danh mục</th>
                      <th className="px-6 py-4">Giá tiền</th>
                      <th className="px-6 py-4">Kho hàng</th>
                      <th className="px-6 py-4">Nhãn (Badge)</th>
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors text-sm text-slate-700 dark:text-slate-350">
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-750">
                            <img
                              src={prod.images && prod.images.length > 0 ? prod.images[0] : ""}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100&auto=format&fit=crop" }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-850 dark:text-white max-w-[200px] truncate">{prod.name}</td>
                        <td className="px-6 py-4">{prod.category}</td>
                        <td className="px-6 py-4 font-black">{formatVND(prod.price)}</td>
                        <td className="px-6 py-4 font-semibold">{prod.countInStock} cái</td>
                        <td className="px-6 py-4">
                          {prod.badge ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-900/20 text-blue-650 dark:text-blue-400">
                              {prod.badge}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openModal("edit", prod)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-200 rounded-xl transition-all"
                              title="Sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 rounded-xl transition-all"
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: User Management */}
        {activeTab === "users" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-colors">
            
            {/* Action Bar (NEW) */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Danh sách thành viên</h2>
              <button
                onClick={() => openUserModal("add")}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95"
              >
                <Plus className="h-4.5 w-4.5" />
                Thêm thành viên mới
              </button>
            </div>

            {loadingUsers ? (
              <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-650" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-800 transition-colors">
                      <th className="px-6 py-4">Tên người dùng</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Ngày đăng ký</th>
                      <th className="px-6 py-4">Quyền hạn (Role)</th>
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors text-sm text-slate-700 dark:text-slate-350">
                        <td className="px-6 py-4 font-bold text-slate-850 dark:text-white flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs uppercase">
                            {u.name.charAt(0)}
                          </div>
                          <span>{u.name}</span>
                          {currentUser?.id === u.id && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">Bạn</span>
                          )}
                        </td>
                        <td className="px-6 py-4">{u.email}</td>
                        <td className="px-6 py-4 text-xs opacity-80">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                        <td className="px-6 py-4">
                          <select
                            disabled={currentUser?.id === u.id}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                          >
                            <option value="user">User (Thường)</option>
                            <option value="admin">Admin (Quản trị)</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openUserModal("edit", u)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-200 rounded-xl transition-all"
                              title="Sửa thông tin"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              disabled={currentUser?.id === u.id}
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 rounded-xl transition-all disabled:opacity-40"
                              title="Xóa người dùng"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal Add/Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto transition-colors">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-150 dark:border-slate-850">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {modalType === "add" ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Laptop Asus ZenBook"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Danh mục *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Keyboard">Keyboard</option>
                    <option value="Headphones">Headphones</option>
                    <option value="Smartphone">Smartphone</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Giá bán (VND) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1299.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Số lượng tồn kho *</label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Nhãn hiển thị (Badge)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Best Seller, New, Sale"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Images */}
                <div className="col-span-2 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450">Danh sách ảnh sản phẩm *</label>
                    
                    {/* Local File Upload Button */}
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-95">
                      {uploadingImage ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 text-blue-600" />
                      )}
                      <span>{uploadingImage ? "Đang tải lên..." : "Tải ảnh từ máy tính"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <textarea
                    rows="2"
                    placeholder="Link_anh_1, Link_anh_2, Link_anh_3"
                    value={formImages}
                    onChange={(e) => setFormImages(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />

                  {/* Visual Image Preview Grid (NEW) */}
                  {formImages && formImages.split(",").map(i => i.trim()).filter(Boolean).length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-450">Xem trước & Sắp xếp ({formImages.split(",").map(i => i.trim()).filter(Boolean).length} ảnh):</span>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {formImages.split(",").map(i => i.trim()).filter(Boolean).map((imgUrl, idx) => (
                          <div key={idx} className="relative group aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img
                              src={imgUrl}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100&auto=format&fit=crop" }}
                            />
                            {/* Hover Overlay with Delete Button */}
                            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all active:scale-90"
                                title="Xóa ảnh này"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <span className="block text-[10px] text-slate-400">Có thể dùng ảnh có sẵn trong thư mục `public/images/products/...` hoặc link online hoặc bấm nút trên để chọn file từ máy.</span>
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Mô tả ngắn *</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Nhập mô tả ngắn sản phẩm..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>

                {/* Specs */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Thông số kỹ thuật (Mỗi thông số một dòng)</label>
                  <textarea
                    rows="3"
                    placeholder="Intel Core i7&#10;16GB RAM&#10;512GB SSD"
                    value={formSpecs}
                    onChange={(e) => setFormSpecs(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-250 font-bold text-sm rounded-xl transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="flex items-center gap-1.5 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-75"
                >
                  {submittingProduct ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <Check className="h-4.5 w-4.5" />
                  )}
                  {modalType === "add" ? "Thêm sản phẩm" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit User (NEW) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto transition-colors">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-150 dark:border-slate-850">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {userModalType === "add" ? "Thêm thành viên mới" : "Chỉnh sửa thành viên"}
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={formUserName}
                    onChange={(e) => setFormUserName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Địa chỉ Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    value={formUserEmail}
                    onChange={(e) => setFormUserEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">
                    Mật khẩu {userModalType === "add" ? "*" : "(Để trống nếu không đổi)"}
                  </label>
                  <input
                    type="password"
                    required={userModalType === "add"}
                    placeholder={userModalType === "add" ? "Nhập mật khẩu..." : "Nhập mật khẩu mới..."}
                    value={formUserPassword}
                    onChange={(e) => setFormUserPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Vai trò (Role) *</label>
                  <select
                    value={formUserRole}
                    onChange={(e) => setFormUserRole(e.target.value)}
                    disabled={editingUserId === currentUser?.id}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="user">User (Thường)</option>
                    <option value="admin">Admin (Quản trị)</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 0912345678"
                    value={formUserPhone}
                    onChange={(e) => setFormUserPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Địa chỉ</label>
                  <input
                    type="text"
                    placeholder="Số nhà, ngõ/đường..."
                    value={formUserAddress}
                    onChange={(e) => setFormUserAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Thành phố</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hà Nội, TP. HCM..."
                    value={formUserCity}
                    onChange={(e) => setFormUserCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Zip */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Mã bưu điện (Zip)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 100000"
                    value={formUserZip}
                    onChange={(e) => setFormUserZip(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="flex items-center gap-1.5 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-75"
                >
                  {submittingUser ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <Check className="h-4.5 w-4.5" />
                  )}
                  {userModalType === "add" ? "Thêm thành viên" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
