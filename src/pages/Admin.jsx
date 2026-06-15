import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Users, ShoppingBag, X, Loader2, AlertCircle, ShieldAlert, Check, Upload, BarChart3, Boxes, UserCog, Wallet, Eye, EyeOff, Search, FileText, Printer, Truck, Calendar, Clock, CreditCard, Tag, ChevronLeft, ChevronRight, ChevronDown, Menu } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { formatVND, toVndInt } from "../utils/money";
import RippleButton from "../components/RippleButton";
import { fetchWithRetry, API_BASE as API_URL, authHeaders } from "../utils/api";


const DEFAULT_CATEGORIES = ["Laptop", "Monitor", "Keyboard", "Headphones", "Smartphone", "Accessories"];
const CATEGORY_META_STORAGE_KEY = "admin_category_hierarchy";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function PaginationControls({ page, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }) {
  if (totalItems === 0) return null;
  const safeTotal = Math.max(totalPages, 1);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-800">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
        Hiển thị {start}-{end} / {totalItems}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size}/trang</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="h-9 px-3 inline-flex items-center rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300 text-xs font-black">
          {page}/{safeTotal}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotal, page + 1))}
          disabled={page >= safeTotal}
          className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const getPaged = (items, page, pageSize) => {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  return {
    totalPages,
    currentPage,
    pageItems: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
  };
};

const parseImageList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
};

const serializeImageList = (images) => parseImageList(images).join(", ");

const getBadgeClass = (badge) => {
  if (!badge) return "";
  const b = badge.toLowerCase().trim();
  if (b.includes("like new") || b.includes("likenew") || b.includes("99%") || b.includes("98%") || b.includes("95%")) {
    return "bg-indigo-600 text-white border border-indigo-400";
  }
  if (b.includes("bảo hành") || b.includes("bao hanh") || b.includes("warranty") || b.includes("bh")) {
    return "bg-teal-600 text-white border border-teal-400";
  }
  if (b.includes("old") || b.includes("cũ") || b.includes("cu") || b.includes("used") || b.includes("lướt")) {
    return "bg-slate-500 text-white border border-slate-400";
  }
  if (b.includes("new") || b.includes("mới") || b.includes("moi")) {
    return "bg-emerald-600 text-white border border-emerald-400";
  }
  if (b.includes("best") || b.includes("bán chạy") || b.includes("ban chay") || b.includes("hot")) {
    return "bg-amber-500 text-white border border-amber-400";
  }
  if (b.includes("top") || b.includes("vip") || b.includes("gaming") || b.includes("pro")) {
    return "bg-purple-600 text-white border border-purple-400";
  }
  if (b.includes("sale") || b.includes("giảm giá") || b.includes("giam gia") || b.includes("off") || b.includes("khuyến mãi") || b.includes("khuyen mai")) {
    return "bg-red-600 text-white border border-red-400";
  }
  return "bg-blue-600 text-white border border-blue-400";
};

const getCouponRuntimeStatus = (coupon) => {
  if (coupon.runtimeStatus) return coupon.runtimeStatus;
  const now = new Date();
  if (!coupon.isActive) return "paused";
  if (coupon.startDate && new Date(coupon.startDate) > now) return "scheduled";
  if (coupon.endDate) {
    const endDate = new Date(coupon.endDate);
    endDate.setHours(23, 59, 59, 999);
    if (endDate < now) return "expired";
  }
  if (
    coupon.maxUses !== null &&
    coupon.maxUses !== undefined &&
    Number(coupon.usedCount || 0) >= Number(coupon.maxUses)
  ) {
    return "used_up";
  }
  return "active";
};

const getCouponStatusMeta = (coupon) => {
  const status = getCouponRuntimeStatus(coupon);
  const statusMap = {
    active: {
      label: "Đang chạy",
      className: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200",
    },
    scheduled: {
      label: "Chưa bắt đầu",
      className: "bg-sky-50 dark:bg-sky-950/30 text-sky-600 border-sky-200",
    },
    expired: {
      label: "Hết hạn",
      className: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    },
    used_up: {
      label: "Hết lượt",
      className: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-200",
    },
    paused: {
      label: "Tạm dừng",
      className: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200",
    },
  };
  return statusMap[status] || statusMap.paused;
};

