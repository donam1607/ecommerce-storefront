/**
 * HƯỚNG DẪN THÊM / SỬA / XÓA SẢN PHẨM HARDCODE (HỖ TRỢ NHIỀU ẢNH)
 * 
 * 1. THÊM SẢN PHẨM MỚI:
 *    Sao chép một đối tượng sản phẩm mẫu dưới đây, dán vào cuối danh sách (trong dấu ngoặc vuông [])
 *    và thay đổi các giá trị:
 *    - id: Phải là một số duy nhất (tăng dần, ví dụ: 9, 10, 11,...)
 *    - name: Tên hiển thị của sản phẩm (ví dụ: "Bàn phím Leopold FC900R")
 *    - category: Danh mục sản phẩm (Nên khớp với danh mục hiện có: "Laptop", "Monitor", "Keyboard", "Headphones", "Smartphone", "Accessories")
 *    - price: Giá tiền dạng số (ví dụ: 120.00 hoặc 2499)
 *    - rating: Điểm đánh giá từ 1 đến 5 (ví dụ: 4.8)
 *    - reviews: Số lượt đánh giá dạng số (ví dụ: 120)
 *    - badge: Thẻ nhãn hiển thị nổi bật ở góc sản phẩm (Có thể dùng: "Best Seller", "New", "Top Rated", "Sale", "Hot", "Gaming", hoặc null nếu không muốn hiển thị nhãn)
 *    - images: MẢNG CÁC ĐƯỜNG DẪN ẢNH (hỗ trợ nhiều ảnh). Ví dụ: ["url_anh_1", "url_anh_2", "url_anh_3"]. 
 *              Ảnh đầu tiên (chỉ mục số 0) sẽ làm ảnh đại diện trên Trang chủ và Giỏ hàng. Các ảnh tiếp theo sẽ làm slide ảnh ở trang chi tiết.
 *    - description: Mô tả ngắn gọn sản phẩm hiển thị trên lưới sản phẩm.
 *    - specs: Mảng các chuỗi chứa thông số kỹ thuật hiển thị chi tiết ở trang chi tiết sản phẩm.
 * 
 * 2. CHỈNH SỬA SẢN PHẨM:
 *    Tìm sản phẩm bạn muốn sửa bằng tên hoặc ID và thay đổi trực tiếp các giá trị mong muốn.
 * 
 * 3. XÓA SẢN PHẨM:
 *    Xóa toàn bộ khối đối tượng { ... } của sản phẩm đó khỏi mảng.
 */

export const PRODUCTS = [
  {
    id: 1,
    name: "MacBook Pro M3 16\"",
    category: "Laptop",
    price: 2499.00,
    rating: 4.9,
    reviews: 342,
    badge: "Best Seller",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=60"
    ],
    description: "Apple M3 chip, 18GB RAM, 512GB SSD",
    specs: [
      "Apple M3 Pro chip",
      "18GB Unified Memory",
      "512GB SSD",
      "16.2\" Liquid Retina XDR",
      "22-hour battery life",
      "Wi-Fi 6E, Bluetooth 5.3"
    ]
  },
  {
    id: 2,
    name: "Dell XPS 15 OLED",
    category: "Laptop",
    price: 1899.00,
    rating: 4.8,
    reviews: 215,
    badge: "New",
    images: [
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=60"
    ],
    description: "Intel i9, 32GB RAM, 1TB SSD, OLED 4K",
    specs: [
      "Intel Core i9-13900H",
      "32GB DDR5 RAM",
      "1TB NVMe SSD",
      "15.6\" 4K OLED 60Hz",
      "86Wh battery",
      "Thunderbolt 4 x2"
    ]
  },
  {
    id: 3,
    name: "Sony WH-1000XM5",
    category: "Headphones",
    price: 349.99,
    rating: 4.9,
    reviews: 1024,
    badge: "Top Rated",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=60"
    ],
    description: "Industry-leading noise cancellation",
    specs: [
      "30h battery life",
      "8 microphones ANC",
      "Multipoint connection",
      "LDAC Hi-Res Audio",
      "Quick Charge (3 min = 3h)",
      "Foldable design"
    ]
  },
  {
    id: 4,
    name: "Samsung 4K Monitor 32\"",
    category: "Monitor",
    price: 699.00,
    rating: 4.7,
    reviews: 189,
    badge: "Sale",
    images: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1551645121-d1034da75057?w=800&auto=format&fit=crop&q=60"
    ],
    description: "4K UHD, 144Hz, 1ms response time",
    specs: [
      "3840x2160 4K UHD",
      "144Hz refresh rate",
      "1ms response time (GTG)",
      "HDR600 certified",
      "USB-C 90W Power Delivery",
      "AMD FreeSync Premium"
    ]
  },
  {
    id: 5,
    name: "Mechanical Keyboard Pro",
    category: "Keyboard",
    price: 149.00,
    rating: 4.6,
    reviews: 567,
    badge: null,
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=60"
    ],
    description: "RGB backlit, Cherry MX switches",
    specs: [
      "Cherry MX Red switches",
      "Per-key RGB lighting",
      "Aluminium frame",
      "N-Key rollover",
      "USB-C detachable cable",
      "PBT double-shot keycaps"
    ]
  },
  {
    id: 6,
    name: "iPhone 15 Pro Max",
    category: "Smartphone",
    price: 1199.00,
    rating: 4.8,
    reviews: 2103,
    badge: "Hot",
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1565849906660-446927965954?w=800&auto=format&fit=crop&q=60"
    ],
    description: "A17 Pro chip, Titanium design, 48MP",
    specs: [
      "Apple A17 Pro chip",
      "6.7\" Super Retina XDR",
      "48MP main camera",
      "Titanium design",
      "USB-C with USB 3",
      "Action Button"
    ]
  },
  {
    id: 7,
    name: "ASUS ROG Gaming Laptop",
    category: "Laptop",
    price: 1599.00,
    rating: 4.7,
    reviews: 432,
    badge: "Gaming",
    images: [
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&auto=format&fit=crop&q=60"
    ],
    description: "RTX 4070, i9, 32GB RAM, 165Hz",
    specs: [
      "Intel Core i9-13980HX",
      "NVIDIA RTX 4070 8GB",
      "32GB DDR5 4800MHz",
      "15.6\" FHD 165Hz",
      "1TB PCIe 4.0 SSD",
      "ROG Intelligent Cooling"
    ]
  },
  {
    id: 8,
    name: "Anker PowerBank 26800",
    category: "Accessories",
    price: 59.99,
    rating: 4.5,
    reviews: 3210,
    badge: null,
    images: [
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1622445262465-2481c4574875?w=800&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1609091226690-a43a0885e33d?w=800&auto=format&fit=crop&q=60"
    ],
    description: "26800mAh, 65W fast charging, PD",
    specs: [
      "26800mAh capacity",
      "65W USB-C PD output",
      "3 output ports",
      "2 input ports",
      "Charges 3 devices at once",
      "LED battery indicator"
    ]
  }
];
