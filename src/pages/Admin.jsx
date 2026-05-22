import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Users, ShoppingBag, X, Loader2, AlertCircle, ShieldAlert, Check } from "lucide-react";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("products"); // products | users
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
      const response = await fetch("http://localhost:5000/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
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
      const response = await fetch("http://localhost:5000/api/users", {
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
      if (activeTab === "products") {
        fetchProducts();
      } else if (activeTab === "users") {
        fetchUsers();
      }
    }
  }, [isAdmin, activeTab]);

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
      ? "http://localhost:5000/api/products" 
      : `http://localhost:5000/api/products/${editingId}`;
    
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
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
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
      const response = await fetch(`http://localhost:5000/api/users/${userId}/role`, {
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
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
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
                        <td className="px-6 py-4 font-black">${prod.price.toLocaleString()}</td>
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
            <div className="p-6 border-b border-slate-200 dark:border-slate-850">
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Quản lý phân quyền người dùng</h2>
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
                          <button
                            disabled={currentUser?.id === u.id}
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 rounded-xl transition-all disabled:opacity-40"
                            title="Xóa người dùng"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Giá bán ($) *</label>
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
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 mb-1.5">Mảng ảnh (Images URLs) - Phân cách bởi dấu phẩy</label>
                  <textarea
                    rows="2"
                    placeholder="Link_anh_1, Link_anh_2, Link_anh_3"
                    value={formImages}
                    onChange={(e) => setFormImages(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                  <span className="text-[10px] text-slate-400">Có thể dùng ảnh có sẵn trong thư mục `public/images/products/...` hoặc link online.</span>
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
    </div>
  );
}
