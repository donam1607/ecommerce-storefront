import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Users, ShoppingBag, X, Loader2, AlertCircle, ShieldAlert, Check, Upload, BarChart3, Boxes, UserCog, Wallet, Eye, EyeOff, Search, FileText, Printer, Truck, Calendar, Clock, CreditCard, Tag } from "lucide-react";
import { formatVND, toVndInt } from "../utils/money";

const API_URL = "https://shoptech-backend.onrender.com";

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

export default function Admin() {
  const [activeTab, setActiveTab] = useState("stats"); // stats | products | categories | users | orders
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [categoriesList, setCategoriesList] = useState(["Laptop", "Monitor", "Keyboard", "Headphones", "Smartphone", "Accessories"]);
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState(null);

  // Filters for product list
  const [prodSearch, setProdSearch] = useState("");
  const [prodCatFilter, setProdCatFilter] = useState("All");
  const [prodCondFilter, setProdCondFilter] = useState("All");
  
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
  const [formBadgePreset, setFormBadgePreset] = useState(""); // New | Like New | Old | Custom
  const [formBadgeCustom, setFormBadgeCustom] = useState("");
  const [formImages, setFormImages] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSpecs, setFormSpecs] = useState("");
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Category management states
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catModalType, setCatModalType] = useState("add"); // add | edit
  const [editingCatName, setEditingCatName] = useState("");
  const [formCatName, setFormCatName] = useState("");

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
  const [formUserZip, setFormUserZip] = useState("");
  const [submittingUser, setSubmittingUser] = useState(false);

  // Coupon management states
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
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
  const [savingOrderDetail, setSavingOrderDetail] = useState(false);

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
      const response = await fetch(`${API_URL}/api/products`);
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

  // Fetch orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
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
    setIsOrderDetailModalOpen(true);
  };

  const handleSaveOrderDetail = async (e) => {
    e.preventDefault();
    setSavingOrderDetail(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: orderDetailCustomerName,
          customerPhone: orderDetailCustomerPhone,
          customerAddress: orderDetailCustomerAddress,
          paymentStatus: orderDetailPaymentStatus,
          orderStatus: orderDetailOrderStatus,
          shippingUnit: orderDetailShippingUnit,
          trackingNumber: orderDetailTrackingNumber,
          shippingFee: Number(orderDetailShippingFee),
          serialNumbers: orderDetailSerialNumbers
        })
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
    const itemsHtml = order.orderItems.map((item, idx) => {
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
      
      const badgeVal = prod.badge || "";
      if (["", "New", "Like New", "Old", "Best Seller", "Top Rated", "Sale"].includes(badgeVal)) {
        setFormBadgePreset(badgeVal);
        setFormBadgeCustom("");
      } else {
        setFormBadgePreset("Custom");
        setFormBadgeCustom(badgeVal);
      }

      setFormImages(prod.images ? prod.images.join(", ") : "");
      setFormDesc(prod.description);
      setFormSpecs(prod.specs ? prod.specs.join("\n") : "");
    } else {
      setEditingId(null);
      setFormName("");
      setFormCategory(categoriesList[0] || "Laptop");
      setFormPrice("");
      setFormStock("10");
      setFormBadgePreset("New");
      setFormBadgeCustom("");
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
    
    const badgeVal = formBadgePreset === "Custom" ? formBadgeCustom : formBadgePreset;
    const token = localStorage.getItem("token");
    
    const payload = {
      name: formName,
      category: formCategory,
      price: parseFloat(formPrice),
      images: formImages.split(",").map(i => i.trim()).filter(Boolean),
      description: formDesc,
      specs: formSpecs.split("\n").map(s => s.trim()).filter(Boolean),
      countInStock: parseInt(formStock),
      badge: badgeVal || null
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
        const currentImages = formImages ? formImages.split(",").map(i => i.trim()).filter(Boolean) : [];
        const newImages = [...currentImages, ...data.imageUrls];
        setFormImages(newImages.join(", "));
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

  const handleRemoveImage = (indexToRemove) => {
    const currentImages = formImages ? formImages.split(",").map(i => i.trim()).filter(Boolean) : [];
    const updatedImages = currentImages.filter((_, idx) => idx !== indexToRemove);
    setFormImages(updatedImages.join(", "));
  };

  // Category Management Methods
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
    const cName = formCatName.trim();
    if (!cName) return;

    if (catModalType === "add") {
      setCategoriesList(prev => Array.from(new Set([...prev, cName])));
      setIsCatModalOpen(false);
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
        setIsCatModalOpen(false);
        fetchProducts();
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
      } else {
        const data = await response.json();
        alert(data.message || "Lỗi xóa mã giảm giá.");
      }
    } catch (err) {
      alert("Lỗi kết nối đến server.");
    }
  };

  // Filter products for display in Table
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(prodSearch.toLowerCase()) || 
                        p.category.toLowerCase().includes(prodSearch.toLowerCase()) ||
                        (p.badge && p.badge.toLowerCase().includes(prodSearch.toLowerCase()));
    const matchCat = prodCatFilter === "All" || p.category === prodCatFilter;
    
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

    return matchSearch && matchCat && matchCond;
  });

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
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-205 font-bold rounded-xl transition-all active:scale-95"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Main Administrative Layout Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR PANEL (Desktop) / TOP PANEL (Mobile) */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-6 sticky top-24 transition-colors">
              <div className="px-2">
                <span className="text-[10px] text-blue-500 uppercase tracking-widest font-black">Hệ thống</span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">ShopTech Admin</h2>
                <div className="flex items-center gap-2 mt-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <div className="h-8 w-8 rounded-xl bg-blue-650 text-white flex items-center justify-center font-bold text-sm uppercase">
                    {currentUser?.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate text-slate-800 dark:text-slate-205">{currentUser?.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">Administrator</p>
                  </div>
                </div>
              </div>

              {/* TAB BUTTONS */}
              <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto scrollbar-hide lg:overflow-x-visible pb-2 lg:pb-0">
                {[
                  { id: "stats", label: "Báo Cáo Thống Kê", icon: BarChart3 },
                  { id: "products", label: "Quản Lý Sản Phẩm", icon: ShoppingBag },
                  { id: "categories", label: "Quản Lý Danh Mục", icon: Boxes },
                  { id: "orders", label: "Quản Lý Hóa Đơn", icon: FileText },
                  { id: "coupons", label: "Quản Lý Khuyến Mãi", icon: Wallet },
                  { id: "users", label: "Quản Lý Thành Viên", icon: Users }

                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all flex-shrink-0 ${
                        active
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/15 scale-[1.02]"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* RIGHT CONTENT WORKSPACE */}
          <main className="flex-1 min-w-0 space-y-6">
            
            {/* Tab 1: stats (Statistics Panel) */}
            {activeTab === "stats" && (
              <div className="space-y-6 animate-fade-in">
                {/* KPIs Dashboard Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-5 flex items-start gap-3.5 shadow-lg shadow-blue-500/10">
                    <div className="h-11 w-11 rounded-2xl bg-white/10 text-white flex items-center justify-center flex-shrink-0">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-blue-200">Tổng doanh thu</p>
                      <p className="text-xl font-black mt-0.5">{formatVND(totalRevenue)}</p>
                      <p className="text-[10px] text-blue-100 mt-1.5">Doanh thu từ đơn đã thanh toán</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-start gap-3.5 shadow-sm transition-colors">
                    <div className="h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-650 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Đã bán thành công</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalSoldItems} sản phẩm</p>
                      <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-1.5">Số lượng máy & phụ kiện bán ra</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-start gap-3.5 shadow-sm transition-colors">
                    <div className="h-11 w-11 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                      <Boxes className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Giá trị tồn kho</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{formatVND(inventoryValue)}</p>
                      <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-1.5">Tổng giá trị vốn sản phẩm hiện tại</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-start gap-3.5 shadow-sm transition-colors">
                    <div className="h-11 w-11 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-650 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                      <UserCog className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Tổng sản phẩm tồn</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalStock} máy</p>
                      <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-1.5">Tổng số máy còn lại trong kho</p>
                    </div>
                  </div>
                </div>

                {/* Top Sellers & Top Customers Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Sellers */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                      Sản phẩm bán chạy nhất
                    </h3>
                    <div className="divide-y divide-slate-100 dark:divide-slate-850">
                      {topSoldProducts.map((p, idx) => (
                        <div key={p.id} className="flex items-center gap-3 py-3 text-xs">
                          <span className="font-extrabold text-slate-400 text-sm w-4">#{idx+1}</span>
                          <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200 dark:border-slate-800" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 dark:text-white truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-400">Doanh thu: {formatVND(p.value)}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-650 dark:text-blue-400 font-extrabold rounded-lg text-[10px]">
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
                    <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                      Khách hàng VIP mua nhiều nhất
                    </h3>
                    <div className="divide-y divide-slate-100 dark:divide-slate-850">
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
                  <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Thống kê theo danh mục</h2>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Cập nhật thực tế</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-550 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-850">
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
                            <tr key={cat} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors text-xs text-slate-700 dark:text-slate-350">
                              <td className="px-6 py-4 font-bold text-slate-850 dark:text-white">{cat}</td>
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
            {activeTab === "products" && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Advanced Search & Filtering Block */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Kho Hàng Sản Phẩm ({filteredProducts.length})</h2>
                    <button
                      onClick={() => openModal("add")}
                      className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 flex-shrink-0"
                    >
                      <Plus className="h-4.5 w-4.5" />
                      <span>Thêm sản phẩm mới</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Tìm theo tên, danh mục, nhãn..."
                        value={prodSearch}
                        onChange={(e) => setProdSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-850 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    </div>

                    {/* Category Filter */}
                    <select
                      value={prodCatFilter}
                      onChange={(e) => setProdCatFilter(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-850 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                    >
                      <option value="All">Tất cả danh mục</option>
                      {categoriesList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    {/* Badge/Condition Filter */}
                    <select
                      value={prodCondFilter}
                      onChange={(e) => setProdCondFilter(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-850 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold"
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
                          <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-550 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-850">
                            <th className="px-6 py-4">Ảnh</th>
                            <th className="px-6 py-4">Tên sản phẩm</th>
                            <th className="px-6 py-4">Danh mục</th>
                            <th className="px-6 py-4">Giá tiền</th>
                            <th className="px-6 py-4">Kho hàng</th>
                            <th className="px-6 py-4">Nhãn (Badge)</th>
                            <th className="px-6 py-4">Ngày tạo</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {filteredProducts.map((prod) => (
                            <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors text-xs text-slate-700 dark:text-slate-350">
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
                              <td className="px-6 py-4 font-bold text-slate-850 dark:text-white max-w-[200px] truncate">{prod.name}</td>
                              <td className="px-6 py-4 font-semibold">{prod.category}</td>
                              <td className="px-6 py-4 font-black text-slate-900 dark:text-white">{formatVND(prod.price)}</td>
                              <td className="px-6 py-4 font-bold text-emerald-650 dark:text-emerald-400">{prod.countInStock} cái</td>
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

                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => openModal("edit", prod)}
                                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-200 rounded-xl transition-all"
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
              </div>
            )}

            {/* Tab 3: categories (Dynamic Category Management Panel) */}
            {activeTab === "categories" && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Quản Lý Danh Mục Công Nghệ</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đổi tên hoặc thêm danh mục mới sẽ tự động cập nhật và phân loại bộ lọc động ngoài trang chủ.</p>
                  </div>
                  <button
                    onClick={() => openCatModal("add")}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 flex-shrink-0"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span>Thêm danh mục mới</span>
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-colors">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-550 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-850">
                          <th className="px-6 py-4">Tên danh mục</th>
                          <th className="px-6 py-4">Số lượng sản phẩm liên đới</th>
                          <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                        {categoriesList.map((catName) => {
                          const associatedCount = products.filter(p => p.category === catName).length;
                          return (
                            <tr key={catName} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors text-xs text-slate-700 dark:text-slate-350">
                              <td className="px-6 py-4 font-black text-slate-850 dark:text-white">{catName}</td>
                              <td className="px-6 py-4 font-bold text-slate-500">{associatedCount} sản phẩm đang bán</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => openCatModal("edit", catName)}
                                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-200 rounded-xl transition-all"
                                    title="Sửa tên danh mục"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(catName)}
                                    className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 rounded-xl transition-all"
                                    title="Xóa danh mục"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: users (User Panel with password creation and toggles) */}
            {activeTab === "users" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-colors animate-fade-in">
                <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Danh sách quản lý thành viên</h2>
                    <p className="text-xs text-slate-500 mt-1">Admin có thể thêm thành viên mới, cấp vai trò, đổi mật khẩu và xem trực tiếp chuỗi mật khẩu gõ vào.</p>
                  </div>
                  <button
                    onClick={() => openUserModal("add")}
                    className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span>Thêm thành viên mới</span>
                  </button>
                </div>

                {loadingUsers ? (
                  <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-650" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-550 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-850">
                          <th className="px-6 py-4">Tên người dùng</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Ngày đăng ký</th>
                          <th className="px-6 py-4">Quyền hạn (Role)</th>
                          <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors text-xs text-slate-700 dark:text-slate-350">
                            <td className="px-6 py-4 font-bold text-slate-850 dark:text-white flex items-center gap-2">
                              <div className="h-8 w-8 rounded-xl bg-slate-105 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                {u.name.charAt(0)}
                              </div>
                              <span className="truncate">{u.name}</span>
                              {currentUser?.id === u.id && (
                                <span className="text-[9px] font-black uppercase tracking-wide bg-blue-50 dark:bg-blue-900/25 text-blue-500 px-1.5 py-0.5 rounded">Bạn</span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-semibold">{u.email}</td>
                            <td className="px-6 py-4 opacity-80">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                            <td className="px-6 py-4">
                              <select
                                disabled={currentUser?.id === u.id}
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                              >
                                <option value="user">User (Thường)</option>
                                <option value="admin">Admin (Quản trị)</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => openUserModal("edit", u)}
                                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-200 rounded-xl transition-all"
                                  title="Sửa & Cập nhật mật khẩu"
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

            {/* Tab 5: orders (Invoices / Orders Management) */}
            {activeTab === "orders" && (() => {
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
                  matchesUsedOnly = o.orderItems && o.orderItems.some((item) => {
                    if (!item.badge) return false;
                    const b = item.badge.toLowerCase();
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

              return (
                <div className="space-y-6 animate-fade-in">
                  
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
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        Làm mới danh sách
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
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
                              ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-650 dark:text-indigo-400"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750"
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
                    {loadingOrders ? (
                      <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-650" /></div>
                    ) : filteredOrders.length === 0 ? (
                      <div className="p-20 text-center text-slate-400 font-bold text-xs">Không tìm thấy đơn hàng nào khớp với bộ lọc!</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-550 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-850">
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
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                            {filteredOrders.map((o) => {
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
                                <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors text-xs text-slate-700 dark:text-slate-350">
                                  {/* Mã đơn */}
                                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                                    <div className="flex flex-col">
                                      <span>#{o.id}</span>
                                      {o.serialNumbers && Object.keys(o.serialNumbers).length > 0 && (
                                        <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wide mt-1">🎯 Đã gán S/N</span>
                                      )}
                                    </div>
                                  </td>
                                  
                                  {/* Khách hàng */}
                                  <td className="px-6 py-4 min-w-[160px]">
                                    <p className="font-bold text-slate-900 dark:text-white">{o.customerName}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{o.customerPhone}</p>
                                    <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate max-w-[160px] mt-0.5" title={o.customerAddress}>
                                      {o.customerAddress}
                                    </p>
                                  </td>
                                  
                                  {/* Sản phẩm đã bán */}
                                  <td className="px-6 py-4 min-w-[220px]">
                                    <div className="space-y-1.5">
                                      {o.orderItems && o.orderItems.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2 text-[11px]">
                                          <img src={item.image} alt={item.name} className="w-7 h-7 object-cover rounded-lg border border-slate-100 dark:border-slate-800" />
                                          <div className="flex flex-col min-w-0 flex-1">
                                            <span className="truncate font-semibold text-slate-700 dark:text-slate-200 max-w-[150px]">{item.name}</span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${getBadgeClass(item.badge)}`}>
                                                {item.badge || 'New'}
                                              </span>
                                              <span className="text-[9px] text-slate-400 font-bold">x{item.quantity}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
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
                                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 font-bold text-[9px] uppercase tracking-wide">COD Bưu Tá</span>
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
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getOrderStatusBadge(o.orderStatus)}`}>
                                      {getOrderStatusText(o.orderStatus)}
                                    </span>
                                  </td>
                                  
                                  {/* Ngày đặt & Người duyệt */}
                                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                                    <p className="text-[10px] font-bold"><Clock size={10} className="inline mr-1" />{new Date(o.createdAt).toLocaleDateString("vi-VN")}</p>
                                    {o.approvedBy && (
                                      <p className="text-[9px] text-blue-500 font-bold mt-1 uppercase">Duyệt: {o.approvedBy}</p>
                                    )}
                                  </td>
                                  
                                  {/* Hành động */}
                                  <td className="px-6 py-4 text-right whitespace-nowrap">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => openOrderDetailModal(o)}
                                        className="flex items-center gap-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[10px] rounded-xl border border-blue-200/30 transition-all cursor-pointer shadow-xs"
                                        title="Xem chi tiết đơn hàng"
                                      >
                                        <FileText size={12} />
                                        <span>Xem chi tiết</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteOrder(o.id)}
                                        className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 rounded-xl border border-red-200/20 transition-all cursor-pointer shadow-xs"
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
                      </div>
                    )}
                  </div>

                  {/* ---------------------------------------------------------
                      MODAL: TRANG CHI TIẾT ĐƠN HÀNG & GÁN SERIAL (ORDER DETAILS)
                      --------------------------------------------------------- */}
                  {isOrderDetailModalOpen && selectedOrder && (() => {
                    const isLocked = ['shipping', 'delivered', 'cancelled', 'returned'].includes(orderDetailOrderStatus);
                    
                    // Tính toán tự động tổng tiền sản phẩm trong đơn hàng
                    const calculateSubtotal = () => {
                      return selectedOrder.orderItems.reduce((acc, item) => acc + (toVndInt(item.price) * item.quantity), 0);
                    };
                    const subtotal = calculateSubtotal();
                    const discount = toVndInt(selectedOrder.discountAmount || 0);
                    const finalTotal = subtotal + toVndInt(orderDetailShippingFee) - discount;

                    return (
                      <div 
                        onClick={() => setIsOrderDetailModalOpen(false)}
                        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
                      >
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto transition-all animate-scale-in"
                        >
                          {/* Modal Header */}
                          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-t-3xl">
                            <div>
                              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span>CHI TIẾT ĐƠN HÀNG #{selectedOrder.id}</span>
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
                            
                            {/* Cảnh báo Lock Rule nếu đơn đã giao/đang giao */}
                            {isLocked && (
                              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-400 rounded-xl text-[11px] font-bold">
                                <AlertCircle size={16} />
                                <span>Lưu ý: Dữ liệu khách hàng đã được KHÓA cứng do đơn hàng đang giao, đã giao, đã hủy hoặc đổi trả để tránh thất thoát và đảm bảo minh bạch vận hành!</span>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* CỘT 1: THÔNG TIN KHÁCH HÀNG & VẬN CHUYỂN */}
                              <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-850 p-5 rounded-2xl space-y-4">
                                <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
                                  <Truck size={14} />
                                  <span>Khách hàng & Vận chuyển</span>
                                </h4>

                                <div>
                                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-1">Họ tên khách hàng</label>
                                  <input
                                    type="text"
                                    value={orderDetailCustomerName}
                                    onChange={(e) => setOrderDetailCustomerName(e.target.value)}
                                    disabled={isLocked}
                                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-1">Số điện thoại</label>
                                  <input
                                    type="text"
                                    value={orderDetailCustomerPhone}
                                    onChange={(e) => setOrderDetailCustomerPhone(e.target.value)}
                                    disabled={isLocked}
                                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-1">Địa chỉ nhận hàng</label>
                                  <textarea
                                    value={orderDetailCustomerAddress}
                                    onChange={(e) => setOrderDetailCustomerAddress(e.target.value)}
                                    disabled={isLocked}
                                    rows="2"
                                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
                                    required
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-1">Đơn vị vận chuyển</label>
                                    <select
                                      value={orderDetailShippingUnit}
                                      onChange={(e) => setOrderDetailShippingUnit(e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                                    >
                                      <option value="">-- Chọn ĐV VC --</option>
                                      <option value="GHTK">Giao Hàng Tiết Kiệm (GHTK)</option>
                                      <option value="GHN">Giao Hàng Nhanh (GHN)</option>
                                      <option value="Viettel Post">Viettel Post</option>
                                      <option value="DHL">DHL Express</option>
                                      <option value="GrabExpress">GrabExpress</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-1">Mã vận đơn</label>
                                    <input
                                      type="text"
                                      value={orderDetailTrackingNumber}
                                      onChange={(e) => setOrderDetailTrackingNumber(e.target.value)}
                                      placeholder="Mã vận đơn bưu cục..."
                                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* CỘT 2: THÔNG TIN TRẠNG THÁI & THANH TOÁN */}
                              <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-850 p-5 rounded-2xl space-y-4">
                                <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
                                  <CreditCard size={14} />
                                  <span>Trạng thái & Thanh toán</span>
                                </h4>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-1">Trạng thái giao hàng</label>
                                    <select
                                      value={orderDetailOrderStatus}
                                      onChange={(e) => setOrderDetailOrderStatus(e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 font-bold"
                                    >
                                      <option value="pending">⏳ Chờ duyệt (Pending)</option>
                                      <option value="processing">📦 Đang đóng gói (Processing)</option>
                                      <option value="shipping">🚚 Đang giao hàng (Shipping)</option>
                                      <option value="delivered">✅ Đã giao thành công (Delivered)</option>
                                      <option value="cancelled">❌ Đã hủy đơn (Cancelled)</option>
                                      <option value="returned">💜 Đổi trả & Hoàn tiền (Returned)</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-1">Trạng thái thanh toán</label>
                                    <select
                                      value={orderDetailPaymentStatus}
                                      onChange={(e) => setOrderDetailPaymentStatus(e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 font-bold"
                                    >
                                      <option value="pending">⏳ Chờ xác nhận</option>
                                      <option value="unpaid">❌ Chưa thanh toán</option>
                                      <option value="paid">✅ Đã thanh toán</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="pt-2.5 space-y-2 text-xs border-t border-slate-100 dark:border-slate-850">
                                  <div className="flex justify-between text-slate-550">
                                    <span>Tổng tiền hàng (tạm tính):</span>
                                    <span className="font-bold">{formatVND(subtotal)}</span>
                                  </div>

                                  <div className="flex justify-between items-center text-slate-550">
                                    <span>Phí giao hàng:</span>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        value={orderDetailShippingFee}
                                        onChange={(e) => setOrderDetailShippingFee(e.target.value)}
                                        className="w-20 px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-right font-bold"
                                      />
                                      <span className="font-bold">đ</span>
                                    </div>
                                  </div>

                                  {discount > 0 && (
                                    <div className="flex justify-between text-red-500 font-semibold">
                                      <span>Khấu trừ Khuyến mãi ({selectedOrder.couponCode}):</span>
                                      <span>-{formatVND(discount)}</span>
                                    </div>
                                  )}

                                  <div className="flex justify-between text-sm pt-2 border-t border-slate-250 dark:border-slate-700 font-black text-slate-900 dark:text-white">
                                    <span>Tổng thực khách phải trả:</span>
                                    <span className="text-base text-blue-650 dark:text-blue-400">{formatVND(finalTotal)}</span>
                                  </div>
                                </div>

                                {selectedOrder.approvedBy && (
                                  <div className="text-[10px] text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-2.5 rounded-xl font-bold uppercase tracking-wide mt-2">
                                    👤 Người phê duyệt đơn hàng: {selectedOrder.approvedBy}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* KHỐI 3: DANH SÁCH SẢN PHẨM & GÁN SỐ SERIAL NUMBER */}
                            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                  <Boxes size={14} />
                                  <span>Danh sách sản phẩm & gán số Serial Number (S/N)</span>
                                </h4>
                                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">Số lượng: {selectedOrder.orderItems.length} sản phẩm</span>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-800">
                                      <th className="px-5 py-3">Ảnh</th>
                                      <th className="px-5 py-3">Tên sản phẩm & Cấu hình</th>
                                      <th className="px-5 py-3 text-center">Tình trạng</th>
                                      <th className="px-5 py-3 text-center">SL</th>
                                      <th className="px-5 py-3">Đơn giá</th>
                                      <th className="px-5 py-3">Mã Số Serial (S/N)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {selectedOrder.orderItems.map((item, index) => {
                                      return (
                                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                                          <td className="px-5 py-3">
                                            <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded-lg border border-slate-200" />
                                          </td>
                                          <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white max-w-[240px] truncate">{item.name}</td>
                                          <td className="px-5 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${getBadgeClass(item.badge)}`}>
                                              {item.badge || 'New'}
                                            </span>
                                          </td>
                                          <td className="px-5 py-3 text-center font-bold">{item.quantity}</td>
                                          <td className="px-5 py-3 font-black text-slate-900 dark:text-white">{formatVND(toVndInt(item.price))}</td>
                                          <td className="px-5 py-3">
                                            <input
                                              type="text"
                                              value={orderDetailSerialNumbers[item.productId] || orderDetailSerialNumbers[index] || ""}
                                              onChange={(e) => {
                                                const updatedSerials = { ...orderDetailSerialNumbers };
                                                updatedSerials[item.productId] = e.target.value;
                                                // Gán đồng thời key theo index để dự phòng tương thích ngược
                                                updatedSerials[index] = e.target.value;
                                                setOrderDetailSerialNumbers(updatedSerials);
                                              }}
                                              placeholder="Gán S/N phần cứng..."
                                              className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono focus:border-blue-500 w-full"
                                            />
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-850">
                              <div>
                                <button
                                  type="button"
                                  onClick={() => handlePrintPackingSlip(selectedOrder)}
                                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                                >
                                  <Printer size={14} />
                                  <span>In phiếu xuất kho dán thùng</span>
                                </button>
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setIsOrderDetailModalOpen(false)}
                                  className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                                >
                                  Hủy bỏ
                                </button>
                                <button
                                  type="submit"
                                  disabled={savingOrderDetail}
                                  className="px-6 py-2.5 bg-blue-650 hover:bg-blue-600 disabled:bg-blue-400 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-500/20"
                                >
                                  {savingOrderDetail ? "Đang cập nhật..." : "Cập nhật đơn hàng"}
                                </button>
                              </div>
                            </div>

                          </form>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* Tab 6: coupons (Marketing & Coupons Management) */}
            {activeTab === "coupons" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-colors animate-fade-in">
                <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Chiến dịch Khuyến mãi & Mã giảm giá</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Tạo các chương trình ưu đãi, xả kho chỉ áp dụng riêng cho hàng cũ (Old), hàng mới (New) hoặc phân loại theo Danh mục sản phẩm.
                    </p>
                  </div>
                  <button
                    onClick={() => openCouponModal("add")}
                    className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span>Tạo mã giảm giá mới</span>
                  </button>
                </div>

                {loadingCoupons ? (
                  <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-650" /></div>
                ) : coupons.length === 0 ? (
                  <div className="p-20 text-center text-slate-400 font-bold text-xs">Hiện tại chưa có chiến dịch khuyến mãi nào được tạo!</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-550 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-850">
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
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                        {coupons.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors text-xs text-slate-700 dark:text-slate-350">
                            <td className="px-6 py-4 font-black whitespace-nowrap">
                              <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-650 dark:text-blue-400 border border-blue-200/50 rounded-xl font-mono text-xs font-black uppercase">
                                {c.code}
                              </span>
                            </td>
                            <td className="px-6 py-4 min-w-[180px]">
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{c.description || "Không có mô tả"}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Đơn tối thiểu: <span className="font-bold text-slate-500">{formatVND(Number(c.minOrderValue))}</span>
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-black text-slate-905 dark:text-white">
                              {c.discountType === "percentage" ? `${Number(c.discountValue)}%` : `-${formatVND(Number(c.discountValue))}`}
                            </td>
                            <td className="px-6 py-4 min-w-[150px]">
                              <div className="flex flex-wrap gap-1">
                                {(!c.applicableConditions || c.applicableConditions.length === 0) && (!c.applicableCategories || c.applicableCategories.length === 0) && (
                                  <span className="text-[10px] bg-slate-105 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-lg font-bold">Mọi sản phẩm</span>
                                )}
                                {c.applicableConditions && c.applicableConditions.map(cond => (
                                  <span key={cond} className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-200/40 px-2 py-0.5 rounded-lg font-bold">
                                    Hàng {cond}
                                  </span>
                                ))}
                                {c.applicableCategories && c.applicableCategories.map(cat => (
                                  <span key={cat} className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 border border-emerald-200/40 px-2 py-0.5 rounded-lg font-bold">
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
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                                c.isActive 
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 border-emerald-200" 
                                  : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200"
                              }`}>
                                {c.isActive ? "Đang chạy" : "Tạm dừng"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => openCouponModal("edit", c)}
                                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-200 rounded-xl transition-all"
                                  title="Chỉnh sửa mã"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCoupon(c.id)}
                                  className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 rounded-xl transition-all"
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
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto transition-all scale-100 animate-scale-in"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-850">
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
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Product Name */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Tên sản phẩm *</label>
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
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Danh mục *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                  >
                    {categoriesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Giá bán (VND) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 12990000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Stock Count */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Số lượng tồn kho *</label>
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
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Nhãn hiển thị (Badge/Trạng thái)</label>
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


                {/* Multiple Images Upload Handler */}
                <div className="col-span-2 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">Danh sách ảnh sản phẩm (Ngăn cách bằng dấu phẩy) *</label>
                      <p className="text-[9px] text-slate-400 mt-0.5">Chọn nhiều ảnh cùng lúc ở nút bên để tải lên hàng loạt tự động.</p>
                    </div>
                    
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-250 text-[10px] font-black rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-200 dark:border-slate-700">
                      {uploadingImage ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-650" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 text-blue-650" />
                      )}
                      <span>{uploadingImage ? "Đang tải lên..." : "Tải lên nhiều ảnh (Local)"}</span>
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

                  <textarea
                    rows="2"
                    placeholder="Đường dẫn ảnh 1, Đường dẫn ảnh 2, Đường dẫn ảnh 3..."
                    value={formImages}
                    onChange={(e) => setFormImages(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none font-semibold"
                  />

                  {/* Thumbnail Previews with individual Delete buttons */}
                  {formImages && formImages.split(",").map(i => i.trim()).filter(Boolean).length > 0 && (
                    <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">Xem trước & Biên tập ({formImages.split(",").map(i => i.trim()).filter(Boolean).length} ảnh):</span>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {formImages.split(",").map(i => i.trim()).filter(Boolean).map((imgUrl, idx) => (
                          <div key={idx} className="relative group aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-750 flex-shrink-0">
                            <img
                              src={imgUrl}
                              alt={`Thumbnail Preview ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100&auto=format&fit=crop" }}
                            />
                            <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="p-1 bg-red-650 hover:bg-red-500 text-white rounded-lg transition-transform active:scale-90"
                                title="Xóa ảnh này"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Short description */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Mô tả ngắn gọn *</label>
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
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Thông số kỹ thuật quan trọng (Mỗi thông số đặt trên một dòng)</label>
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
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 font-bold text-xs rounded-xl transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-75"
                >
                  {submittingProduct ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{modalType === "add" ? "Thêm sản phẩm" : "Lưu thay đổi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Category */}
      {isCatModalOpen && (
        <div 
          onClick={() => setIsCatModalOpen(false)} 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl transition-all animate-scale-in"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {catModalType === "add" ? "Thêm danh mục mới" : "Chỉnh sửa tên danh mục"}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-505">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 mb-1.5">Tên danh mục mới *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Smartwatch, Camera, Console..."
                  value={formCatName}
                  onChange={(e) => setFormCatName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
                >
                  <span>{catModalType === "add" ? "Tạo danh mục" : "Lưu thay đổi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit User (Click-Outside support & Password views) */}
      {isUserModalOpen && (
        <div 
          onClick={() => setIsUserModalOpen(false)} 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto transition-all animate-scale-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-850">
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
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Họ và tên *</label>
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
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Địa chỉ Email *</label>
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
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">
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
                      className="absolute right-3 top-3 text-slate-450 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Vai trò (Role) *</label>
                  <select
                    value={formUserRole}
                    onChange={(e) => setFormUserRole(e.target.value)}
                    disabled={editingUserId === currentUser?.id}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                  >
                    <option value="user">User (Thường)</option>
                    <option value="admin">Admin (Quản trị)</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Số điện thoại</label>
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
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Địa chỉ giao hàng</label>
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
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Thành phố</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hà Nội, TP. HCM..."
                    value={formUserCity}
                    onChange={(e) => setFormUserCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Zip */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Mã bưu điện (Zip)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 100000"
                    value={formUserZip}
                    onChange={(e) => setFormUserZip(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-75"
                >
                  {submittingUser ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <Check className="h-4.5 w-4.5" />
                  )}
                  <span>{userModalType === "add" ? "Thêm thành viên" : "Lưu thay đổi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Modal Add/Edit Coupon (Premium glassmorphic modal with category & condition multi-select) */}
      {isCouponModalOpen && (
        <div 
          onClick={() => setIsCouponModalOpen(false)} 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto transition-all animate-scale-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {couponModalType === "add" ? "Tạo mã giảm giá mới" : "Chỉnh sửa mã giảm giá"}
              </h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-505"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCouponSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Coupon Code */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Mã Coupon *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: XAKHO50"
                    value={formCouponCode}
                    onChange={(e) => setFormCouponCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold uppercase font-mono"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Mô tả chương trình *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Giảm giá xả kho hàng cũ Laptop"
                    value={formCouponDesc}
                    onChange={(e) => setFormCouponDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Loại giảm giá</label>
                  <select
                    value={formCouponType}
                    onChange={(e) => setFormCouponType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">
                    Giá trị giảm * ({formCouponType === "percentage" ? "%" : "đ"})
                  </label>
                  <input
                    type="number"
                    required
                    placeholder={formCouponType === "percentage" ? "Ví dụ: 10" : "Ví dụ: 50000"}
                    value={formCouponValue}
                    onChange={(e) => setFormCouponValue(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Min Order Value */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Giá trị đơn hàng tối thiểu (đ)</label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 200000"
                    value={formCouponMinOrder}
                    onChange={(e) => setFormCouponMinOrder(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-905 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Max Uses */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Giới hạn số lần sử dụng tối đa (Bỏ trống = Vô hạn)</label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 100"
                    value={formCouponMaxUses}
                    onChange={(e) => setFormCouponMaxUses(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Ngày bắt đầu hiệu lực</label>
                  <input
                    type="date"
                    value={formCouponStartDate}
                    onChange={(e) => setFormCouponStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Ngày kết thúc hiệu lực</label>
                  <input
                    type="date"
                    value={formCouponEndDate}
                    onChange={(e) => setFormCouponEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Applicable Product Conditions (Badge check) */}
                <div className="col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Áp dụng cho Tình trạng hàng (Để trống = Tất cả)</label>
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
                              : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-750"
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
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Áp dụng cho Danh mục (Để trống = Tất cả)</label>
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
                              : "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-400 border-slate-200 dark:border-slate-750"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Status */}
                <div className="col-span-2 flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formCouponActive}
                    onChange={(e) => setFormCouponActive(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 border-slate-350 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kích hoạt mã giảm giá
                  </label>
                </div>

              </div>

              {/* Modal footer submit buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-305 font-bold text-xs rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingCoupon}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-75"
                >
                  {submittingCoupon ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <Check className="h-4.5 w-4.5" />
                  )}
                  <span>{couponModalType === "add" ? "Tạo mã" : "Lưu thay đổi"}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