export default function Admin() {
  const { showToast } = useToast();
  const alert = (msg) => {
    const isSuccess = msg.toLowerCase().includes("thành công") || msg.toLowerCase().includes("ok");
    showToast(msg, isSuccess ? "success" : "error");
  };

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("admin_sidebar_collapsed") === "true";
  });

  const getItemsArray = (orderItems) => {
    if (!orderItems) return [];
    if (Array.isArray(orderItems)) return orderItems;
    try {
      const parsed = JSON.parse(orderItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const getOrderItemBadge = (item) => {
    const directBadge = item?.badge || item?.condition || item?.status;
    if (directBadge) return directBadge;

    const linkedProduct = products.find((p) => String(p.id) === String(item?.productId || item?.id));
    return linkedProduct?.badge || "";
  };

  const [activeTab, setActiveTab] = useState("stats");
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);
  const [categoryMeta, setCategoryMeta] = useState(() => {
    try {
      const saved = localStorage.getItem(CATEGORY_META_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (err) {
      return {};
    }
  });
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState(null);

  // Filters for product list
  const [prodSearch, setProdSearch] = useState("");
  const [prodCatFilter, setProdCatFilter] = useState("All");
  const [prodBrandFilter, setProdBrandFilter] = useState("All");
  const [prodSubCatFilter, setProdSubCatFilter] = useState("All");
  const [prodCondFilter, setProdCondFilter] = useState("All");
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(10);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [statsRange, setStatsRange] = useState("30");
  const [trendMetric, setTrendMetric] = useState("revenue");
  const [selectedTrendIndex, setSelectedTrendIndex] = useState(null);
  const [selectedCategoryStat, setSelectedCategoryStat] = useState(null);
  
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
  const [formBrand, setFormBrand] = useState("");
  const [formSubCategory, setFormSubCategory] = useState("");
  const [productPickerOpen, setProductPickerOpen] = useState(null);
  const [subCategorySearch, setSubCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("10");
  const [formBadgePreset, setFormBadgePreset] = useState(""); // New | Like New | Old | Custom
  const [formBadgeCustom, setFormBadgeCustom] = useState("");
  const [formImages, setFormImages] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSpecs, setFormSpecs] = useState("");
  const [formIsHot, setFormIsHot] = useState(false);
  const [formDiscount, setFormDiscount] = useState("0");
  const [formDiscountedPrice, setFormDiscountedPrice] = useState("");
  const [productImageUrlInput, setProductImageUrlInput] = useState("");
  const [draggingImageIndex, setDraggingImageIndex] = useState(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Category management states
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catModalType, setCatModalType] = useState("add"); // add | edit
  const [editingCatName, setEditingCatName] = useState("");
  const [formCatName, setFormCatName] = useState("");
  const [newSubCategoryByCat, setNewSubCategoryByCat] = useState({});
  const [newBrandBySubCategory, setNewBrandBySubCategory] = useState({});

  // Modal User states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalType, setUserModalType] = useState("add"); // add | edit
  const [editingUserId, setEditingUserId] = useState(null);
  const [formUserName, setFormUserName] = useState("");
  const [formUserEmail, setFormUserEmail] = useState("");
  const [formUserPassword, setFormUserPassword] = useState("");
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [formUserRole, setFormUserRole] = useState("user");
  const [formUserPhone, setFormUserPhone] = useState("");
  const [formUserAddress, setFormUserAddress] = useState("");
  const [formUserCity, setFormUserCity] = useState("");
  const [submittingUser, setSubmittingUser] = useState(false);
  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [roleForm, setRoleForm] = useState({ id: "", name: "", description: "", permissions: [] });
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [savingRole, setSavingRole] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Coupon management states
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponPage, setCouponPage] = useState(1);
  const [couponPageSize, setCouponPageSize] = useState(10);
  const [selectedCouponIds, setSelectedCouponIds] = useState([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponModalType, setCouponModalType] = useState("add"); // add | edit
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [submittingCoupon, setSubmittingCoupon] = useState(false);

  const [formCouponCode, setFormCouponCode] = useState("");
  const [formCouponDesc, setFormCouponDesc] = useState("");
  const [formCouponType, setFormCouponType] = useState("percentage"); // percentage | fixed
  const [formCouponValue, setFormCouponValue] = useState("");
  const [formCouponMinOrder, setFormCouponMinOrder] = useState("0");
  const [formCouponCats, setFormCouponCats] = useState([]);
  const [formCouponConds, setFormCouponConds] = useState([]);
  const [formCouponStartDate, setFormCouponStartDate] = useState("");
  const [formCouponEndDate, setFormCouponEndDate] = useState("");
  const [formCouponActive, setFormCouponActive] = useState(true);
  const [formCouponMaxUses, setFormCouponMaxUses] = useState("");

  // Advanced Order Management states
  const [orderSearchKeyword, setOrderSearchKeyword] = useState("");
  const [filterOrderStatus, setFilterOrderStatus] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");
  const [filterUsedOnly, setFilterUsedOnly] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  
  // Order Detail Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [orderDetailShippingFee, setOrderDetailShippingFee] = useState("0");
  const [orderDetailShippingUnit, setOrderDetailShippingUnit] = useState("");
  const [orderDetailTrackingNumber, setOrderDetailTrackingNumber] = useState("");
  const [orderDetailSerialNumbers, setOrderDetailSerialNumbers] = useState({});
  const [orderDetailOrderStatus, setOrderDetailOrderStatus] = useState("pending");
  const [orderDetailPaymentStatus, setOrderDetailPaymentStatus] = useState("pending");
  const [orderDetailCustomerName, setOrderDetailCustomerName] = useState("");
  const [orderDetailCustomerPhone, setOrderDetailCustomerPhone] = useState("");
  const [orderDetailCustomerAddress, setOrderDetailCustomerAddress] = useState("");
  const [orderDetailCancelReason, setOrderDetailCancelReason] = useState("");
  const [savingOrderDetail, setSavingOrderDetail] = useState(false);

  const navigate = useNavigate();

  // Check auth
  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (!token || !userStr) {
        setIsAdmin(false);
        setCheckingAuth(false);
        return;
      }

      try {
        const user = JSON.parse(userStr);
        if (!isMounted) return;
        setCurrentUser(user);

        if (user.role === "admin") {
          setIsAdmin(true);
          setCheckingAuth(false);
          return;
        }

        const response = await fetch(`${API_URL}/api/roles`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = response.ok ? await response.json() : { roles: [], permissionGroups: [] };
        if (!isMounted) return;

        const loadedRoles = data.roles || [];
        setRoles(loadedRoles);
        setPermissionGroups(data.permissionGroups || []);

        const role = loadedRoles.find((item) => item.id === user.role);
        const firstScreen = role?.permissions?.find((permission) => permission.startsWith("screen."));
        setIsAdmin(Boolean(firstScreen));
        if (firstScreen) setActiveTab(firstScreen.replace("screen.", ""));
      } catch (e) {
        if (!isMounted) return;
        setIsAdmin(false);
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    };

    checkAccess();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch coupons
  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/coupons`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCoupons(data);
      }
    } catch (err) {
      console.error("Lỗi tải mã giảm giá:", err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Fetch products

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setError(null);
    try {
      const response = await fetchWithRetry(`${API_URL}/api/products`, {}, 3, 2000);
      if (response.ok) {
        const data = await response.json();
        const mapped = Array.isArray(data) ? data.map((p) => ({ ...p, price: toVndInt(p.price) })) : [];
        setProducts(mapped);
        
        // Dynamic categories extraction
        const cats = Array.from(new Set(mapped.map((p) => p.category))).filter(Boolean);
        setCategoriesList(prev => Array.from(new Set([...prev, ...cats])));
      } else {
        const data = await response.json();
        setError(data.message || "Không thể lấy danh sách sản phẩm.");
      }
    } catch (err) {
      setError("Lỗi kết nối server khi tải danh sách sản phẩm. Server có thể đang khởi động lại.");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetchWithRetry(`${API_URL}/api/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      }, 3, 2000);
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

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/roles`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
        setPermissionGroups(data.permissionGroups || []);
      }
    } catch (err) {
      console.error("Load roles failed:", err);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetchWithRetry(`${API_URL}/api/orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      }, 3, 2000);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        const data = await response.json();
        setError(data.message || "Không thể lấy danh sách đơn hàng.");
      }
    } catch (err) {
      setError("Lỗi kết nối server khi tải danh sách đơn hàng.");
    } finally {
      setLoadingOrders(false);
    }
  };

  // Helper quản lý và cập nhật đơn hàng chuyên nghiệp
  const openOrderDetailModal = (order) => {
    setSelectedOrder(order);
    setOrderDetailShippingFee(order.shippingFee || "0");
    setOrderDetailShippingUnit(order.shippingUnit || "");
    setOrderDetailTrackingNumber(order.trackingNumber || "");
    setOrderDetailSerialNumbers(order.serialNumbers || {});
    setOrderDetailOrderStatus(order.orderStatus || "pending");
    setOrderDetailPaymentStatus(order.paymentStatus || "pending");
    setOrderDetailCustomerName(order.customerName || "");
    setOrderDetailCustomerPhone(order.customerPhone || "");
    setOrderDetailCustomerAddress(order.customerAddress || "");
    setOrderDetailCancelReason(order.cancelReason || "");
    setIsOrderDetailModalOpen(true);
  };

  const handleSaveOrderDetail = async (e) => {
    e.preventDefault();
    if (!canWriteOrders) {
      alert("Bạn không có quyền cập nhật hóa đơn.");
      return;
    }
    setSavingOrderDetail(true);
    const token = localStorage.getItem("token");
    const lockedCustomerInfo = ['shipping', 'delivered', 'cancelled', 'returned'].includes(selectedOrder?.orderStatus);
    const payload = {
      paymentStatus: orderDetailPaymentStatus,
      orderStatus: orderDetailOrderStatus,
      shippingUnit: orderDetailShippingUnit,
      trackingNumber: orderDetailTrackingNumber,
      shippingFee: Number(orderDetailShippingFee),
      serialNumbers: orderDetailSerialNumbers,
      cancelReason: orderDetailCancelReason
    };

    if (!lockedCustomerInfo) {
      payload.customerName = orderDetailCustomerName;
      payload.customerPhone = orderDetailCustomerPhone;
      payload.customerAddress = orderDetailCustomerAddress;
    }

    try {
      const response = await fetch(`${API_URL}/api/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        alert("Cập nhật thông tin đơn hàng thành công!");
        setIsOrderDetailModalOpen(false);
        fetchOrders();
      } else {
        const data = await response.json();
        alert(data.message || "Lỗi khi cập nhật đơn hàng.");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setSavingOrderDetail(false);
    }
  };

  const handlePrintPackingSlip = (order) => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    const itemsHtml = getItemsArray(order.orderItems).map((item, idx) => {
      const sn = order.serialNumbers?.[item.productId] || order.serialNumbers?.[idx] || "Chưa gán S/N";
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;"><span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">${item.badge || 'New'}</span></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-family: monospace; color: #1e293b; font-weight: bold;">${sn}</td>
        </tr>
      `;
    }).join("");

    const dateStr = new Date(order.createdAt).toLocaleString("vi-VN");
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Phiếu Xuất Kho & Giao Hàng #${order.id}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 30px; line-height: 1.5; }
          .ticket { max-width: 700px; margin: 0 auto; border: 2px dashed #94a3b8; padding: 25px; border-radius: 15px; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 800; color: #2563eb; }
          .title { text-align: right; }
          .title h1 { margin: 0; font-size: 20px; text-transform: uppercase; color: #1e293b; }
          .title p { margin: 5px 0 0 0; font-size: 12px; color: #64748b; }
          .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 25px; font-size: 13px; }
          .info-block { background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; }
          .info-block h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          .info-block p { margin: 6px 0; }
          .info-block strong { color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
          th { background: #1e293b; color: #fff; padding: 10px; text-align: left; }
          .footer-signs { display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 10px; text-align: center; margin-top: 40px; font-size: 13px; }
          .signature { height: 70px; }
          @media print {
            body { margin: 0; }
            .ticket { border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <div class="logo">🛒 ShopTech</div>
            <div class="title">
              <h1>Phiếu Giao Hàng & Xuất Kho</h1>
              <p>Mã hóa đơn: <strong>#${order.id}</strong> | Ngày đặt: ${dateStr}</p>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-block">
              <h3>Người Gửi (ShopTech)</h3>
              <p><strong>Cửa hàng</strong>: ShopTech - Siêu thị công nghệ cao cấp</p>
              <p><strong>Hotline</strong>: 1900 8080</p>
              <p><strong>Kho xuất</strong>: Kho Tổng ShopTech Quận 1, TP. HCM</p>
            </div>
            <div class="info-block">
              <h3>Người Nhận (Khách hàng)</h3>
              <p><strong>Họ tên</strong>: ${order.customerName}</p>
              <p><strong>Điện thoại</strong>: ${order.customerPhone}</p>
              <p><strong>Địa chỉ</strong>: ${order.customerAddress}</p>
              <p><strong>Đơn vị VC</strong>: ${order.shippingUnit || 'Giao Hàng Nhanh (GHN)'} | <strong>Vận đơn</strong>: ${order.trackingNumber || 'Chờ cập nhật'}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 45%;">Tên sản phẩm / Cấu hình</th>
                <th style="width: 15%; text-align: center;">Tình trạng</th>
                <th style="width: 10%; text-align: center;">SL</th>
                <th style="width: 30%;">Mã số Serial (S/N)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="font-size: 12px; margin-top: 15px; color: #64748b;">
            <p>💡 <em>* Lưu ý: Khách hàng vui lòng kiểm tra tính nguyên vẹn của tem dán bảo hành và số Serial Number (S/N) trùng khớp trên thân máy trước khi ký nhận hàng.</em></p>
          </div>
          
          <div class="footer-signs">
            <div>
              <p><strong>Người Nhận Hàng</strong></p>
              <p style="font-size: 11px; color: #64748b;">(Ký và ghi rõ họ tên)</p>
              <div class="signature"></div>
            </div>
            <div>
              <p><strong>Nhân Viên Giao Hàng</strong></p>
              <p style="font-size: 11px; color: #64748b;">(Ký và ghi rõ họ tên)</p>
              <div class="signature"></div>
            </div>
            <div>
              <p><strong>Thủ Kho Xác Nhận</strong></p>
              <p style="font-size: 11px; color: #64748b;">(Đã kiểm S/N & đóng gói)</p>
              <div class="signature"></div>
              <p style="font-size: 11px; color: #1e293b;"><strong>${order.approvedBy || 'Đã kiểm duyệt'}</strong></p>
            </div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Xác nhận thanh toán thành công
  const confirmPayment = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn xác nhận đơn hàng này đã thanh toán thành công?")) return;
    
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/paid`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchOrders();
        alert("Xác nhận thanh toán thành công!");
      } else {
        const data = await response.json();
        alert(data.message || "Lỗi xác nhận thanh toán.");
      }
    } catch (err) {
      alert("Lỗi kết nối đến server.");
    }
  };

  // Xóa đơn hàng
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hóa đơn này khỏi hệ thống?")) return;
    
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchOrders();
        alert("Xóa hóa đơn thành công!");
      } else {
        const data = await response.json();
        alert(data.message || "Lỗi xóa hóa đơn.");
      }
    } catch (err) {
      alert("Lỗi kết nối đến server.");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      fetchUsers();
      fetchOrders();
      fetchCoupons();
      fetchRoles();
    }
  }, [isAdmin]);


  const totalProducts = products.length;
  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const totalStock = products.reduce((sum, p) => sum + (Number(p.countInStock) || 0), 0);
  const inventoryValue = products.reduce(
    (sum, p) => sum + toVndInt(p.price) * (Number(p.countInStock) || 0),
    0
  );
  
  // Thống kê doanh thu và số lượng đã bán thực tế từ các đơn hàng "paid"
  const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + toVndInt(o.totalAmount), 0);
  
  let totalSoldItems = 0;
  const productSalesMap = {}; // productId -> { name, quantity, value, image }
  const buyerSalesMap = {};   // email -> { name, phone, totalSpent, ordersCount }

  orders.forEach(o => {
    // Chỉ tính doanh thu/sản phẩm đã bán cho các hóa đơn đã thanh toán
    const isPaid = o.paymentStatus === 'paid';
    
    // Top khách mua (tính trên mọi hóa đơn đã thanh toán để biết khách VIP)
    if (isPaid) {
      const emailKey = o.customerEmail || 'Guest';
      const prevBuyer = buyerSalesMap[emailKey] || { name: o.customerName, phone: o.customerPhone, totalSpent: 0, ordersCount: 0 };
      buyerSalesMap[emailKey] = {
        name: o.customerName,
        phone: o.customerPhone,
        totalSpent: prevBuyer.totalSpent + toVndInt(o.totalAmount),
        ordersCount: prevBuyer.ordersCount + 1
      };
    }

    if (o.orderItems && Array.isArray(o.orderItems)) {
      o.orderItems.forEach(item => {
        const qty = Number(item.quantity) || 0;
        if (isPaid) {
          totalSoldItems += qty;
          
          // Top sản phẩm bán chạy
          const pId = item.productId || item.id;
          const prevProd = productSalesMap[pId] || { name: item.name, quantity: 0, value: 0, image: item.image };
          productSalesMap[pId] = {
            name: item.name,
            image: item.image,
            quantity: prevProd.quantity + qty,
            value: prevProd.value + (toVndInt(item.price) * qty)
          };
        }
      });
    }
  });

  const topBuyers = Object.entries(buyerSalesMap)
    .map(([email, info]) => ({ email, ...info }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  const topSoldProducts = Object.entries(productSalesMap)
    .map(([id, info]) => ({ id, ...info }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const normalizeStatus = (value, fallback = "pending") => String(value || fallback).toLowerCase();
  const getOrderDateValue = (order) => {
    const date = new Date(order.createdAt || order.updatedAt || Date.now());
    return Number.isNaN(date.getTime()) ? new Date() : date;
  };
  const statsRangeDays = statsRange === "all" ? null : Number(statsRange);
  const rangeStartDate = statsRangeDays
    ? new Date(Date.now() - (statsRangeDays - 1) * 24 * 60 * 60 * 1000)
    : null;
  if (rangeStartDate) rangeStartDate.setHours(0, 0, 0, 0);

  const rangedOrders = orders.filter((order) => {
    if (!rangeStartDate) return true;
    return getOrderDateValue(order) >= rangeStartDate;
  });
  const rangedPaidOrders = rangedOrders.filter((order) => normalizeStatus(order.paymentStatus) === "paid");
  const rangedRevenue = rangedPaidOrders.reduce((sum, order) => sum + toVndInt(order.totalAmount), 0);
  const rangedOrderTotal = rangedOrders.length;
  const rangedPaidTotal = rangedPaidOrders.length;
  const averageOrderValue = rangedPaidTotal ? Math.round(rangedRevenue / rangedPaidTotal) : 0;
  const paymentRate = rangedOrderTotal ? Math.round((rangedPaidTotal / rangedOrderTotal) * 100) : 0;
  const pendingOrdersCount = orders.filter((order) => normalizeStatus(order.orderStatus) === "pending").length;
  const shippingOrdersCount = orders.filter((order) => normalizeStatus(order.orderStatus) === "shipping").length;
  const lowStockProducts = products.filter((product) => {
    const stock = Number(product.countInStock) || 0;
    return stock > 0 && stock <= 3;
  }).length;
  const outOfStockProducts = products.filter((product) => (Number(product.countInStock) || 0) === 0).length;

  const getTrendKey = (date) => {
    if (statsRange === "all") {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const getTrendLabel = (key) => {
    if (statsRange === "all") {
      const [year, month] = key.split("-");
      return `T${Number(month)}/${year}`;
    }
    const [, month, day] = key.split("-");
    return `${day}/${month}`;
  };
  const trendMap = {};
  if (statsRangeDays) {
    Array.from({ length: statsRangeDays }).forEach((_, index) => {
      const date = new Date(rangeStartDate);
      date.setDate(rangeStartDate.getDate() + index);
      const key = getTrendKey(date);
      trendMap[key] = { key, label: getTrendLabel(key), revenue: 0, orders: 0, paidOrders: 0, items: 0 };
    });
  }
  rangedOrders.forEach((order) => {
    const date = getOrderDateValue(order);
    const key = getTrendKey(date);
    if (!trendMap[key]) {
      trendMap[key] = { key, label: getTrendLabel(key), revenue: 0, orders: 0, paidOrders: 0, items: 0 };
    }
    trendMap[key].orders += 1;
    if (normalizeStatus(order.paymentStatus) === "paid") {
      trendMap[key].paidOrders += 1;
      trendMap[key].revenue += toVndInt(order.totalAmount);
      trendMap[key].items += getItemsArray(order.orderItems).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }
  });
  const trendData = Object.values(trendMap).sort((a, b) => a.key.localeCompare(b.key));
  const selectedTrend = trendData[selectedTrendIndex ?? Math.max(trendData.length - 1, 0)] || trendData[0] || null;

  const statusLabelMap = {
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
    returned: "Đổi trả",
  };
  const orderStatusStats = ["pending", "confirmed", "shipping", "delivered", "cancelled", "returned"].map((status) => ({
    key: status,
    label: statusLabelMap[status],
    count: rangedOrders.filter((order) => normalizeStatus(order.orderStatus) === status).length,
  }));
  const paymentStatusStats = ["pending", "paid", "failed", "refunded"].map((status) => ({
    key: status,
    label: status === "paid" ? "Đã thanh toán" : status === "failed" ? "Thất bại" : status === "refunded" ? "Hoàn tiền" : "Chờ thanh toán",
    count: rangedOrders.filter((order) => normalizeStatus(order.paymentStatus) === status).length,
  })).filter((item) => item.count > 0 || ["pending", "paid"].includes(item.key));

  const categoryRevenueMap = {};
  rangedPaidOrders.forEach((order) => {
    getItemsArray(order.orderItems).forEach((item) => {
      const linkedProduct = products.find((product) => String(product.id) === String(item.productId || item.id));
      const category = item.category || linkedProduct?.category || "Khác";
      const quantity = Number(item.quantity) || 0;
      const prev = categoryRevenueMap[category] || { label: category, revenue: 0, items: 0, orders: new Set() };
      prev.revenue += toVndInt(item.price) * quantity;
      prev.items += quantity;
      prev.orders.add(order.id);
      categoryRevenueMap[category] = prev;
    });
  });
  const categoryRevenueStats = Object.values(categoryRevenueMap)
    .map((item) => ({ ...item, orders: item.orders.size }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
  const activeCategoryStat = categoryRevenueStats.find((item) => item.label === selectedCategoryStat) || categoryRevenueStats[0] || null;

  const addUnique = (items = [], value) => {
    const clean = String(value || "").trim();
    if (!clean) return items;
    return items.some((item) => item.toLowerCase() === clean.toLowerCase())
      ? items
      : [...items, clean].sort((a, b) => a.localeCompare(b, "vi"));
  };

  const buildCategoryTree = () => {
    const tree = {};

    categoriesList.forEach((cat) => {
      if (!cat) return;
      tree[cat] = { subCategories: {}, brands: [] };
    });

    Object.entries(categoryMeta || {}).forEach(([cat, meta]) => {
      if (!cat) return;
      if (!tree[cat]) tree[cat] = { subCategories: {}, brands: [] };

      Object.entries(meta.subCategories || {}).forEach(([subCat, brands]) => {
        if (!subCat) return;
        if (!tree[cat].subCategories[subCat]) tree[cat].subCategories[subCat] = { brands: [] };
        (Array.isArray(brands?.brands) ? brands.brands : Array.isArray(brands) ? brands : []).forEach((brand) => {
          tree[cat].subCategories[subCat].brands = addUnique(tree[cat].subCategories[subCat].brands, brand);
        });
      });

      (meta.brands || []).forEach((brand) => {
        tree[cat].brands = addUnique(tree[cat].brands, brand);
      });
    });

    products.forEach((p) => {
      const cat = String(p.category || "").trim();
      if (!cat) return;
      if (!tree[cat]) tree[cat] = { subCategories: {}, brands: [] };

      const subCat = String(p.subCategory || "").trim();
      const brand = String(p.brand || "").trim();
      if (subCat) {
        if (!tree[cat].subCategories[subCat]) tree[cat].subCategories[subCat] = { brands: [] };
        if (brand) {
          tree[cat].subCategories[subCat].brands = addUnique(tree[cat].subCategories[subCat].brands, brand);
        }
      } else if (brand) {
        tree[cat].brands = addUnique(tree[cat].brands, brand);
      }
    });

    return tree;
  };

  const categoryTree = buildCategoryTree();
  const getSubCategoryOptions = (category = formCategory) => Object.keys(categoryTree[category]?.subCategories || {}).sort((a, b) => a.localeCompare(b, "vi"));
  const getBrandOptions = (category = formCategory, subCategory = formSubCategory) => {
    const catNode = categoryTree[category];
    if (!catNode) return [];
    const scopedBrands = subCategory ? (catNode.subCategories[subCategory]?.brands || []) : [];
    const allCategoryBrands = [
      ...(catNode.brands || []),
      ...Object.values(catNode.subCategories || {}).flatMap((sub) => sub.brands || []),
    ];
    return Array.from(new Set([...(scopedBrands || []), ...allCategoryBrands].filter(Boolean))).sort((a, b) => a.localeCompare(b, "vi"));
  };

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
  const brandsList = Object.values(categoryTree)
    .flatMap((cat) => [
      ...(cat.brands || []),
      ...Object.values(cat.subCategories || {}).flatMap((sub) => sub.brands || []),
    ])
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, "vi"));
  const subCategoriesList = Object.values(categoryTree)
    .flatMap((cat) => Object.keys(cat.subCategories || {}))
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, "vi"));
  const formSubCategoryOptions = getSubCategoryOptions(formCategory);
  const formBrandOptions = getBrandOptions(formCategory, formSubCategory);

  const renderSmartPicker = ({
    id,
    label,
    value,
    options,
    searchValue,
    setSearchValue,
    onPick,
    placeholder,
    emptyText,
    helperText,
  }) => {
    const isOpen = productPickerOpen === id;
    const cleanSearch = searchValue.trim();
    const filteredOptions = options.filter((option) =>
      option.toLowerCase().includes(searchValue.toLowerCase())
    );
    const canCreate = cleanSearch && !options.some((option) => option.toLowerCase() === cleanSearch.toLowerCase());

    const chooseValue = (nextValue) => {
      onPick(nextValue);
      setSearchValue("");
      setProductPickerOpen(null);
    };

    return (
      <div className="relative" data-product-picker>
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">{label}</label>
        <button
          type="button"
          onClick={() => {
            setProductPickerOpen(isOpen ? null : id);
            setSearchValue("");
          }}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold flex items-center justify-between gap-3 text-left"
        >
          <span className={value ? "truncate" : "truncate text-slate-400"}>{value || placeholder}</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100000] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-fade-in max-h-[min(18rem,45vh)] flex flex-col">
            <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && cleanSearch) {
                      e.preventDefault();
                      chooseValue(cleanSearch);
                    }
                    if (e.key === "Escape") {
                      setProductPickerOpen(null);
                    }
                  }}
                  placeholder="Tìm kiếm hoặc nhập tên mới..."
                  className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>
            </div>

            <div className="overflow-y-auto overscroll-contain p-1.5 flex-1">
              {filteredOptions.length > 0 ? filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => chooseValue(option)}
                  className="w-full min-h-11 sm:min-h-0 flex items-center justify-between gap-3 px-3 py-2.5 sm:py-2 text-left text-sm sm:text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <span className="truncate">{option}</span>
                  {value === option && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              )) : (
                <div className="px-3 py-4 text-center text-xs font-bold text-slate-400">{emptyText}</div>
              )}

              {canCreate && (
                <button
                  type="button"
                  onClick={() => chooseValue(cleanSearch)}
                  className="mt-1 w-full min-h-11 sm:min-h-0 flex items-center gap-2 px-3 py-2.5 sm:py-2 text-left text-sm sm:text-xs font-black text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 rounded-xl transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span className="truncate">Tạo mới "{cleanSearch}"</span>
                </button>
              )}
            </div>
          </div>
        )}
        <p className="mt-1 text-[9px] font-semibold text-slate-400">{helperText}</p>
      </div>
    );
  };

  useEffect(() => {
    localStorage.setItem(CATEGORY_META_STORAGE_KEY, JSON.stringify(categoryMeta));
  }, [categoryMeta]);

  useEffect(() => {
    const metaCategories = Object.keys(categoryMeta || {});
    if (metaCategories.length === 0) return;
    setCategoriesList((prev) => {
      const next = metaCategories.reduce((items, cat) => addUnique(items, cat), prev);
      return next.length === prev.length ? prev : next;
    });
  }, [categoryMeta]);

  useEffect(() => {
    if (!productPickerOpen) return;
    const handlePointerDown = (event) => {
      if (!event.target.closest("[data-product-picker]")) {
        setProductPickerOpen(null);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [productPickerOpen]);

  const handlePriceChange = (val) => {
    const cleanVal = val.replace(/[^0-9]/g, "");
    setFormPrice(cleanVal);
    
    const priceNum = parseFloat(cleanVal) || 0;
    if (priceNum === 0) {
      setFormDiscountedPrice("");
      return;
    }
    const discountNum = parseFloat(formDiscount) || 0;
    const finalPrice = Math.round(priceNum * (1 - discountNum / 100));
    setFormDiscountedPrice(finalPrice.toString());
  };

  const handleDiscountChange = (val) => {
    setFormDiscount(val);
    let discountNum = parseFloat(val) || 0;
    if (discountNum < 0) discountNum = 0;
    if (discountNum > 100) discountNum = 100;
    
    const priceNum = parseFloat(formPrice) || 0;
    if (priceNum === 0) {
      setFormDiscountedPrice("");
      return;
    }
    const finalPrice = Math.round(priceNum * (1 - discountNum / 100));
    setFormDiscountedPrice(finalPrice.toString());
  };

  const handleDiscountedPriceChange = (val) => {
    const cleanVal = val.replace(/[^0-9]/g, "");
    setFormDiscountedPrice(cleanVal);
  };

  // Open Modal Product
  const openModal = (type, prod = null) => {
    setModalType(type);
    setProductPickerOpen(null);
    setSubCategorySearch("");
    setBrandSearch("");
    setProductImageUrlInput("");
    setDraggingImageIndex(null);
    if (type === "edit" && prod) {
      setEditingId(prod.id);
      setFormName(prod.name);
      setFormCategory(prod.category);
      setFormBrand(prod.brand || "");
      setFormSubCategory(prod.subCategory || "");
      setFormPrice(prod.price.toString());
      setFormStock(prod.countInStock.toString());
      
      const badgeVal = prod.badge || "";
      if (["", "New", "Like New", "Old", "Best Seller", "Top Rated", "Sale"].includes(badgeVal)) {
        setFormBadgePreset(badgeVal);
        setFormBadgeCustom("");
      } else {
        setFormBadgePreset("Custom");
        setFormBadgeCustom(badgeVal);
      }

      setFormImages(serializeImageList(prod.images || []));
      setFormDesc(prod.description);
      setFormSpecs(prod.specs ? prod.specs.join("\n") : "");
      setFormIsHot(prod.isHot || false);
      const discountNum = prod.discount || 0;
      setFormDiscount(discountNum.toString());
      setFormDiscountedPrice(
        prod.discountedPrice !== null && prod.discountedPrice !== undefined
          ? Math.round(prod.discountedPrice).toString()
          : Math.round(prod.price * (1 - discountNum / 100)).toString()
      );
    } else {
      setEditingId(null);
      setFormName("");
      setFormCategory(categoriesList[0] || "Laptop");
      setFormBrand("");
      setFormSubCategory("");
      setFormPrice("");
      setFormStock("10");
      setFormBadgePreset("New");
      setFormBadgeCustom("");
      setFormImages("");
      setFormDesc("");
      setFormSpecs("");
      setFormIsHot(false);
      setFormDiscount("0");
      setFormDiscountedPrice("");
    }
    setIsModalOpen(true);
  };

  // Handle Product CRUD
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!canWriteProducts) {
      alert("Bạn không có quyền cập nhật sản phẩm.");
      return;
    }
    setSubmittingProduct(true);
    
    const badgeVal = formBadgePreset === "Custom" ? formBadgeCustom : formBadgePreset;
    const token = localStorage.getItem("token");
    
    const payload = {
      name: formName,
      category: formCategory,
      brand: formBrand.trim() || null,
      subCategory: formSubCategory.trim() || null,
      price: parseFloat(formPrice) || 0,
      images: parseImageList(formImages),
      description: formDesc,
      specs: formSpecs.split("\n").map(s => s.trim()).filter(Boolean),
      countInStock: parseInt(formStock),
      badge: badgeVal || null,
      isHot: formIsHot,
      discount: parseInt(formDiscount) || 0,
      discountedPrice: formDiscountedPrice ? parseFloat(formDiscountedPrice) : null
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
        rememberCategoryMeta(payload.category, payload.subCategory, payload.brand);
        setIsModalOpen(false);
        fetchProducts();
        alert(modalType === "add" ? "Thêm sản phẩm thành công!" : "Cập nhật sản phẩm thành công!");
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
        alert("Xóa sản phẩm thành công!");
      } else {
        const data = await response.json();
        alert(data.message || "Không thể xóa sản phẩm này.");
      }
    } catch (err) {
      alert("Không thể kết nối đến server.");
    }
  };

  // Multiple image upload handler
  const handleImagesUploadMultiple = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    files.forEach(file => {
      formData.append("images", file);
    });

    setUploadingImage(true);

    try {
      const response = await fetch(`${API_URL}/api/upload/multiple`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        const currentImages = parseImageList(formImages);
        const newImages = [...currentImages, ...(data.imageUrls || [])];
        setFormImages(serializeImageList(newImages));
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

  const handleAddImageUrl = () => {
    const newUrls = parseImageList(productImageUrlInput);
    if (newUrls.length === 0) return;
    setFormImages(serializeImageList([...parseImageList(formImages), ...newUrls]));
    setProductImageUrlInput("");
  };

  const handleRemoveImage = (indexToRemove) => {
    const currentImages = parseImageList(formImages);
    const updatedImages = currentImages.filter((_, idx) => idx !== indexToRemove);
    setFormImages(serializeImageList(updatedImages));
  };

  const handleSetPrimaryImage = (indexToSet) => {
    const currentImages = parseImageList(formImages);
    if (indexToSet <= 0 || indexToSet >= currentImages.length) return;
    const nextImages = [...currentImages];
    const [selectedImage] = nextImages.splice(indexToSet, 1);
    nextImages.unshift(selectedImage);
    setFormImages(serializeImageList(nextImages));
  };

  const handleMoveImage = (fromIndex, direction) => {
    const currentImages = parseImageList(formImages);
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= currentImages.length) return;
    const nextImages = [...currentImages];
    [nextImages[fromIndex], nextImages[toIndex]] = [nextImages[toIndex], nextImages[fromIndex]];
    setFormImages(serializeImageList(nextImages));
  };

  const handleImageDrop = (targetIndex) => {
    if (draggingImageIndex === null || draggingImageIndex === targetIndex) {
      setDraggingImageIndex(null);
      return;
    }
    const currentImages = parseImageList(formImages);
    const nextImages = [...currentImages];
    const [draggedImage] = nextImages.splice(draggingImageIndex, 1);
    nextImages.splice(targetIndex, 0, draggedImage);
    setFormImages(serializeImageList(nextImages));
    setDraggingImageIndex(null);
  };

  // Category Management Methods
  const rememberCategoryMeta = (category, subCategory, brand) => {
    const cleanCategory = String(category || "").trim();
    const cleanSubCategory = String(subCategory || "").trim();
    const cleanBrand = String(brand || "").trim();
    if (!cleanCategory) return;

    setCategoriesList((prev) => addUnique(prev, cleanCategory));
    setCategoryMeta((prev) => {
      const next = { ...prev };
      const catNode = next[cleanCategory] || { subCategories: {}, brands: [] };
      const subCategories = { ...(catNode.subCategories || {}) };

      if (cleanSubCategory) {
        const subNode = subCategories[cleanSubCategory] || { brands: [] };
        subCategories[cleanSubCategory] = {
          ...subNode,
          brands: cleanBrand ? addUnique(subNode.brands || [], cleanBrand) : (subNode.brands || []),
        };
      } else if (cleanBrand) {
        catNode.brands = addUnique(catNode.brands || [], cleanBrand);
      }

      next[cleanCategory] = { ...catNode, subCategories };
      return next;
    });
  };

  const handleAddSubCategory = (catName) => {
    const subName = String(newSubCategoryByCat[catName] || "").trim();
    if (!subName) return;
    rememberCategoryMeta(catName, subName, "");
    setNewSubCategoryByCat((prev) => ({ ...prev, [catName]: "" }));
    alert("Thêm phân loại thành công!");
  };

  const handleAddBrandToSubCategory = (catName, subName) => {
    const key = `${catName}__${subName}`;
    const brandName = String(newBrandBySubCategory[key] || "").trim();
    if (!brandName) return;
    rememberCategoryMeta(catName, subName, brandName);
    setNewBrandBySubCategory((prev) => ({ ...prev, [key]: "" }));
    alert("Thêm hãng thành công!");
  };

  const handleDeleteSubCategory = (catName, subName) => {
    const associatedCount = products.filter(p => p.category === catName && p.subCategory === subName).length;
    if (associatedCount > 0) {
      alert(`Không thể xóa phân loại "${subName}" vì đang có ${associatedCount} sản phẩm sử dụng.`);
      return;
    }
    setCategoryMeta((prev) => {
      const catNode = prev[catName];
      if (!catNode?.subCategories?.[subName]) return prev;
      const subCategories = { ...catNode.subCategories };
      delete subCategories[subName];
      return { ...prev, [catName]: { ...catNode, subCategories } };
    });
    alert("Xóa phân loại thành công!");
  };

  const handleDeleteBrandFromSubCategory = (catName, subName, brandName) => {
    const associatedCount = products.filter(p => p.category === catName && p.subCategory === subName && p.brand === brandName).length;
    if (associatedCount > 0) {
      alert(`Không thể xóa hãng "${brandName}" vì đang có ${associatedCount} sản phẩm sử dụng.`);
      return;
    }
    setCategoryMeta((prev) => {
      const catNode = prev[catName];
      const subNode = catNode?.subCategories?.[subName];
      if (!subNode) return prev;
      return {
        ...prev,
        [catName]: {
          ...catNode,
          subCategories: {
            ...catNode.subCategories,
            [subName]: {
              ...subNode,
              brands: (subNode.brands || []).filter((brand) => brand !== brandName),
            },
          },
        },
      };
    });
    alert("Xóa hãng thành công!");
  };

  const openCatModal = (type, catName = "") => {
    setCatModalType(type);
    if (type === "edit") {
      setEditingCatName(catName);
      setFormCatName(catName);
    } else {
      setEditingCatName("");
      setFormCatName("");
    }
    setIsCatModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!canWriteCategories) {
      alert("Bạn không có quyền cập nhật danh mục.");
      return;
    }
    const cName = formCatName.trim();
    if (!cName) return;

    if (catModalType === "add") {
      setCategoriesList(prev => Array.from(new Set([...prev, cName])));
      setCategoryMeta((prev) => ({ ...prev, [cName]: prev[cName] || { subCategories: {}, brands: [] } }));
      setIsCatModalOpen(false);
      alert("Thêm danh mục mới thành công!");
    } else {
      // Rename Category across products
      const token = localStorage.getItem("token");
      const productsToUpdate = products.filter(p => p.category === editingCatName);
      
      try {
        setLoadingProducts(true);
        // Update products locally first and sync each to server
        const promises = productsToUpdate.map(p => {
          return fetch(`${API_URL}/api/products/${p.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ ...p, category: cName })
          });
        });
        
        await Promise.all(promises);
        
        // Update list
        setCategoriesList(prev => prev.map(c => c === editingCatName ? cName : c));
        setCategoryMeta((prev) => {
          const next = { ...prev };
          if (next[editingCatName]) {
            next[cName] = { ...(next[cName] || { subCategories: {}, brands: [] }), ...next[editingCatName] };
            delete next[editingCatName];
          }
          return next;
        });
        setIsCatModalOpen(false);
        fetchProducts();
        alert("Đổi tên danh mục thành công!");
      } catch (err) {
        alert("Lỗi đổi tên danh mục của sản phẩm.");
      } finally {
        setLoadingProducts(false);
      }
    }
  };

  const handleDeleteCategory = (catName) => {
    const associatedCount = products.filter(p => p.category === catName).length;
    if (associatedCount > 0) {
      alert(`Không thể xóa danh mục "${catName}" vì đang có ${associatedCount} sản phẩm thuộc danh mục này. Hãy chuyển sản phẩm sang danh mục khác trước.`);
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${catName}" khỏi danh sách?`)) return;

    setCategoriesList(prev => prev.filter(c => c !== catName));
    setCategoryMeta((prev) => {
      const next = { ...prev };
      delete next[catName];
      return next;
    });
    alert("Xóa danh mục thành công!");
  };

  // Role changes
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
        alert("Cập nhật quyền thành viên thành công!");
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
        alert("Xóa thành viên thành công!");
      } else {
        const data = await response.json();
        alert(data.message || "Không thể xóa người dùng này.");
      }
    } catch (err) {
      alert("Không thể kết nối đến server.");
    }
  };

  // User details Modal
  const openUserModal = (type, userObj = null) => {
    setUserModalType(type);
    setShowUserPassword(false);
    if (type === "edit" && userObj) {
      setEditingUserId(userObj.id);
      setFormUserName(userObj.name);
      setFormUserEmail(userObj.email);
      setFormUserPassword("");
      setFormUserRole(userObj.role || "user");
      setFormUserPhone(userObj.phone || "");
      setFormUserAddress(userObj.address || "");
      setFormUserCity(userObj.city || "");
    } else {
      setEditingUserId(null);
      setFormUserName("");
      setFormUserEmail("");
      setFormUserPassword("");
      setFormUserRole("user");
      setFormUserPhone("");
      setFormUserAddress("");
      setFormUserCity("");
    }
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!canWriteUsers) {
      alert("Bạn không có quyền cập nhật thành viên.");
      return;
    }
    setSubmittingUser(true);

    const token = localStorage.getItem("token");
    const payload = {
      name: formUserName,
      email: formUserEmail,
      role: formUserRole,
      phone: formUserPhone || null,
      address: formUserAddress || null,
      city: formUserCity || null
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
        alert(userModalType === "add" ? "Thêm thành viên mới thành công!" : "Cập nhật thông tin thành viên thành công!");
      } else {
        alert(data.message || "Đã xảy ra lỗi khi lưu thông tin thành viên.");
      }
    } catch (err) {
      alert("Không thể kết nối đến server.");
    } finally {
      setSubmittingUser(false);
    }
  };

  const resetRoleForm = () => {
    setEditingRoleId(null);
    setRoleForm({ id: "", name: "", description: "", permissions: [] });
  };

  const openNewRoleModal = () => {
    resetRoleForm();
    setIsRoleModalOpen(true);
  };

  const openRoleEditor = (role) => {
    setEditingRoleId(role.id);
    setRoleForm({
      id: role.id,
      name: role.name || "",
      description: role.description || "",
      permissions: Array.isArray(role.permissions) ? role.permissions : []
    });
  };

  useEffect(() => {
    if (activeTab !== "roles" || roles.length === 0 || editingRoleId || isRoleModalOpen) return;
    openRoleEditor(roles[0]);
  }, [activeTab, roles, editingRoleId, isRoleModalOpen]);

  const toggleRolePermission = (permissionId) => {
    if (roleForm.id === "admin") return;
    setRoleForm((prev) => {
      const exists = prev.permissions.includes(permissionId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((item) => item !== permissionId)
          : [...prev.permissions, permissionId]
      };
    });
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (currentUser?.role !== "admin") {
      alert("Chỉ Admin mới có quyền quản lý phân quyền.");
      return;
    }

    setSavingRole(true);
    const token = localStorage.getItem("token");
    const isEdit = Boolean(editingRoleId);
    const payload = {
      id: roleForm.id,
      name: roleForm.name,
      description: roleForm.description,
      permissions: roleForm.permissions
    };

    try {
      const response = await fetch(isEdit ? `${API_URL}/api/roles/${editingRoleId}` : `${API_URL}/api/roles`, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        const updatedRoles = data.roles || [];
        setRoles(updatedRoles);
        if (isRoleModalOpen) {
          setIsRoleModalOpen(false);
          const nextRole = updatedRoles.find((role) => role.id === (isEdit ? editingRoleId : payload.id));
          if (nextRole) {
            setEditingRoleId(nextRole.id);
            setRoleForm({
              id: nextRole.id,
              name: nextRole.name || "",
              description: nextRole.description || "",
              permissions: Array.isArray(nextRole.permissions) ? nextRole.permissions : []
            });
          } else {
            resetRoleForm();
          }
        } else if (isEdit) {
          const updatedRole = updatedRoles.find((role) => role.id === editingRoleId);
          if (updatedRole) {
            setRoleForm({
              id: updatedRole.id,
              name: updatedRole.name || "",
              description: updatedRole.description || "",
              permissions: Array.isArray(updatedRole.permissions) ? updatedRole.permissions : []
            });
          }
        }
        alert(isEdit ? "Cập nhật quyền thành công!" : "Tạo quyền mới thành công!");
      } else {
        alert(data.message || "Không thể lưu quyền.");
      }
    } catch (err) {
      alert("Không thể kết nối đến server.");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!editingRoleId) return;
    const selectedRole = roles.find((role) => role.id === editingRoleId);
    if (selectedRole?.locked) {
      alert("Không thể xóa quyền hệ thống.");
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa quyền "${selectedRole?.name || editingRoleId}"?`)) return;

    setSavingRole(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/roles/${editingRoleId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setRoles(data.roles || []);
        resetRoleForm();
        setIsRoleModalOpen(false);
        alert("Xóa quyền thành công!");
      } else {
        alert(data.message || "Không thể xóa quyền.");
      }
    } catch (err) {
      alert("Không thể kết nối đến server.");
    } finally {
      setSavingRole(false);
    }
  };

  // Coupon CRUD helpers
  const openCouponModal = (type, coupon = null) => {
    setCouponModalType(type);
    if (type === "edit" && coupon) {
      setEditingCouponId(coupon.id);
      setFormCouponCode(coupon.code);
      setFormCouponDesc(coupon.description || "");
      setFormCouponType(coupon.discountType);
      setFormCouponValue(coupon.discountValue);
      setFormCouponMinOrder(coupon.minOrderValue || "0");
      setFormCouponCats(coupon.applicableCategories || []);
      setFormCouponConds(coupon.applicableConditions || []);
      setFormCouponStartDate(coupon.startDate ? coupon.startDate.substring(0, 10) : "");
      setFormCouponEndDate(coupon.endDate ? coupon.endDate.substring(0, 10) : "");
      setFormCouponActive(coupon.isActive);
      setFormCouponMaxUses(coupon.maxUses !== null ? coupon.maxUses : "");
    } else {
      setEditingCouponId(null);
      setFormCouponCode("");
      setFormCouponDesc("");
      setFormCouponType("percentage");
      setFormCouponValue("");
      setFormCouponMinOrder("0");
      setFormCouponCats([]);
      setFormCouponConds([]);
      setFormCouponStartDate("");
      setFormCouponEndDate("");
      setFormCouponActive(true);
      setFormCouponMaxUses("");
    }
    setIsCouponModalOpen(true);
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    if (!canWriteCoupons) {
      alert("Bạn không có quyền cập nhật mã giảm giá.");
      return;
    }
    setSubmittingCoupon(true);

    const token = localStorage.getItem("token");
    const payload = {
      code: formCouponCode.toUpperCase().trim(),
      description: formCouponDesc,
      discountType: formCouponType,
      discountValue: Number(formCouponValue),
      minOrderValue: Number(formCouponMinOrder),
      applicableCategories: formCouponCats,
      applicableConditions: formCouponConds,
      startDate: formCouponStartDate || null,
      endDate: formCouponEndDate || null,
      isActive: formCouponActive,
      maxUses: formCouponMaxUses ? Number(formCouponMaxUses) : null
    };

    const url = couponModalType === "add"
      ? `${API_URL}/api/coupons`
      : `${API_URL}/api/coupons/${editingCouponId}`;
    
    const method = couponModalType === "add" ? "POST" : "PUT";

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
        setIsCouponModalOpen(false);
        fetchCoupons();
        alert(couponModalType === "add" ? "Tạo mã giảm giá mới thành công!" : "Cập nhật mã giảm giá thành công!");
      } else {
        alert(data.message || "Đã xảy ra lỗi khi lưu mã giảm giá.");
      }
    } catch (err) {
      alert("Không thể kết nối đến server.");
    } finally {
      setSubmittingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) return;
    
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/coupons/${couponId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchCoupons();
        alert("Xóa mã giảm giá thành công!");
      } else {
        const data = await response.json();
        alert(data.message || "Lỗi xóa mã giảm giá.");
      }
    } catch (err) {
      alert("Lỗi kết nối đến server.");
    }
  };

  const toggleSelectedId = (id, selectedIds, setSelectedIds) => {
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  const togglePageSelection = (pageItems, selectedIds, setSelectedIds) => {
    const pageIds = pageItems.map((item) => item.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : pageIds);
  };

  const handleBulkDelete = async (type, ids) => {
    const validIds = type === "users" ? ids.filter((id) => id !== currentUser?.id) : ids;
    if (validIds.length === 0) {
      alert("Chưa có mục hợp lệ để xóa.");
      return;
    }
    const labels = {
      products: "sản phẩm",
      coupons: "mã giảm giá",
      orders: "hóa đơn",
      users: "thành viên",
    };
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${validIds.length} ${labels[type]} đã chọn?`)) return;

    const token = localStorage.getItem("token");
    const endpoints = {
      products: "/api/products",
      coupons: "/api/coupons",
      orders: "/api/orders",
      users: "/api/users",
    };

    try {
      const results = await Promise.all(validIds.map((id) => fetch(`${API_URL}${endpoints[type]}/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })));
      const failed = results.filter((response) => !response.ok).length;

      if (type === "products") {
        setSelectedProductIds([]);
        fetchProducts();
      } else if (type === "coupons") {
        setSelectedCouponIds([]);
        fetchCoupons();
      } else if (type === "orders") {
        setSelectedOrderIds([]);
        fetchOrders();
      } else if (type === "users") {
        setSelectedUserIds([]);
        fetchUsers();
      }

      alert(failed ? `Đã xóa xong nhưng có ${failed} mục bị lỗi.` : "Xóa các mục đã chọn thành công!");
    } catch (err) {
      alert("Không thể kết nối đến server khi xóa hàng loạt.");
    }
  };

  // Filter products for display in Table
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(prodSearch.toLowerCase()) || 
                        p.category.toLowerCase().includes(prodSearch.toLowerCase()) ||
                        (p.brand && p.brand.toLowerCase().includes(prodSearch.toLowerCase())) ||
                        (p.subCategory && p.subCategory.toLowerCase().includes(prodSearch.toLowerCase())) ||
                        (p.badge && p.badge.toLowerCase().includes(prodSearch.toLowerCase()));
    const matchCat = prodCatFilter === "All" || p.category === prodCatFilter;
    const matchBrand = prodBrandFilter === "All" || p.brand === prodBrandFilter;
    const matchSubCat = prodSubCatFilter === "All" || p.subCategory === prodSubCatFilter;
    
    let matchCond = true;
    if (prodCondFilter !== "All") {
      if (!p.badge) {
        matchCond = false;
      } else {
        const b = p.badge.toLowerCase();
        if (prodCondFilter === "New") {
          matchCond = b.includes("new") || b.includes("mới") || b.includes("moi");
        } else if (prodCondFilter === "Like New") {
          matchCond = b.includes("like new") || b.includes("likenew") || b.includes("99%") || b.includes("98%") || b.includes("95%");
        } else if (prodCondFilter === "Old") {
          matchCond = b.includes("old") || b.includes("cũ") || b.includes("cu") || b.includes("used") || b.includes("lướt");
        }
      }
    }

    return matchSearch && matchCat && matchBrand && matchSubCat && matchCond;
  });
  const {
    totalPages: productTotalPages,
    currentPage: currentProductPage,
    pageItems: pagedProducts,
  } = getPaged(filteredProducts, productPage, productPageSize);
  const {
    totalPages: userTotalPages,
    currentPage: currentUserPage,
    pageItems: pagedUsers,
  } = getPaged(users, userPage, userPageSize);
  const {
    totalPages: couponTotalPages,
    currentPage: currentCouponPage,
    pageItems: pagedCoupons,
  } = getPaged(coupons, couponPage, couponPageSize);

  useEffect(() => {
    setProductPage(1);
    setSelectedProductIds([]);
  }, [prodSearch, prodCatFilter, prodBrandFilter, prodSubCatFilter, prodCondFilter, productPageSize]);

  useEffect(() => {
    setSelectedProductIds([]);
  }, [productPage]);

  useEffect(() => {
    setUserPage(1);
    setSelectedUserIds([]);
  }, [users.length, userPageSize]);

  useEffect(() => {
    setSelectedUserIds([]);
  }, [userPage]);

  useEffect(() => {
    setCouponPage(1);
    setSelectedCouponIds([]);
  }, [coupons.length, couponPageSize]);

  useEffect(() => {
    setSelectedCouponIds([]);
  }, [couponPage]);

  useEffect(() => {
    setOrderPage(1);
    setSelectedOrderIds([]);
  }, [orderSearchKeyword, filterOrderStatus, filterPaymentStatus, filterPaymentMethod, filterUsedOnly, filterStartDate, filterEndDate, orderPageSize]);

  useEffect(() => {
    setSelectedOrderIds([]);
  }, [orderPage]);

  const statsRangeOptions = [
    { value: "7", label: "7 ngày" },
    { value: "30", label: "30 ngày" },
    { value: "90", label: "90 ngày" },
    { value: "all", label: "Tất cả" },
  ];
  const trendChartMax = Math.max(...trendData.map((item) => trendMetric === "revenue" ? item.revenue : item.orders), 1);
  const trendPoints = trendData.map((item, index) => {
    const x = trendData.length <= 1 ? 50 : (index / (trendData.length - 1)) * 100;
    const value = trendMetric === "revenue" ? item.revenue : item.orders;
    const y = 88 - (value / trendChartMax) * 70;
    return { ...item, x, y, value };
  });
  const trendPath = trendPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const trendAreaPath = trendPoints.length
    ? `${trendPath} L ${trendPoints[trendPoints.length - 1].x} 94 L ${trendPoints[0].x} 94 Z`
    : "";
  const statusChartMax = Math.max(...orderStatusStats.map((item) => item.count), 1);
  const categoryChartMax = Math.max(...categoryRevenueStats.map((item) => item.revenue), 1);
  const currentRoleConfig = roles.find((role) => role.id === currentUser?.role);
  const isSuperAdmin = currentUser?.role === "admin";
  const hasUiPermission = (permissionId) => isSuperAdmin || Boolean(currentRoleConfig?.permissions?.includes(permissionId));
  const canWriteProducts = hasUiPermission("products.write");
  const canWriteCategories = hasUiPermission("categories.write");
  const canWriteOrders = hasUiPermission("orders.write");
  const canWriteCoupons = hasUiPermission("coupons.write");
  const canWriteUsers = hasUiPermission("users.write");
  const canWriteRoles = isSuperAdmin && hasUiPermission("roles.write");
  const adminTabs = [
    { id: "stats", permission: "screen.stats", label: "Báo Cáo Thống Kê", icon: BarChart3 },
    { id: "products", permission: "screen.products", label: "Quản Lý Sản Phẩm", icon: ShoppingBag },
    { id: "categories", permission: "screen.categories", label: "Quản Lý Danh Mục", icon: Boxes },
    { id: "orders", permission: "screen.orders", label: "Quản Lý Hóa Đơn", icon: FileText },
    { id: "coupons", permission: "screen.coupons", label: "Quản Lý Khuyến Mãi", icon: Wallet },
    { id: "users", permission: "screen.users", label: "Quản Lý Thành Viên", icon: Users },
    { id: "roles", permission: "screen.roles", label: "Quản Lý Phân Quyền", icon: UserCog }
  ];
  const visibleAdminTabs = adminTabs.filter((tab) => hasUiPermission(tab.permission));

  useEffect(() => {
    if (!isAdmin || visibleAdminTabs.length === 0) return;
    if (!visibleAdminTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleAdminTabs[0].id);
    }
  }, [isAdmin, activeTab, visibleAdminTabs.map((tab) => tab.id).join("|")]);

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
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col items-center animate-fade-in">
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
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all active:scale-95"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 admin-panel">
      <div className="w-full pl-1 pr-2 py-8 sm:pl-2 sm:pr-4 lg:pl-4 lg:pr-6">
        
        {/* Main Administrative Layout Grid */}
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* LEFT SIDEBAR PANEL (Desktop) / TOP PANEL (Mobile) */}
          <aside className={`w-full flex-shrink-0 transition-all duration-300 ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sticky top-8 flex flex-col gap-6 shadow-sm transition-colors duration-300">
              <div className="px-2">

                {!isCollapsed && <span className="text-[10px] text-blue-500 uppercase tracking-widest font-black animate-fade-in hidden lg:block">Hệ thống</span>}
                <span className="text-[10px] text-blue-500 uppercase tracking-widest font-black lg:hidden">Hệ thống</span>

                {!isCollapsed && <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 animate-fade-in hidden lg:block">ShopTech Admin</h2>}
                <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 lg:hidden">ShopTech Admin</h2>

                <div className={`flex items-center gap-2 mt-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all ${isCollapsed ? "lg:justify-center lg:p-2" : ""}`}>
                  <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                    {currentUser?.name.charAt(0)}
                  </div>
                  {!isCollapsed && (
                    <div className="min-w-0 animate-fade-in hidden lg:block">
                      <p className="text-xs font-black truncate text-slate-800 dark:text-slate-300">{currentUser?.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">Administrator</p>
                    </div>
                  )}
                  <div className="min-w-0 lg:hidden">
                    <p className="text-xs font-black truncate text-slate-800 dark:text-slate-300">{currentUser?.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">Administrator</p>
                  </div>
                </div>
              </div>

              {/* TAB BUTTONS — collapse toggle is first item in the nav list */}
              <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto scrollbar-hide lg:overflow-x-visible pb-2 lg:pb-0">

                {/* Collapse / Expand toggle button — lives inside nav, same row as icons */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCollapsed((prev) => {
                      const next = !prev;
                      localStorage.setItem("admin_sidebar_collapsed", String(next));
                      return next;
                    });
                  }}
                  className={`hidden lg:flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all flex-shrink-0 cursor-pointer text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 border border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 ${
                    isCollapsed ? "lg:justify-center lg:px-3" : ""
                  }`}
                  title={isCollapsed ? "Mở rộng thanh quản lý" : "Thu gọn thanh quản lý"}
                >
                  <Menu className="h-4.5 w-4.5 flex-shrink-0" />
                  {!isCollapsed && <span className="animate-fade-in hidden lg:block">{isCollapsed ? "Mở rộng" : "Thu gọn menu"}</span>}
                </button>

                {visibleAdminTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all flex-shrink-0 cursor-pointer ${
                        active
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/15 scale-[1.02]"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      } ${isCollapsed ? "lg:justify-center lg:px-3" : ""}`}
                      title={tab.label}
                    >
                      <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                      {!isCollapsed && <span className="animate-fade-in hidden lg:block">{tab.label}</span>}
                      <span className="lg:hidden">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* RIGHT CONTENT WORKSPACE */}
          <main className="flex-1 min-w-0 space-y-6">
            
            {/* Tab 1: stats (Statistics Panel) */}
            {activeTab === "stats" && hasUiPermission("screen.stats") && (
              <div className="space-y-6 animate-fade-in-up">
                {/* KPIs Dashboard Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-5 flex items-start gap-3.5 shadow-lg shadow-blue-500/10 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
                    <div className="h-11 w-11 rounded-2xl bg-white/10 text-white flex items-center justify-center flex-shrink-0">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-blue-200">Tổng doanh thu</p>
                      <p className="text-xl font-black mt-0.5">{formatVND(totalRevenue)}</p>
                      <p className="text-[10px] text-blue-100 mt-1.5">Doanh thu từ đơn đã thanh toán</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-start gap-3.5 shadow-sm transition-colors animate-fade-in-up" style={{ animationDelay: "60ms" }}>
                    <div className="h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Đã bán thành công</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalSoldItems} sản phẩm</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">Số lượng máy & phụ kiện bán ra</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-start gap-3.5 shadow-sm transition-colors animate-fade-in-up" style={{ animationDelay: "120ms" }}>
                    <div className="h-11 w-11 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                      <Boxes className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Giá trị tồn kho</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{formatVND(inventoryValue)}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">Tổng giá trị vốn sản phẩm hiện tại</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-start gap-3.5 shadow-sm transition-colors animate-fade-in-up" style={{ animationDelay: "180ms" }}>
                    <div className="h-11 w-11 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                      <UserCog className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Tổng sản phẩm tồn</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalStock} máy</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">Tổng số máy còn lại trong kho</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    { label: "Doanh thu kỳ này", value: formatVND(rangedRevenue), note: `${rangedPaidTotal}/${rangedOrderTotal} đơn đã thanh toán`, color: "text-blue-600 dark:text-blue-400" },
                    { label: "Giá trị đơn TB", value: formatVND(averageOrderValue), note: "Tính trên đơn đã thanh toán", color: "text-emerald-600 dark:text-emerald-400" },
                    { label: "Tỷ lệ thanh toán", value: `${paymentRate}%`, note: "Paid / tổng đơn trong kỳ", color: "text-amber-600 dark:text-amber-400" },
                    { label: "Đơn cần xử lý", value: pendingOrdersCount, note: `${shippingOrdersCount} đơn đang giao`, color: "text-rose-600 dark:text-rose-400" },
                    { label: "Cảnh báo kho", value: lowStockProducts + outOfStockProducts, note: `${outOfStockProducts} hết hàng, ${lowStockProducts} sắp hết`, color: "text-purple-600 dark:text-purple-400" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{item.label}</p>
                      <p className={`mt-1 text-lg font-black ${item.color}`}>{item.value}</p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">{item.note}</p>
                    </div>
                  ))}
                </div>

                {/* Interactive Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">Xu hướng kinh doanh</h3>
                        <p className="text-[10px] font-semibold text-slate-400 mt-1">Hover hoặc bấm vào điểm trên biểu đồ để xem chi tiết.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-950 p-1">
                          {statsRangeOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setStatsRange(option.value);
                                setSelectedTrendIndex(null);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${statsRange === option.value ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-950 p-1">
                          {[
                            { value: "revenue", label: "Doanh thu" },
                            { value: "orders", label: "Đơn hàng" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setTrendMetric(option.value)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${trendMetric === option.value ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="relative h-72 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 overflow-hidden">
                      {trendPoints.length > 0 ? (
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                          <defs>
                            <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>
                          {[18, 36, 54, 72, 90].map((y) => (
                            <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.3" />
                          ))}
                          <path d={trendAreaPath} fill="url(#trendFill)" />
                          <path d={trendPath} fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                          {trendPoints.map((point, index) => {
                            const active = selectedTrend?.key === point.key;
                            return (
                              <g
                                key={point.key}
                                onMouseEnter={() => setSelectedTrendIndex(index)}
                                onClick={() => setSelectedTrendIndex(index)}
                                className="cursor-pointer"
                              >
                                <line x1={point.x} x2={point.x} y1="10" y2="94" stroke="#2563eb" strokeOpacity={active ? "0.22" : "0"} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                                <circle cx={point.x} cy={point.y} r={active ? "2.2" : "1.35"} fill={active ? "#0f172a" : "#2563eb"} stroke="white" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
                                <circle cx={point.x} cy={point.y} r="5" fill="transparent" />
                              </g>
                            );
                          })}
                        </svg>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400">Chưa có dữ liệu biểu đồ.</div>
                      )}

                      {selectedTrend && (
                        <div className="absolute left-3 top-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-lg p-3 min-w-40">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{selectedTrend.label}</p>
                          <p className="mt-1 text-sm font-black text-blue-600 dark:text-blue-400">{formatVND(selectedTrend.revenue)}</p>
                          <p className="mt-1 text-[10px] font-semibold text-slate-500">{selectedTrend.orders} đơn, {selectedTrend.paidOrders} đã thanh toán, {selectedTrend.items} sản phẩm</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-4 sm:grid-cols-7 gap-1 text-[9px] font-bold text-slate-400">
                      {trendPoints.filter((_, index) => trendPoints.length <= 7 || index % Math.ceil(trendPoints.length / 7) === 0).map((point) => (
                        <span key={point.key} className="truncate">{point.label}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-5">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">Trạng thái đơn hàng</h3>
                      <p className="text-[10px] font-semibold text-slate-400 mt-1">Cột có thể hover để xem số lượng.</p>
                    </div>
                    <div className="h-56 flex items-end gap-2 border-b border-slate-200 dark:border-slate-800 px-1">
                      {orderStatusStats.map((item) => (
                        <div key={item.key} className="group flex-1 h-full flex flex-col justify-end items-center gap-2">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-slate-900 dark:text-white">{item.count}</div>
                          <div
                            className="w-full max-w-10 rounded-t-2xl bg-blue-500 group-hover:bg-blue-600 transition-all"
                            style={{ height: `${Math.max((item.count / statusChartMax) * 82, item.count ? 8 : 2)}%` }}
                            title={`${item.label}: ${item.count}`}
                          />
                          <span className="h-8 text-[9px] font-bold text-slate-400 text-center leading-tight line-clamp-2">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {paymentStatusStats.map((item) => (
                        <div key={item.key}>
                          <div className="flex justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1">
                            <span>{item.label}</span>
                            <span>{item.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rangedOrderTotal ? (item.count / rangedOrderTotal) * 100 : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">Doanh thu theo danh mục</h3>
                      <p className="text-[10px] font-semibold text-slate-400 mt-1">Bấm vào từng thanh để xem số đơn và số lượng đã bán.</p>
                    </div>
                    {activeCategoryStat && (
                      <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 px-4 py-2 text-xs">
                        <span className="font-black text-blue-700 dark:text-blue-300">{activeCategoryStat.label}</span>
                        <span className="mx-2 text-slate-300">•</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{formatVND(activeCategoryStat.revenue)}</span>
                        <span className="ml-2 text-slate-500">{activeCategoryStat.items} sản phẩm</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {categoryRevenueStats.length > 0 ? categoryRevenueStats.map((item) => {
                      const active = activeCategoryStat?.label === item.label;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setSelectedCategoryStat(item.label)}
                          onMouseEnter={() => setSelectedCategoryStat(item.label)}
                          className={`text-left rounded-2xl border p-4 transition-all ${active ? "border-blue-300 dark:border-blue-700 bg-blue-50/70 dark:bg-blue-950/25" : "border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800"}`}
                        >
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-black text-slate-900 dark:text-white truncate">{item.label}</span>
                            <span className="font-black text-blue-600 dark:text-blue-400">{formatVND(item.revenue)}</span>
                          </div>
                          <div className="mt-3 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${Math.max((item.revenue / categoryChartMax) * 100, 4)}%` }} />
                          </div>
                          <p className="mt-2 text-[10px] font-semibold text-slate-500">{item.orders} đơn hàng • {item.items} sản phẩm đã bán</p>
                        </button>
                      );
                    }) : (
                      <div className="lg:col-span-2 py-8 text-center text-sm font-bold text-slate-400">Chưa có dữ liệu doanh thu theo danh mục trong khoảng thời gian này.</div>
                    )}
                  </div>
                </div>

                {/* Top Sellers & Top Customers Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Sellers */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                      Sản phẩm bán chạy nhất
                    </h3>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {topSoldProducts.map((p, idx) => (
                        <div key={p.id} className="flex items-center gap-3 py-3 text-xs">
                          <span className="font-extrabold text-slate-400 text-sm w-4">#{idx+1}</span>
                          <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200 dark:border-slate-800" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 dark:text-white truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-400">Doanh thu: {formatVND(p.value)}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold rounded-lg text-[10px]">
                            Đã bán: {p.quantity}
                          </span>
                        </div>
                      ))}
                      {topSoldProducts.length === 0 && (
                        <div className="py-6 text-center text-slate-400 font-semibold">Chưa có dữ liệu bán hàng.</div>
                      )}
                    </div>
                  </div>

                  {/* Top Customers (VIP) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                      Khách hàng VIP mua nhiều nhất
                    </h3>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {topBuyers.map((b, idx) => (
                        <div key={b.email} className="flex items-center gap-3 py-3 text-xs">
                          <span className="font-extrabold text-slate-400 text-sm w-4">#{idx+1}</span>
                          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                            {b.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 dark:text-white truncate">{b.name}</p>
                            <p className="text-[10px] text-slate-400">{b.email} • {b.phone}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-slate-900 dark:text-white">{formatVND(b.totalSpent)}</p>
                            <p className="text-[9px] text-slate-400 font-semibold">{b.ordersCount} hóa đơn đã mua</p>
                          </div>
                        </div>
                      ))}
                      {topBuyers.length === 0 && (
                        <div className="py-6 text-center text-slate-400 font-semibold">Chưa có dữ liệu khách mua hàng.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Categories Distribution Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-colors">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Thống kê theo danh mục</h2>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Cập nhật thực tế</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-800">
                          <th className="px-6 py-4">Danh mục</th>
                          <th className="px-6 py-4">Số sản phẩm</th>
                          <th className="px-6 py-4">Tồn kho</th>
                          <th className="px-6 py-4">Giá trị kho</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {Object.entries(categoryStats)
                          .sort((a, b) => b[1].value - a[1].value)
                          .map(([cat, s]) => (
                            <tr key={cat} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors text-xs text-slate-700 dark:text-slate-400">
                              <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{cat}</td>
                              <td className="px-6 py-4">{s.count} sản phẩm</td>
                              <td className="px-6 py-4 font-semibold">{s.stock} cái</td>
                              <td className="px-6 py-4 font-black text-slate-900 dark:text-white">{formatVND(s.value)}</td>
                            </tr>
                          ))}
                        {Object.keys(categoryStats).length === 0 && (
                          <tr>
                            <td className="px-6 py-10 text-center text-slate-400" colSpan={4}>
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

            {/* Tab 2: products (Product CRUD with Search & Multiple Filters) */}
            {activeTab === "products" && hasUiPermission("screen.products") && (
              <div className="space-y-4 animate-fade-in-up">
                
                {/* Advanced Search & Filtering Block */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Kho Hàng Sản Phẩm ({filteredProducts.length})</h2>
                    <RippleButton
                      onClick={() => openModal("add")}
                      disabled={!canWriteProducts}
                      className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-blue-600/20 transition-all active:scale-95 flex-shrink-0 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5"
                    >
                      <Plus className="h-4.5 w-4.5" />
                      <span>Thêm sản phẩm mới</span>
                    </RippleButton>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Tìm theo tên, danh mục, nhãn..."
                        value={prodSearch}
                        onChange={(e) => setProdSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    </div>

                    {/* Category Filter */}
                    <select
                      value={prodCatFilter}
                      onChange={(e) => setProdCatFilter(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                    >
                      <option value="All">Tất cả danh mục</option>
                      {categoriesList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    {/* Brand Filter */}
                    <select
                      value={prodBrandFilter}
                      onChange={(e) => setProdBrandFilter(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                    >
                      <option value="All">Tất cả hãng</option>
                      {brandsList.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>

                    {/* Sub-category Filter */}
                    <select
                      value={prodSubCatFilter}
                      onChange={(e) => setProdSubCatFilter(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                    >
                      <option value="All">Tất cả phân loại</option>
                      {subCategoriesList.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    {/* Badge/Condition Filter */}
                    <select
                      value={prodCondFilter}
                      onChange={(e) => setProdCondFilter(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                    >
                      <option value="All">Tất cả tình trạng (Badge)</option>
                      <option value="New">Hàng mới (New)</option>
                      <option value="Like New">Like New (99%)</option>
                      <option value="Old">Đã qua sử dụng (Old)</option>
                    </select>
                  </div>
                </div>

                {/* Products Table Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-colors">
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs font-bold text-slate-500">
                      Đã chọn {selectedProductIds.length} sản phẩm
                    </p>
                    <button
                      type="button"
                      onClick={() => handleBulkDelete("products", selectedProductIds)}
                      disabled={!canWriteProducts || selectedProductIds.length === 0}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-xs font-black transition-all disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Xóa đã chọn</span>
                    </button>
                  </div>
                  {loadingProducts ? (
                    <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                  ) : error ? (
                    <div className="p-12 text-center text-red-500 flex flex-col items-center gap-2">
                      <AlertCircle className="h-10 w-10 text-red-500" />
                      <span>{error}</span>
                      <button onClick={fetchProducts} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-xl">Thử lại</button>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 font-bold text-xs">Không tìm thấy sản phẩm nào khớp bộ lọc!</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={pagedProducts.length > 0 && pagedProducts.every((prod) => selectedProductIds.includes(prod.id))}
                                onChange={() => togglePageSelection(pagedProducts, selectedProductIds, setSelectedProductIds)}
                                className="h-4 w-4 accent-blue-600"
                              />
                            </th>
                            <th className="px-6 py-4">Ảnh</th>
                            <th className="px-6 py-4">Tên sản phẩm</th>
                            <th className="px-6 py-4">Danh mục</th>
                            <th className="px-6 py-4">Hãng</th>
                            <th className="px-6 py-4">Phân loại</th>
                            <th className="px-6 py-4">Giá tiền</th>
                            <th className="px-6 py-4">Kho hàng</th>
                            <th className="px-6 py-4">Nhãn (Badge)</th>
                            <th className="px-6 py-4">Ngày tạo</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {pagedProducts.map((prod, index) => (
                            <tr
                              key={prod.id}
                              style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                              onClick={() => canWriteProducts && openModal("edit", prod)}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all duration-300 text-xs text-slate-700 dark:text-slate-400 animate-fade-in-up opacity-0 cursor-pointer"
                            >
                              <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedProductIds.includes(prod.id)}
                                  onChange={() => toggleSelectedId(prod.id, selectedProductIds, setSelectedProductIds)}
                                  className="h-4 w-4 accent-blue-600"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 flex-shrink-0">
                                  <img
                                    src={prod.images && prod.images.length > 0 ? prod.images[0] : ""}
                                    alt={prod.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100&auto=format&fit=crop" }}
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                                <div className="flex flex-col gap-0.5">
                                  <span>{prod.name}</span>
                                  {prod.isHot && (
                                    <span className="w-fit text-[8px] font-black uppercase tracking-wider bg-rose-500 text-white px-1.5 py-0.2 rounded-md">
                                      🔥 HOT
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-semibold">{prod.category}</td>
                              <td className="px-6 py-4 font-semibold">{prod.brand || "—"}</td>
                              <td className="px-6 py-4 font-semibold">{prod.subCategory || "—"}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  {(prod.discount > 0 || (prod.discountedPrice !== null && prod.discountedPrice !== undefined && toVndInt(prod.discountedPrice) < toVndInt(prod.price))) ? (
                                    <>
                                      <span className="font-black text-slate-900 dark:text-white">
                                        {formatVND(
                                          prod.discountedPrice !== null && prod.discountedPrice !== undefined
                                            ? toVndInt(prod.discountedPrice)
                                            : Math.floor(prod.price * (1 - prod.discount / 100))
                                        )}
                                      </span>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] text-slate-400 line-through">
                                          {formatVND(prod.price)}
                                        </span>
                                        <span className="text-[9px] font-black text-red-500">
                                          -{prod.discount > 0
                                            ? prod.discount
                                            : Math.round((1 - toVndInt(prod.discountedPrice) / toVndInt(prod.price)) * 100)
                                          }%
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <span className="font-black text-slate-900 dark:text-white">
                                      {formatVND(prod.price)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">{prod.countInStock} cái</td>
                              <td className="px-6 py-4">
                                {prod.badge ? (
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm ${getBadgeClass(prod.badge)}`}>
                                    {prod.badge}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 opacity-80 whitespace-nowrap">
                                {prod.createdAt ? new Date(prod.createdAt).toLocaleDateString("vi-VN") : "—"}
                              </td>

                              <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    disabled={!canWriteProducts}
                                    onClick={() => openModal("edit", prod)}
                                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl transition-all disabled:opacity-40"
                                    title="Sửa"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    disabled={!canWriteProducts}
                                    onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                    className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 rounded-xl transition-all disabled:opacity-40"
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
                      <PaginationControls
                        page={currentProductPage}
                        totalPages={productTotalPages}
                        totalItems={filteredProducts.length}
                        pageSize={productPageSize}
                        onPageChange={setProductPage}
                        onPageSizeChange={setProductPageSize}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: categories (Dynamic Category Management Panel) */}
            {activeTab === "categories" && hasUiPermission("screen.categories") && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Quản Lý Danh Mục Công Nghệ</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đổi tên hoặc thêm danh mục mới sẽ tự động cập nhật và phân loại bộ lọc động ngoài trang chủ.</p>
                  </div>
                  <RippleButton
                    onClick={() => openCatModal("add")}
                    disabled={!canWriteCategories}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-blue-600/20 transition-all active:scale-95 flex-shrink-0 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span>Thêm danh mục mới</span>
                  </RippleButton>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {categoriesList.map((catName, index) => {
                    const catNode = categoryTree[catName] || { subCategories: {}, brands: [] };
                    const subEntries = Object.entries(catNode.subCategories || {}).sort(([a], [b]) => a.localeCompare(b, "vi"));
                    const associatedCount = products.filter(p => p.category === catName).length;
                    const subCount = subEntries.length;
                    const brandCount = Array.from(new Set([
                      ...(catNode.brands || []),
                      ...subEntries.flatMap(([, sub]) => sub.brands || []),
                    ].filter(Boolean))).length;

                    return (
                      <div
                        key={catName}
                        style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-all animate-fade-in-up opacity-0"
                      >
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">{catName}</h3>
                            <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-black text-slate-500">
                              <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">{associatedCount} sản phẩm</span>
                              <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300">{subCount} phân loại</span>
                              <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-300">{brandCount} hãng</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              disabled={!canWriteCategories}
                              onClick={() => openCatModal("edit", catName)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl transition-all disabled:opacity-40"
                              title="Sửa tên danh mục"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              disabled={!canWriteCategories}
                              onClick={() => handleDeleteCategory(catName)}
                              className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 rounded-xl transition-all disabled:opacity-40"
                              title="Xóa danh mục"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="p-5 space-y-4">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder={`Thêm phân loại cho ${catName}`}
                              value={newSubCategoryByCat[catName] || ""}
                              onChange={(e) => setNewSubCategoryByCat((prev) => ({ ...prev, [catName]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddSubCategory(catName);
                                }
                              }}
                              className="min-w-0 flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddSubCategory(catName)}
                              className="h-9 w-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all"
                              title="Thêm phân loại"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          {subEntries.length === 0 ? (
                            <div className="py-6 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                              Chưa có phân loại nào.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {subEntries.map(([subName, subNode]) => {
                                const brandInputKey = `${catName}__${subName}`;
                                const brands = (subNode.brands || []).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi"));
                                return (
                                  <div key={subName} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-slate-50/60 dark:bg-slate-950/30">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="font-black text-xs text-slate-800 dark:text-slate-100">{subName}</div>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSubCategory(catName, subName)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                                        title="Xóa phân loại"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                      {brands.length > 0 ? brands.map((brand) => (
                                        <span key={brand} className="inline-flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                          {brand}
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteBrandFromSubCategory(catName, subName, brand)}
                                            className="text-slate-300 hover:text-red-500"
                                            title="Xóa hãng"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </span>
                                      )) : (
                                        <span className="text-[10px] font-bold text-slate-400">Chưa có hãng trong phân loại này.</span>
                                      )}
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                      <input
                                        type="text"
                                        placeholder={`Thêm hãng cho ${subName}`}
                                        value={newBrandBySubCategory[brandInputKey] || ""}
                                        onChange={(e) => setNewBrandBySubCategory((prev) => ({ ...prev, [brandInputKey]: e.target.value }))}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddBrandToSubCategory(catName, subName);
                                          }
                                        }}
                                        className="min-w-0 flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleAddBrandToSubCategory(catName, subName)}
                                        className="h-8 w-8 flex items-center justify-center bg-slate-900 hover:bg-slate-700 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl transition-all"
                                        title="Thêm hãng"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 4: users (User Panel with password creation and toggles) */}
            {activeTab === "users" && hasUiPermission("screen.users") && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-colors animate-fade-in-up">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Danh sách quản lý thành viên</h2>
                    <p className="text-xs text-slate-500 mt-1">Admin có thể thêm thành viên mới, cấp vai trò, đổi mật khẩu và xem trực tiếp chuỗi mật khẩu gõ vào.</p>
                  </div>
                  <RippleButton
                    onClick={() => openUserModal("add")}
                    disabled={!canWriteUsers}
                    className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-blue-600/20 transition-all active:scale-95 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span>Thêm thành viên mới</span>
                  </RippleButton>
                </div>
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs font-bold text-slate-500">Đã chọn {selectedUserIds.length} thành viên</p>
                  <button
                    type="button"
                    onClick={() => handleBulkDelete("users", selectedUserIds)}
                    disabled={!canWriteUsers || selectedUserIds.length === 0}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-xs font-black transition-all disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Xóa đã chọn</span>
                  </button>
                </div>

                {loadingUsers ? (
                  <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-800">
                          <th className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={pagedUsers.filter((u) => u.id !== currentUser?.id).length > 0 && pagedUsers.filter((u) => u.id !== currentUser?.id).every((u) => selectedUserIds.includes(u.id))}
                              onChange={() => togglePageSelection(pagedUsers.filter((u) => u.id !== currentUser?.id), selectedUserIds, setSelectedUserIds)}
                              className="h-4 w-4 accent-blue-600"
                            />
                          </th>
                          <th className="px-6 py-4">Tên người dùng</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Ngày đăng ký</th>
                          <th className="px-6 py-4">Quyền hạn (Role)</th>
                          <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {pagedUsers.map((u, index) => (
                          <tr
                            key={u.id}
                            style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                            onClick={() => openUserModal("edit", u)}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all duration-300 text-xs text-slate-700 dark:text-slate-400 animate-fade-in-up opacity-0 cursor-pointer"
                          >
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(u.id)}
                                disabled={currentUser?.id === u.id}
                                onChange={() => toggleSelectedId(u.id, selectedUserIds, setSelectedUserIds)}
                                className="h-4 w-4 accent-blue-600 disabled:opacity-40"
                              />
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                {u.name.charAt(0)}
                              </div>
                              <span className="truncate">{u.name}</span>
                              {currentUser?.id === u.id && (
                                <span className="text-[9px] font-black uppercase tracking-wide bg-blue-50 dark:bg-blue-900/25 text-blue-500 px-1.5 py-0.5 rounded">Bạn</span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-semibold">{u.email}</td>
                            <td className="px-6 py-4 opacity-80">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <select
                                disabled={!canWriteUsers || currentUser?.id === u.id}
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                              >
                                {roles.map((role) => (
                                  <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                <button
                                  disabled={!canWriteUsers}
                                  onClick={() => openUserModal("edit", u)}
                                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl transition-all disabled:opacity-40"
                                  title="Sửa & Cập nhật mật khẩu"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  disabled={!canWriteUsers || currentUser?.id === u.id}
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
                    <PaginationControls
                      page={currentUserPage}
                      totalPages={userTotalPages}
                      totalItems={users.length}
                      pageSize={userPageSize}
                      onPageChange={setUserPage}
                      onPageSizeChange={setUserPageSize}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "roles" && hasUiPermission("screen.roles") && (() => {
              const selectedRole = roles.find((role) => role.id === editingRoleId);
              const allPermissionIds = permissionGroups.flatMap((group) => group.items.map((item) => item.id));
              const grantedCount = roleForm.id === "admin" ? allPermissionIds.length : roleForm.permissions.length;
              const setGroupPermissions = (groupItems, shouldGrant) => {
                if (!canWriteRoles || roleForm.id === "admin") return;
                const ids = groupItems.map((item) => item.id);
                setRoleForm((prev) => ({
                  ...prev,
                  permissions: shouldGrant
                    ? Array.from(new Set([...prev.permissions, ...ids]))
                    : prev.permissions.filter((permission) => !ids.includes(permission))
                }));
              };

              return (
                <div className="space-y-5">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white">Quản lý phân quyền</h2>
                        <p className="text-xs text-slate-500 mt-1">Chọn role ở hàng dưới, toàn bộ quyền được xem và thao tác sẽ hiện ngay bên cạnh.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-300">
                          {roles.length} role
                        </span>
                        <span className="px-3 py-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-[10px] font-black text-blue-600 dark:text-blue-300">
                          {grantedCount}/{allPermissionIds.length} quyền
                        </span>
                        <button
                          type="button"
                          onClick={openNewRoleModal}
                          disabled={!canWriteRoles}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-blue-600 text-white hover:bg-blue-500 text-xs font-black transition-all disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Tạo quyền</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 overflow-x-auto">
                      <div className="flex gap-3 min-w-max lg:min-w-0 lg:grid lg:grid-cols-4 xl:grid-cols-6">
                        {roles.map((role) => {
                          const selected = editingRoleId === role.id;
                          const count = role.id === "admin" ? allPermissionIds.length : role.permissions?.length || 0;
                          return (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => openRoleEditor(role)}
                              className={`w-56 lg:w-auto text-left p-4 rounded-2xl border transition-all ${
                                selected
                                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/15"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-blue-50/50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-black truncate">{role.name}</p>
                                  <p className={`text-[10px] font-bold mt-0.5 truncate ${selected ? "text-blue-100" : "text-slate-400"}`}>{role.id}</p>
                                </div>
                                {role.locked && (
                                  <ShieldAlert className={`h-4 w-4 flex-shrink-0 ${selected ? "text-blue-100" : "text-slate-400"}`} />
                                )}
                              </div>
                              <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${selected ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-800"}`}>
                                <div
                                  className={`h-full rounded-full ${selected ? "bg-white" : "bg-blue-500"}`}
                                  style={{ width: `${allPermissionIds.length ? Math.min((count / allPermissionIds.length) * 100, 100) : 0}%` }}
                                />
                              </div>
                              <p className={`mt-2 text-[10px] font-black uppercase ${selected ? "text-blue-50" : "text-slate-400"}`}>
                                {count} quyền được cấp
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleRoleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          Ma trận quyền {selectedRole ? `- ${selectedRole.name}` : ""}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Bấm từng quyền hoặc chọn nhanh cả nhóm. Thông tin quyền nằm ngay trong vùng này.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {roleForm.id === "admin" && (
                          <span className="text-[10px] font-black text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-2xl">
                            Admin luôn có toàn quyền
                          </span>
                        )}
                        {selectedRole && !selectedRole.locked && (
                          <button
                            type="button"
                            onClick={handleDeleteRole}
                            disabled={!canWriteRoles || savingRole}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/40 text-xs font-black transition-all disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Xóa</span>
                          </button>
                        )}
                        <RippleButton
                          type="submit"
                          disabled={!canWriteRoles || !editingRoleId || savingRole}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {savingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          <span>Lưu quyền</span>
                        </RippleButton>
                      </div>
                    </div>

                    {selectedRole ? (
                      <div className="p-5 space-y-5">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1fr,2fr] gap-3 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Mã quyền</label>
                            <input
                              value={roleForm.id}
                              disabled
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 text-xs outline-none font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Tên quyền</label>
                            <input
                              value={roleForm.name}
                              onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                              disabled={!canWriteRoles || selectedRole.locked}
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold disabled:opacity-60"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Mô tả</label>
                            <input
                              value={roleForm.description}
                              onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                              disabled={!canWriteRoles || selectedRole.locked}
                              placeholder="Mô tả ngắn quyền này..."
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold disabled:opacity-60"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {permissionGroups.map((group) => {
                          const groupIds = group.items.map((item) => item.id);
                          const checkedCount = roleForm.id === "admin"
                            ? group.items.length
                            : groupIds.filter((id) => roleForm.permissions.includes(id)).length;
                          return (
                            <div key={group.id} className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/70 dark:bg-slate-950/40 overflow-hidden">
                              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                                <div>
                                  <h4 className="text-xs font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">{group.label}</h4>
                                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">{checkedCount}/{group.items.length} quyền</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setGroupPermissions(group.items, true)}
                                    disabled={!canWriteRoles || roleForm.id === "admin"}
                                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black text-blue-600 dark:text-blue-300 disabled:opacity-40"
                                  >
                                    Chọn hết
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setGroupPermissions(group.items, false)}
                                    disabled={!canWriteRoles || roleForm.id === "admin"}
                                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-300 disabled:opacity-40"
                                  >
                                    Bỏ
                                  </button>
                                </div>
                              </div>
                              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {group.items.map((permission) => {
                                  const checked = roleForm.id === "admin" || roleForm.permissions.includes(permission.id);
                                  return (
                                    <button
                                      type="button"
                                      key={permission.id}
                                      disabled={!canWriteRoles || roleForm.id === "admin"}
                                      onClick={() => toggleRolePermission(permission.id)}
                                      className={`min-h-12 flex items-center gap-3 text-left p-3 rounded-2xl border transition-all disabled:cursor-not-allowed ${
                                        checked
                                          ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/25 dark:border-blue-800 dark:text-blue-300"
                                          : "bg-white/80 border-slate-200 text-slate-600 hover:border-blue-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:border-blue-800"
                                      }`}
                                    >
                                      <span className={`h-5 w-5 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                                        checked
                                          ? "bg-blue-600 border-blue-600 text-white"
                                          : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                                      }`}>
                                        {checked && <Check className="h-3.5 w-3.5" />}
                                      </span>
                                      <span className="text-xs font-bold leading-snug">{permission.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center text-xs font-bold text-slate-400">
                        Chọn một quyền ở danh sách phía trên để xem ma trận quyền.
                      </div>
                    )}
                  </form>

                  {isRoleModalOpen && (
                    <div
                      onClick={() => setIsRoleModalOpen(false)}
                      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in-overlay"
                    >
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl max-h-[92vh] overflow-hidden transition-all animate-scale-in"
                      >
                        <form onSubmit={handleRoleSubmit} className="flex max-h-[92vh] flex-col">
                          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="text-base font-black text-slate-900 dark:text-white">
                                {editingRoleId ? "Chi tiết phân quyền" : "Tạo quyền mới"}
                              </h3>
                              <p className="text-xs text-slate-500 mt-1">
                                {selectedRole?.locked ? "Role hệ thống, không thể xóa." : "Chỉnh thông tin role và chọn các quyền cần cấp."}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsRoleModalOpen(false)}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-500 transition-colors"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="overflow-y-auto p-5 space-y-5">
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr,1fr,2fr] gap-3">
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Mã quyền *</label>
                                <input
                                  value={roleForm.id}
                                  onChange={(e) => setRoleForm((prev) => ({ ...prev, id: e.target.value }))}
                                  disabled={Boolean(editingRoleId)}
                                  required
                                  placeholder="manager, staff..."
                                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold disabled:opacity-60"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Tên hiển thị *</label>
                                <input
                                  value={roleForm.name}
                                  onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                                  required
                                  placeholder="Quản lí, Nhân viên..."
                                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Mô tả</label>
                                <input
                                  value={roleForm.description}
                                  onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                                  placeholder="Mô tả ngắn quyền này dùng cho nhóm nào..."
                                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                                />
                              </div>
                            </div>

                            <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
                              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Ma trận quyền</h4>
                                  <p className="text-xs text-slate-500 mt-1">Bấm từng quyền hoặc chọn nhanh cả nhóm.</p>
                                </div>
                                {roleForm.id === "admin" && (
                                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-2xl">
                                    Admin luôn có toàn quyền
                                  </span>
                                )}
                              </div>
                              <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {permissionGroups.map((group) => {
                                  const groupIds = group.items.map((item) => item.id);
                                  const checkedCount = roleForm.id === "admin"
                                    ? group.items.length
                                    : groupIds.filter((id) => roleForm.permissions.includes(id)).length;
                                  return (
                                    <div key={group.id} className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/70 dark:bg-slate-950/40 overflow-hidden">
                                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                                        <div>
                                          <h5 className="text-xs font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">{group.label}</h5>
                                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{checkedCount}/{group.items.length} quyền</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => setGroupPermissions(group.items, true)}
                                            disabled={!canWriteRoles || roleForm.id === "admin"}
                                            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black text-blue-600 dark:text-blue-300 disabled:opacity-40"
                                          >
                                            Chọn hết
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setGroupPermissions(group.items, false)}
                                            disabled={!canWriteRoles || roleForm.id === "admin"}
                                            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-300 disabled:opacity-40"
                                          >
                                            Bỏ
                                          </button>
                                        </div>
                                      </div>
                                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {group.items.map((permission) => {
                                          const checked = roleForm.id === "admin" || roleForm.permissions.includes(permission.id);
                                          return (
                                            <button
                                              type="button"
                                              key={permission.id}
                                              disabled={!canWriteRoles || roleForm.id === "admin"}
                                              onClick={() => toggleRolePermission(permission.id)}
                                              className={`min-h-12 flex items-center gap-3 text-left p-3 rounded-2xl border transition-all disabled:cursor-not-allowed ${
                                                checked
                                                  ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/25 dark:border-blue-800 dark:text-blue-300"
                                                  : "bg-white/80 border-slate-200 text-slate-600 hover:border-blue-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:border-blue-800"
                                              }`}
                                            >
                                              <span className={`h-5 w-5 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                                                checked
                                                  ? "bg-blue-600 border-blue-600 text-white"
                                                  : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                                              }`}>
                                                {checked && <Check className="h-3.5 w-3.5" />}
                                              </span>
                                              <span className="text-xs font-bold leading-snug">{permission.label}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900">
                            <div className="text-[10px] font-black text-slate-400 uppercase">
                              {grantedCount}/{allPermissionIds.length} quyền được cấp
                            </div>
                            <div className="flex justify-end gap-2">
                              {editingRoleId && (
                                <button
                                  type="button"
                                  onClick={handleDeleteRole}
                                  disabled={!canWriteRoles || selectedRole?.locked || savingRole}
                                  className="h-10 px-4 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-xs font-black transition-all disabled:opacity-40"
                                >
                                  Xóa
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setIsRoleModalOpen(false)}
                                className="h-10 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black"
                              >
                                Đóng
                              </button>
                              <RippleButton
                                type="submit"
                                disabled={!canWriteRoles || savingRole}
                                className="h-10 min-w-32 flex items-center justify-center gap-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
                              >
                                {savingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                <span>{editingRoleId ? "Lưu thay đổi" : "Tạo quyền"}</span>
                              </RippleButton>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Tab 5: orders (Invoices / Orders Management) */}
            {activeTab === "orders" && hasUiPermission("screen.orders") && (() => {
              // Thực hiện lọc đơn hàng ở local dựa trên các tiêu chí bộ lọc thông minh
              const filteredOrders = orders.filter((o) => {
                const matchesKeyword = !orderSearchKeyword.trim() || 
                  o.id.toString().includes(orderSearchKeyword.trim()) ||
                  o.customerPhone.includes(orderSearchKeyword.trim()) ||
                  o.customerName.toLowerCase().includes(orderSearchKeyword.toLowerCase());
                  
                const matchesOrderStatus = filterOrderStatus === "all" || o.orderStatus === filterOrderStatus;
                const matchesPaymentStatus = filterPaymentStatus === "all" || o.paymentStatus === filterPaymentStatus;
                const matchesPaymentMethod = filterPaymentMethod === "all" || o.paymentMethod === filterPaymentMethod;
                
                let matchesUsedOnly = true;
                if (filterUsedOnly) {
                  matchesUsedOnly = getItemsArray(o.orderItems).some((item) => {
                    const itemBadge = getOrderItemBadge(item);
                    if (!itemBadge) return false;
                    const b = itemBadge.toLowerCase();
                    return b.includes("old") || b.includes("cũ") || b.includes("like new") || b.includes("likenew") || b.includes("99") || b.includes("98") || b.includes("95");
                  });
                }
                
                let matchesDate = true;
                const orderDate = new Date(o.createdAt);
                if (filterStartDate) {
                  const start = new Date(filterStartDate);
                  start.setHours(0,0,0,0);
                  matchesDate = matchesDate && orderDate >= start;
                }
                if (filterEndDate) {
                  const end = new Date(filterEndDate);
                  end.setHours(23,59,59,999);
                  matchesDate = matchesDate && orderDate <= end;
                }
                
                return matchesKeyword && matchesOrderStatus && matchesPaymentStatus && matchesPaymentMethod && matchesUsedOnly && matchesDate;
              });
              const {
                totalPages: orderTotalPages,
                currentPage: currentOrderPage,
                pageItems: pagedOrders,
              } = getPaged(filteredOrders, orderPage, orderPageSize);

              return (
                <div className="space-y-6 animate-fade-in-up">
                  
                  {/* THANH BỘ LỌC THÔNG MINH (SMART FILTERS BAR) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white">Quản Lý Đơn Hàng & Vận Chuyển</h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Tra cứu đơn hàng, phê duyệt đóng gói, điều phối đơn vị vận chuyển, gán Số Serial Number bảo hành phần cứng và in phiếu xuất kho dán thùng hàng.
                        </p>
                      </div>
                      <button
                        onClick={fetchOrders}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        Làm mới danh sách
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {/* Tìm kiếm từ khóa */}
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                        <input
                          type="text"
                          value={orderSearchKeyword}
                          onChange={(e) => setOrderSearchKeyword(e.target.value)}
                          placeholder="Mã đơn, SĐT, Tên khách..."
                          className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 transition-all"
                        />
                      </div>

                      {/* Trạng thái đơn */}
                      <div>
                        <select
                          value={filterOrderStatus}
                          onChange={(e) => setFilterOrderStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-all font-semibold"
                        >
                          <option value="all">-- Trạng thái đơn --</option>
                          <option value="pending">Chờ duyệt (Pending)</option>
                          <option value="processing">Đang đóng gói (Processing)</option>
                          <option value="shipping">Đang giao hàng (Shipping)</option>
                          <option value="delivered">Đã giao thành công (Delivered)</option>
                          <option value="cancelled">Đã hủy đơn (Cancelled)</option>
                          <option value="returned">Đổi trả & Hoàn tiền (Returned)</option>
                        </select>
                      </div>

                      {/* Trạng thái thanh toán */}
                      <div>
                        <select
                          value={filterPaymentStatus}
                          onChange={(e) => setFilterPaymentStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-all font-semibold"
                        >
                          <option value="all">-- Trạng thái T/T --</option>
                          <option value="pending">Chờ xác nhận</option>
                          <option value="unpaid">Chưa thanh toán</option>
                          <option value="paid">Đã thanh toán</option>
                        </select>
                      </div>

                      {/* Phương thức thanh toán */}
                      <div>
                        <select
                          value={filterPaymentMethod}
                          onChange={(e) => setFilterPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-all font-semibold"
                        >
                          <option value="all">-- Phương thức T/T --</option>
                          <option value="bank">Chuyển khoản QR</option>
                          <option value="store">Tiền mặt tại Store</option>
                          <option value="cod">Ship COD bưu tá</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1.5">
                      {/* Lọc khoảng ngày đặt đơn */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Từ ngày</span>
                          <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 font-sans">Đến</span>
                          <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                          />
                        </div>
                        {(filterStartDate || filterEndDate) && (
                          <button
                            onClick={() => { setFilterStartDate(""); setFilterEndDate(""); }}
                            className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                          >
                            Xóa ngày
                          </button>
                        )}
                      </div>

                      {/* Lọc nhanh sản phẩm cũ */}
                      <div>
                        <button
                          onClick={() => setFilterUsedOnly(!filterUsedOnly)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                            filterUsedOnly
                              ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                        >
                          <Tag size={12} />
                          <span>Chỉ đơn chứa hàng cũ (Old/Like New)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* BẢNG DANH SÁCH ĐƠN HÀNG */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <p className="text-xs font-bold text-slate-500">Đã chọn {selectedOrderIds.length} hóa đơn</p>
                      <button
                        type="button"
                        onClick={() => handleBulkDelete("orders", selectedOrderIds)}
                        disabled={!canWriteOrders || selectedOrderIds.length === 0}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-xs font-black transition-all disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Xóa đã chọn</span>
                      </button>
                    </div>
                    {loadingOrders ? (
                      <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                    ) : filteredOrders.length === 0 ? (
                      <div className="p-20 text-center text-slate-400 font-bold text-xs">Không tìm thấy đơn hàng nào khớp với bộ lọc!</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-800">
                              <th className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  checked={pagedOrders.length > 0 && pagedOrders.every((o) => selectedOrderIds.includes(o.id))}
                                  onChange={() => togglePageSelection(pagedOrders, selectedOrderIds, setSelectedOrderIds)}
                                  className="h-4 w-4 accent-blue-600"
                                />
                              </th>
                              <th className="px-6 py-4">Mã đơn</th>
                              <th className="px-6 py-4">Khách hàng / Liên hệ</th>
                              <th className="px-6 py-4">Sản phẩm & Tình trạng</th>
                              <th className="px-6 py-4">Doanh thu đơn</th>
                              <th className="px-6 py-4">Thanh toán</th>
                              <th className="px-6 py-4">Trạng thái đơn</th>
                              <th className="px-6 py-4">Ngày đặt & Duyệt</th>
                              <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {pagedOrders.map((o, index) => {
                              // Định nghĩa màu sắc cho Trạng thái Đơn hàng
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
                                if (st === 'delivered') return 'Đã giao hàng';
                                if (st === 'cancelled') return 'Đã hủy đơn';
                                if (st === 'returned') return 'Đổi trả';
                                return st;
                              };

                              const getPaymentStatusBadge = (status) => {
                                if (status === 'paid') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                                if (status === 'pending') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                                return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
                              };

                              return (
                                <tr
                                  key={o.id}
                                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                                  onClick={() => openOrderDetailModal(o)}
                                  className="hover:bg-blue-50/40 dark:hover:bg-blue-950/10 transition-all duration-200 text-xs text-slate-700 dark:text-slate-400 animate-fade-in-up opacity-0 cursor-pointer group"
                                >
                                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={selectedOrderIds.includes(o.id)}
                                      onChange={() => toggleSelectedId(o.id, selectedOrderIds, setSelectedOrderIds)}
                                      className="h-4 w-4 accent-blue-600"
                                    />
                                  </td>
                                  {/* Mã đơn */}
                                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                                    <div className="flex flex-col gap-1.5">
                                      <span className="font-extrabold text-slate-900 dark:text-white">#{o.id}</span>
                                      {o.serialNumbers && Object.keys(o.serialNumbers).length > 0 && (
                                        <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wide">🎯 Đã gán S/N</span>
                                      )}
                                    </div>
                                  </td>
                                  
                                  {/* Khách hàng */}
                                  <td className="px-6 py-4 min-w-[160px]">
                                    <p className="font-bold text-slate-900 dark:text-white">{o.customerName}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{o.customerPhone}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-500 truncate max-w-[160px] mt-0.5" title={o.customerAddress}>
                                      {o.customerAddress}
                                    </p>
                                  </td>
                                  
                                  {/* Sản phẩm đã bán */}
                                  <td className="px-6 py-4 min-w-[220px]">
                                    <div className="space-y-1.5">
                                      {getItemsArray(o.orderItems).map((item, index) => {
                                        const itemBadge = getOrderItemBadge(item);
                                        return (
                                          <div key={index} className="flex items-center gap-2 text-[11px]">
                                            <img src={item.image} alt={item.name} className="w-7 h-7 object-cover rounded-lg border border-slate-100 dark:border-slate-800" />
                                            <div className="flex flex-col min-w-0 flex-1">
                                              <span className="truncate font-semibold text-slate-700 dark:text-slate-200 max-w-[150px]">{item.name}</span>
                                              <div className="flex items-center gap-1.5 mt-0.5">
                                                {itemBadge ? (
                                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${getBadgeClass(itemBadge)}`}>
                                                    {itemBadge}
                                                  </span>
                                                ) : (
                                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-400">
                                                    Chưa rõ
                                                  </span>
                                                )}
                                                <span className="text-[9px] text-slate-400 font-bold">x{item.quantity}</span>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                  
                                  {/* Dòng tiền */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                      <span className="font-black text-slate-900 dark:text-white text-sm">{formatVND(toVndInt(o.totalAmount))}</span>
                                      {Number(o.shippingFee) > 0 && (
                                        <span className="text-[9px] text-slate-400 mt-0.5">Ship: +{formatVND(Number(o.shippingFee))}</span>
                                      )}
                                      {Number(o.discountAmount) > 0 && (
                                        <span className="text-[9px] text-red-500 mt-0.5">Mã: -{formatVND(Number(o.discountAmount))}</span>
                                      )}
                                    </div>
                                  </td>
                                  
                                  {/* Phương thức & Trạng thái T/T */}
                                  <td className="px-6 py-4 whitespace-nowrap space-y-1">
                                    <div>
                                      {o.paymentMethod === 'bank' ? (
                                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold text-[9px] uppercase tracking-wide">Chuyển khoản</span>
                                      ) : o.paymentMethod === 'store' ? (
                                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[9px] uppercase tracking-wide">Tại Cửa Hàng</span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold text-[9px] uppercase tracking-wide">COD Bưu Tá</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className={`inline-block px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wide ${getPaymentStatusBadge(o.paymentStatus)}`}>
                                        {o.paymentStatus === 'paid' ? 'Đã T/T' : o.paymentStatus === 'pending' ? 'Chờ XN' : 'Chưa T/T'}
                                      </span>
                                    </div>
                                  </td>
                                  
                                  {/* Trạng thái đơn */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
                                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getOrderStatusBadge(o.orderStatus)}`}>
                                        {getOrderStatusText(o.orderStatus)}
                                      </span>
                                      {o.orderStatus === 'cancelled' && o.cancelReason && (
                                        <span className="text-[9px] text-red-500 font-medium max-w-[120px] truncate" title={o.cancelReason}>
                                          Lý do: {o.cancelReason}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  
                                  {/* Ngày đặt & Người duyệt */}
                                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                                    <p className="text-[10px] font-bold"><Clock size={10} className="inline mr-1" />{new Date(o.createdAt).toLocaleDateString("vi-VN")}</p>
                                    {o.approvedBy && (
                                      <p className="text-[9px] text-blue-500 font-bold mt-1 uppercase">Duyệt: {o.approvedBy}</p>
                                    )}
                                  </td>
                                  
                                  {/* Hành động — chỉ giữ nút Xóa nhỏ gọn, click row đã mở detail */}
                                  <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        onClick={() => openOrderDetailModal(o)}
                                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl transition-all cursor-pointer active:scale-90"
                                        title="Sửa / xem chi tiết hóa đơn"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteOrder(o.id)}
                                        className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-400 hover:text-red-600 rounded-xl border border-red-200/20 transition-all cursor-pointer active:scale-90"
                                        title="Xóa hóa đơn"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <PaginationControls
                          page={currentOrderPage}
                          totalPages={orderTotalPages}
                          totalItems={filteredOrders.length}
                          pageSize={orderPageSize}
                          onPageChange={setOrderPage}
                          onPageSizeChange={setOrderPageSize}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}


            {/* Tab 6: coupons (Marketing & Coupons Management) */}
            {activeTab === "coupons" && hasUiPermission("screen.coupons") && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-colors animate-fade-in-up">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Chiến dịch Khuyến mãi & Mã giảm giá</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Tạo các chương trình ưu đãi, xả kho chỉ áp dụng riêng cho hàng cũ (Old), hàng mới (New) hoặc phân loại theo Danh mục sản phẩm.
                    </p>
                  </div>
                  <RippleButton
                    onClick={() => openCouponModal("add")}
                    disabled={!canWriteCoupons}
                    className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-blue-600/20 transition-all active:scale-95 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span>Tạo mã giảm giá mới</span>
                  </RippleButton>
                </div>
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs font-bold text-slate-500">Đã chọn {selectedCouponIds.length} mã giảm giá</p>
                  <button
                    type="button"
                    onClick={() => handleBulkDelete("coupons", selectedCouponIds)}
                    disabled={!canWriteCoupons || selectedCouponIds.length === 0}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-xs font-black transition-all disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Xóa đã chọn</span>
                  </button>
                </div>

                {loadingCoupons ? (
                  <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                ) : coupons.length === 0 ? (
                  <div className="p-20 text-center text-slate-400 font-bold text-xs">Hiện tại chưa có chiến dịch khuyến mãi nào được tạo!</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-800">
                          <th className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={pagedCoupons.length > 0 && pagedCoupons.every((c) => selectedCouponIds.includes(c.id))}
                              onChange={() => togglePageSelection(pagedCoupons, selectedCouponIds, setSelectedCouponIds)}
                              className="h-4 w-4 accent-blue-600"
                            />
                          </th>
                          <th className="px-6 py-4">Mã Coupon</th>
                          <th className="px-6 py-4">Mô tả chương trình</th>
                          <th className="px-6 py-4">Mức giảm</th>
                          <th className="px-6 py-4">Áp dụng riêng</th>
                          <th className="px-6 py-4">Lượt sử dụng</th>
                          <th className="px-6 py-4">Thời hạn</th>
                          <th className="px-6 py-4">Trạng thái</th>
                          <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {pagedCoupons.map((c, index) => (
                          <tr
                            key={c.id}
                            style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                            onClick={() => canWriteCoupons && openCouponModal("edit", c)}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all duration-300 text-xs text-slate-700 dark:text-slate-400 animate-fade-in-up opacity-0 cursor-pointer"
                          >
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedCouponIds.includes(c.id)}
                                onChange={() => toggleSelectedId(c.id, selectedCouponIds, setSelectedCouponIds)}
                                className="h-4 w-4 accent-blue-600"
                              />
                            </td>
                            <td className="px-6 py-4 font-black whitespace-nowrap">
                              <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/50 rounded-xl font-mono text-xs font-black uppercase">
                                {c.code}
                              </span>
                            </td>
                            <td className="px-6 py-4 min-w-[180px]">
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{c.description || "Không có mô tả"}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Đơn tối thiểu: <span className="font-bold text-slate-500">{formatVND(Number(c.minOrderValue))}</span>
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-black text-slate-900 dark:text-white">
                              {c.discountType === "percentage" ? `${Number(c.discountValue)}%` : `-${formatVND(Number(c.discountValue))}`}
                            </td>
                            <td className="px-6 py-4 min-w-[150px]">
                              <div className="flex flex-wrap gap-1">
                                {(!c.applicableConditions || c.applicableConditions.length === 0) && (!c.applicableCategories || c.applicableCategories.length === 0) && (
                                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-lg font-bold">Mọi sản phẩm</span>
                                )}
                                {c.applicableConditions && c.applicableConditions.map(cond => (
                                  <span key={cond} className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 px-2 py-0.5 rounded-lg font-bold">
                                    Hàng {cond}
                                  </span>
                                ))}
                                {c.applicableCategories && c.applicableCategories.map(cat => (
                                  <span key={cat} className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 px-2 py-0.5 rounded-lg font-bold">
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-500">
                              {c.usedCount} {c.maxUses ? `/ ${c.maxUses}` : "lượt"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                              <p className="text-[10px]">T1: {c.startDate ? new Date(c.startDate).toLocaleDateString("vi-VN") : "Bất kỳ"}</p>
                              <p className="text-[10px]">T2: {c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : "Vô hạn"}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                const statusMeta = getCouponStatusMeta(c);
                                return (
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide border ${statusMeta.className}`}>
                                    {statusMeta.label}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                <button
                                  disabled={!canWriteCoupons}
                                  onClick={() => openCouponModal("edit", c)}
                                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl transition-all disabled:opacity-40"
                                  title="Chỉnh sửa mã"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  disabled={!canWriteCoupons}
                                  onClick={() => handleDeleteCoupon(c.id)}
                                  className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 rounded-xl transition-all disabled:opacity-40"
                                  title="Xóa mã"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <PaginationControls
                      page={currentCouponPage}
                      totalPages={couponTotalPages}
                      totalItems={coupons.length}
                      pageSize={couponPageSize}
                      onPageChange={setCouponPage}
                      onPageSizeChange={setCouponPageSize}
                    />
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Modal Add/Edit Product (Click-Outside support & Dynamic inputs) */}
      {isModalOpen && (
        <div 
          onClick={() => setIsModalOpen(false)} 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in-overlay"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto overflow-x-hidden transition-all scale-100 animate-scale-in"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {modalType === "add" ? "Thêm sản phẩm mới vào Shop" : "Chỉnh sửa chi tiết sản phẩm"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleProductSubmit} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-4">
                
                {/* Product Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Laptop Asus ZenBook Pro"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Category Selector (Dynamic) */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Danh mục *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      setFormSubCategory("");
                      setFormBrand("");
                      setProductPickerOpen(null);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                  >
                    {categoriesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {renderSmartPicker({
                  id: "subCategory",
                  label: "Phân loại",
                  value: formSubCategory,
                  options: formSubCategoryOptions,
                  searchValue: subCategorySearch,
                  setSearchValue: setSubCategorySearch,
                  onPick: (nextValue) => {
                    setFormSubCategory(nextValue);
                    setFormBrand("");
                  },
                  placeholder: "Chọn hoặc tạo phân loại",
                  emptyText: "Chưa có phân loại phù hợp.",
                  helperText: "Chọn phân loại đã tạo hoặc nhập tên mới ngay trong cửa sổ chọn.",
                })}

                {renderSmartPicker({
                  id: "brand",
                  label: "Hãng sản phẩm",
                  value: formBrand,
                  options: formBrandOptions,
                  searchValue: brandSearch,
                  setSearchValue: setBrandSearch,
                  onPick: setFormBrand,
                  placeholder: "Chọn hoặc tạo hãng",
                  emptyText: "Chưa có hãng phù hợp.",
                  helperText: "Danh sách hãng ưu tiên theo danh mục và phân loại đang chọn.",
                })}

                {/* Price */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Giá bán (VND) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 12990000"
                    value={formPrice}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                  {formPrice && (
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-bold">
                      👉 Định dạng: {formatVND(formPrice)}
                    </p>
                  )}
                </div>

                {/* Stock Count */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Số lượng tồn kho *</label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Structured Condition Badge Selector */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Nhãn hiển thị (Badge/Trạng thái)</label>
                  <select
                    value={formBadgePreset}
                    onChange={(e) => setFormBadgePreset(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                  >
                    <option value="New">Hàng mới (New)</option>
                    <option value="Like New">Like New (99%)</option>
                    <option value="Old">Đã qua sử dụng (Old)</option>
                  </select>
                </div>

                {/* Percentage Discount */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Giảm giá (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Ví dụ: 10 (cho 10%)"
                    value={formDiscount}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Discounted Price */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Giá sau giảm (VND)</label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 11691000"
                    value={formDiscountedPrice}
                    onChange={(e) => handleDiscountedPriceChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                  {formDiscountedPrice && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                      👉 Định dạng: {formatVND(formDiscountedPrice)}
                    </p>
                  )}
                </div>

                {/* isHot Checkbox */}
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isHot"
                    checked={formIsHot}
                    onChange={(e) => setFormIsHot(e.target.checked)}
                    className="h-4.5 w-4.5 text-blue-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="isHot" className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer">
                    🔥 Sản phẩm HOT nổi bật
                  </label>
                </div>


                {/* Product Image Manager */}
                <div className="sm:col-span-2 space-y-3">
                  <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500">Ảnh sản phẩm *</label>
                        <p className="text-[9px] text-slate-400 mt-0.5">Ảnh đầu tiên là ảnh đại diện. Có thể upload nhiều ảnh, dán URL, kéo thả hoặc đổi thứ tự.</p>
                      </div>

                      <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm shadow-blue-600/20">
                        {uploadingImage ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        <span>{uploadingImage ? "Đang tải ảnh..." : "Upload nhiều ảnh"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={uploadingImage}
                          onChange={handleImagesUploadMultiple}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={productImageUrlInput}
                        onChange={(e) => setProductImageUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddImageUrl();
                          }
                        }}
                        placeholder="Dán URL ảnh, có thể nhập nhiều URL ngăn cách bằng dấu phẩy"
                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        disabled={parseImageList(productImageUrlInput).length === 0}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-black transition-all disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Thêm URL</span>
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const productImages = parseImageList(formImages);
                    return productImages.length > 0 ? (
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500">Thư viện ảnh ({productImages.length})</span>
                          <span className="text-[9px] font-bold text-blue-600 dark:text-blue-300">Kéo ảnh để đổi thứ tự</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                          {productImages.map((imgUrl, idx) => (
                            <div
                              key={`${imgUrl}-${idx}`}
                              draggable
                              onDragStart={() => setDraggingImageIndex(idx)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => handleImageDrop(idx)}
                              onDragEnd={() => setDraggingImageIndex(null)}
                              className={`relative group rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden transition-all ${
                                idx === 0
                                  ? "border-blue-400 ring-2 ring-blue-500/20"
                                  : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
                              } ${draggingImageIndex === idx ? "opacity-50 scale-95" : ""}`}
                            >
                              <div className="aspect-square bg-slate-100 dark:bg-slate-800">
                                <img
                                  src={imgUrl}
                                  alt={`Ảnh sản phẩm ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100&auto=format&fit=crop" }}
                                />
                              </div>

                              <div className="absolute left-2 top-2 flex items-center gap-1">
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black shadow-sm ${
                                  idx === 0
                                    ? "bg-blue-600 text-white"
                                    : "bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300"
                                }`}>
                                  {idx === 0 ? "Ảnh chính" : `#${idx + 1}`}
                                </span>
                              </div>

                              <div className="absolute inset-x-2 bottom-2 grid grid-cols-4 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleMoveImage(idx, -1)}
                                  disabled={idx === 0}
                                  className="h-8 inline-flex items-center justify-center rounded-lg bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-sm disabled:opacity-40"
                                  title="Dời sang trái"
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveImage(idx, 1)}
                                  disabled={idx === productImages.length - 1}
                                  className="h-8 inline-flex items-center justify-center rounded-lg bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-sm disabled:opacity-40"
                                  title="Dời sang phải"
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(idx)}
                                  disabled={idx === 0}
                                  className="h-8 inline-flex items-center justify-center rounded-lg bg-blue-600/95 text-white shadow-sm disabled:opacity-40"
                                  title="Đặt làm ảnh chính"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx)}
                                  className="h-8 inline-flex items-center justify-center rounded-lg bg-red-600/95 text-white shadow-sm"
                                  title="Xóa ảnh"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 px-4 py-8 text-center">
                        <Upload className="h-7 w-7 mx-auto text-slate-400" />
                        <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">Chưa có ảnh sản phẩm</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Short description */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Mô tả ngắn gọn *</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Mô tả tóm tắt tính năng sản phẩm..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none font-semibold"
                  />
                </div>

                {/* Product Specifications (each on a line) */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Thông số kỹ thuật quan trọng (Mỗi thông số đặt trên một dòng)</label>
                  <textarea
                    rows="3"
                    placeholder="Intel Core i9 14900HX&#10;Nvidia RTX 4080 12GB&#10;32GB DDR5 RAM&#10;1TB NVMe Gen4 SSD"
                    value={formSpecs}
                    onChange={(e) => setFormSpecs(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Modal submit buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-400 font-bold text-xs rounded-xl transition-all"
                >
                  Hủy bỏ
                </button>
                <RippleButton
                  type="submit"
                  disabled={!canWriteProducts || submittingProduct}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-75 hover:-translate-y-0.5"
                >
                  {submittingProduct ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{modalType === "add" ? "Thêm sản phẩm" : "Lưu thay đổi"}</span>
                </RippleButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Category */}
      {isCatModalOpen && (
        <div 
          onClick={() => setIsCatModalOpen(false)} 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in-overlay"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl transition-all animate-scale-in"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {catModalType === "add" ? "Thêm danh mục mới" : "Chỉnh sửa tên danh mục"}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Tên danh mục mới *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Smartwatch, Camera, Console..."
                  value={formCatName}
                  onChange={(e) => setFormCatName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Hủy bỏ
                </button>
                <RippleButton
                  type="submit"
                  disabled={!canWriteCategories}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 hover:-translate-y-0.5"
                >
                  <span>{catModalType === "add" ? "Tạo danh mục" : "Lưu thay đổi"}</span>
                </RippleButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit User (Click-Outside support & Password views) */}
      {isUserModalOpen && (
        <div 
          onClick={() => setIsUserModalOpen(false)} 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in-overlay"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto transition-all animate-scale-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {userModalType === "add" ? "Tạo mới tài khoản thành viên" : "Cập nhật tài khoản thành viên"}
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Username */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn Hải"
                    value={formUserName}
                    onChange={(e) => setFormUserName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Địa chỉ Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    value={formUserEmail}
                    onChange={(e) => setFormUserEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Password field with Eye Toggle (Show/Hide) */}
                <div className="relative">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">
                    Mật khẩu {userModalType === "add" ? "*" : "(Để trống nếu không đổi)"}
                  </label>
                  <div className="relative">
                    <input
                      type={showUserPassword ? "text" : "password"}
                      required={userModalType === "add"}
                      placeholder={userModalType === "add" ? "Nhập mật khẩu..." : "Nhập mật khẩu mới..."}
                      value={formUserPassword}
                      onChange={(e) => setFormUserPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUserPassword(!showUserPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Vai trò (Role) *</label>
                  <select
                    value={formUserRole}
                    onChange={(e) => setFormUserRole(e.target.value)}
                    disabled={!canWriteUsers || editingUserId === currentUser?.id}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 0912345678"
                    value={formUserPhone}
                    onChange={(e) => setFormUserPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Địa chỉ giao hàng</label>
                  <input
                    type="text"
                    placeholder="Số nhà, ngõ/đường..."
                    value={formUserAddress}
                    onChange={(e) => setFormUserAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Thành phố</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hà Nội, TP. HCM..."
                    value={formUserCity}
                    onChange={(e) => setFormUserCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Hủy bỏ
                </button>
                <RippleButton
                  type="submit"
                  disabled={!canWriteUsers || submittingUser}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-75 hover:-translate-y-0.5"
                >
                  {submittingUser ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <Check className="h-4.5 w-4.5" />
                  )}
                  <span>{userModalType === "add" ? "Thêm thành viên" : "Lưu thay đổi"}</span>
                </RippleButton>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Modal Add/Edit Coupon (Premium glassmorphic modal with category & condition multi-select) */}
      {isCouponModalOpen && (
        <div 
          onClick={() => setIsCouponModalOpen(false)} 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in-overlay"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto transition-all animate-scale-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {couponModalType === "add" ? "Tạo mã giảm giá mới" : "Chỉnh sửa mã giảm giá"}
              </h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCouponSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Coupon Code */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Mã Coupon *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: XAKHO50"
                    value={formCouponCode}
                    onChange={(e) => setFormCouponCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold uppercase font-mono"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Mô tả chương trình *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Giảm giá xả kho hàng cũ Laptop"
                    value={formCouponDesc}
                    onChange={(e) => setFormCouponDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Loại giảm giá</label>
                  <select
                    value={formCouponType}
                    onChange={(e) => setFormCouponType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">
                    Giá trị giảm * ({formCouponType === "percentage" ? "%" : "đ"})
                  </label>
                  <input
                    type="number"
                    required
                    placeholder={formCouponType === "percentage" ? "Ví dụ: 10" : "Ví dụ: 50000"}
                    value={formCouponValue}
                    onChange={(e) => setFormCouponValue(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Min Order Value */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Giá trị đơn hàng tối thiểu (đ)</label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 200000"
                    value={formCouponMinOrder}
                    onChange={(e) => setFormCouponMinOrder(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Max Uses */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Giới hạn số lần sử dụng tối đa (Bỏ trống = Vô hạn)</label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 100"
                    value={formCouponMaxUses}
                    onChange={(e) => setFormCouponMaxUses(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Ngày bắt đầu hiệu lực</label>
                  <input
                    type="date"
                    value={formCouponStartDate}
                    onChange={(e) => setFormCouponStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Ngày kết thúc hiệu lực</label>
                  <input
                    type="date"
                    value={formCouponEndDate}
                    onChange={(e) => setFormCouponEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Applicable Product Conditions (Badge check) */}
                <div className="col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Áp dụng cho Tình trạng hàng (Để trống = Tất cả)</label>
                  <div className="flex gap-2.5 flex-wrap mt-1">
                    {["New", "Like New", "Old"].map(cond => {
                      const selected = formCouponConds.includes(cond);
                      return (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              setFormCouponConds(formCouponConds.filter(c => c !== cond));
                            } else {
                              setFormCouponConds([...formCouponConds, cond]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all border ${
                            selected 
                              ? "bg-indigo-600 text-white border-indigo-500 scale-[1.02]" 
                              : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {cond}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Applicable Categories */}
                <div className="col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Áp dụng cho Danh mục (Để trống = Tất cả)</label>
                  <div className="flex gap-2 flex-wrap mt-1 max-h-[100px] overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                    {categoriesList.map(cat => {
                      const selected = formCouponCats.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              setFormCouponCats(formCouponCats.filter(c => c !== cat));
                            } else {
                              setFormCouponCats([...formCouponCats, cat]);
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all border ${
                            selected 
                              ? "bg-emerald-600 text-white border-emerald-500" 
                              : "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Status */}
                <div className="sm:col-span-2 flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formCouponActive}
                    onChange={(e) => setFormCouponActive(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kích hoạt mã giảm giá
                  </label>
                </div>

              </div>

              {/* Modal footer submit buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Hủy bỏ
                </button>
                <RippleButton
                  type="submit"
                  disabled={!canWriteCoupons || submittingCoupon}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-75 hover:-translate-y-0.5"
                >
                  {submittingCoupon ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <Check className="h-4.5 w-4.5" />
                  )}
                  <span>{couponModalType === "add" ? "Tạo mã" : "Lưu thay đổi"}</span>
                </RippleButton>
              </div>
            </form>

          </div>
        </div>
      )}
      {/* ===================================================================
          MODAL CHI TIẾT ĐỚN HÀNG (rendered at root level — no clipping)
          =================================================================== */}
      {isOrderDetailModalOpen && selectedOrder && (() => {
        const isLocked = ['shipping', 'delivered', 'cancelled', 'returned'].includes(orderDetailOrderStatus);
        const calculateSubtotal = () => {
          const items = getItemsArray(selectedOrder.orderItems);
          return items.reduce((acc, item) => acc + (toVndInt(item.price) * item.quantity), 0);
        };
        const subtotal = calculateSubtotal();
        const discount = toVndInt(selectedOrder.discountAmount || 0);
        const finalTotal = subtotal + toVndInt(orderDetailShippingFee) - discount;

        return (
          <div
            onClick={() => setIsOrderDetailModalOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in-overlay"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto transition-all animate-scale-in"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-t-3xl">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>CHI TIẾT ĐỚN HÀNG #{selectedOrder.id}</span>
                    <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase tracking-wider font-mono">
                      {selectedOrder.paymentMethod === 'bank' ? 'Chuyển khoản' : selectedOrder.paymentMethod === 'store' ? 'Tại Store' : 'COD Bưu Tá'}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">Ngày đặt đơn: {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                <button
                  onClick={() => setIsOrderDetailModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveOrderDetail} className="p-6 space-y-6">
                {isLocked && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-400 rounded-xl text-[11px] font-bold">
                    <AlertCircle size={16} />
                    <span>Lưu ý: Thông tin khách hàng đã được khóa khi đơn đang giao, đã giao, đã hủy hoặc đổi trả. Admin vẫn có thể cập nhật trạng thái đơn, thanh toán, vận chuyển và serial.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CỘT 1 */}
                  <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-800 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                      <Truck size={14} /><span>Khách hàng &amp; Vận chuyển</span>
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Họ tên khách hàng</label>
                        <input type="text" value={orderDetailCustomerName} onChange={(e) => setOrderDetailCustomerName(e.target.value)} disabled={isLocked}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Số điện thoại</label>
                        <input type="text" value={orderDetailCustomerPhone} onChange={(e) => setOrderDetailCustomerPhone(e.target.value)} disabled={isLocked}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Địa chỉ giao hàng</label>
                        <input type="text" value={orderDetailCustomerAddress} onChange={(e) => setOrderDetailCustomerAddress(e.target.value)} disabled={isLocked}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Đơn vị VC</label>
                          <input type="text" value={orderDetailShippingUnit} onChange={(e) => setOrderDetailShippingUnit(e.target.value)} placeholder="GHN, GHTK, ViettelPost..."
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Mã vận đơn</label>
                          <input type="text" value={orderDetailTrackingNumber} onChange={(e) => setOrderDetailTrackingNumber(e.target.value)} placeholder="Mã tracking..."
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Phí vận chuyển (VND)</label>
                        <input type="number" value={orderDetailShippingFee} onChange={(e) => setOrderDetailShippingFee(e.target.value)} min="0"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* CỘT 2 */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                      <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                        <CreditCard size={14} /><span>Trạng thái đơn hàng</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Trạng thái đơn</label>
                          <select value={orderDetailOrderStatus} onChange={(e) => setOrderDetailOrderStatus(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all">
                            <option value="pending">Chờ duyệt</option>
                            <option value="processing">Đang xử lý</option>
                            <option value="shipping">Đang giao hàng</option>
                            <option value="delivered">Giao thành công</option>
                            <option value="cancelled">Đã hủy đơn</option>
                            <option value="returned">Yêu cầu đổi trả</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Thanh toán</label>
                          <select value={orderDetailPaymentStatus} onChange={(e) => setOrderDetailPaymentStatus(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all">
                            <option value="pending">Chưa thanh toán</option>
                            <option value="paid">Đã thanh toán</option>
                          </select>
                        </div>
                      </div>
                      {orderDetailOrderStatus === 'cancelled' && (
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Lý do hủy đơn</label>
                          <input type="text" value={orderDetailCancelReason} onChange={(e) => setOrderDetailCancelReason(e.target.value)} placeholder="Nhập lý do..."
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
                        </div>
                      )}
                    </div>

                    {/* Tóm tắt thanh toán */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/40 p-4 rounded-2xl text-xs space-y-1.5">
                      <h4 className="font-black uppercase text-blue-600 dark:text-blue-400 pb-1.5 border-b border-blue-100 dark:border-blue-900">Tóm tắt thanh toán</h4>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Tiền hàng:</span><span className="font-bold">{formatVND(subtotal)}</span></div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Phí vận chuyển:</span><span className="font-bold">+{formatVND(toVndInt(orderDetailShippingFee))}</span></div>
                      {discount > 0 && <div className="flex justify-between text-red-500"><span>Giảm giá ({selectedOrder.couponCode}):</span><span>-{formatVND(discount)}</span></div>}
                      <div className="flex justify-between text-slate-900 dark:text-white font-black text-sm pt-1.5 border-t border-blue-200/50 dark:border-blue-900"><span>Tổng cộng:</span><span className="text-blue-600">{formatVND(finalTotal)}</span></div>
                    </div>
                  </div>
                </div>

                {/* Bảng sản phẩm & S/N */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-slate-700 dark:text-slate-300 text-xs">Sản phẩm & Gán số Serial (S/N)</div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {getItemsArray(selectedOrder.orderItems).map((item, idx) => {
                      const snKey = item.productId || idx;
                      return (
                        <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">SL: x{item.quantity} &bull; {formatVND(toVndInt(item.price))}</p>
                          </div>
                          <div className="flex-shrink-0 w-full sm:w-52">
                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Số Serial (S/N)</label>
                            <input
                              type="text"
                              value={orderDetailSerialNumbers[snKey] || ""}
                              onChange={(e) => setOrderDetailSerialNumbers(prev => ({ ...prev, [snKey]: e.target.value }))}
                              placeholder="Nhập số serial..."
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-mono font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <button
                      type="button"
                      onClick={() => handlePrintPackingSlip(selectedOrder)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>In phiếu xuất kho</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsOrderDetailModalOpen(false)}
                      className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <RippleButton
                      type="submit"
                      disabled={!canWriteOrders || savingOrderDetail}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-500/20 hover:-translate-y-0.5"
                    >
                      {savingOrderDetail ? "Đang cập nhật..." : "Cập nhật đơn hàng"}
                    </RippleButton>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

