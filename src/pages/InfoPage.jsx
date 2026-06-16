import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";

const pageContent = {
  warranty: {
    icon: ShieldCheck,
    title: "Chính sách bảo hành",
    subtitle: "Thông tin bảo hành dành cho sản phẩm mua tại ShopTech.",
    intro: "ShopTech cam kết hỗ trợ bảo hành minh bạch, nhanh gọn và đúng tình trạng sản phẩm khi khách hàng mua hàng tại cửa hàng.",
    sections: [
      {
        title: "Thời gian bảo hành",
        items: [
          "Laptop, màn hình, linh kiện mới: theo thời hạn của hãng hoặc chính sách ghi trên hóa đơn.",
          "Sản phẩm Like New/Old: áp dụng theo thời hạn bảo hành riêng được ghi rõ khi mua hàng.",
          "Phụ kiện đi kèm có thể có thời hạn bảo hành khác nhau tùy từng sản phẩm.",
        ],
      },
      {
        title: "Điều kiện bảo hành",
        items: [
          "Sản phẩm còn tem bảo hành, số serial và thông tin hóa đơn hợp lệ.",
          "Lỗi phát sinh từ phần cứng hoặc nhà sản xuất trong quá trình sử dụng bình thường.",
          "Không áp dụng cho lỗi do rơi vỡ, vào nước, cháy nổ, tự ý tháo sửa hoặc can thiệp phần cứng.",
        ],
      },
      {
        title: "Quy trình tiếp nhận",
        items: [
          "Khách hàng liên hệ ShopTech, cung cấp mã đơn hàng hoặc số điện thoại mua hàng.",
          "Kỹ thuật viên kiểm tra tình trạng, ghi nhận lỗi và thời gian xử lý dự kiến.",
          "ShopTech thông báo kết quả kiểm tra trước khi tiến hành sửa chữa, đổi trả hoặc gửi hãng.",
        ],
      },
    ],
  },
  buyingGuide: {
    icon: ShoppingBag,
    title: "Hướng dẫn mua hàng",
    subtitle: "Các bước đặt hàng và thanh toán trên website ShopTech.",
    intro: "Bạn có thể mua hàng trực tiếp trên website, thêm sản phẩm vào giỏ và theo dõi đơn hàng sau khi đặt.",
    sections: [
      {
        title: "Bước 1: Chọn sản phẩm",
        items: [
          "Tìm sản phẩm theo danh mục, hãng, phân loại, tình trạng hoặc khoảng giá.",
          "Xem chi tiết cấu hình, giá sau giảm, tình trạng hàng và hình ảnh sản phẩm.",
          "Có thể hỏi chatbox AI để được gợi ý sản phẩm phù hợp ngân sách.",
        ],
      },
      {
        title: "Bước 2: Thêm vào giỏ hàng",
        items: [
          "Bấm thêm vào giỏ hàng hoặc mua ngay từ thẻ sản phẩm.",
          "Kiểm tra số lượng, giá bán, mã giảm giá và tổng thanh toán.",
          "Điền chính xác thông tin nhận hàng và số điện thoại để shop xác nhận.",
        ],
      },
      {
        title: "Bước 3: Xác nhận và nhận hàng",
        items: [
          "Sau khi đặt hàng, admin sẽ kiểm tra và duyệt đơn.",
          "Khách hàng có thể tra cứu trạng thái đơn hàng bằng mã đơn và số điện thoại.",
          "Khi nhận hàng, vui lòng kiểm tra sản phẩm, phụ kiện, serial và tem bảo hành.",
        ],
      },
    ],
  },
  returns: {
    icon: RefreshCw,
    title: "Chính sách đổi trả",
    subtitle: "Quy định đổi trả nhằm bảo vệ quyền lợi khách hàng.",
    intro: "ShopTech hỗ trợ đổi trả theo tình trạng sản phẩm, thời gian mua hàng và lỗi được xác nhận sau kiểm tra kỹ thuật.",
    sections: [
      {
        title: "Điều kiện đổi trả",
        items: [
          "Sản phẩm còn nguyên tem, serial, phụ kiện và hóa đơn mua hàng.",
          "Lỗi kỹ thuật được ShopTech hoặc trung tâm bảo hành xác nhận.",
          "Sản phẩm không bị rơi vỡ, vào nước, cháy nổ hoặc tự ý tháo sửa.",
        ],
      },
      {
        title: "Thời gian hỗ trợ",
        items: [
          "Đổi trả nhanh trong thời gian cam kết ghi trên hóa đơn hoặc chương trình bán hàng.",
          "Sau thời gian đổi trả, sản phẩm sẽ được xử lý theo chính sách bảo hành.",
          "Với hàng Like New/Old, điều kiện ngoại hình được đối chiếu theo mô tả khi bán.",
        ],
      },
      {
        title: "Hình thức xử lý",
        items: [
          "Đổi sản phẩm tương đương nếu còn hàng.",
          "Hỗ trợ sửa chữa/bảo hành nếu lỗi thuộc phạm vi bảo hành.",
          "Hoàn tiền hoặc bù chênh lệch theo từng trường hợp cụ thể.",
        ],
      },
    ],
  },
  faq: {
    icon: HelpCircle,
    title: "Câu hỏi thường gặp",
    subtitle: "Giải đáp nhanh các câu hỏi phổ biến khi mua hàng tại ShopTech.",
    intro: "Nếu chưa tìm thấy câu trả lời phù hợp, bạn có thể liên hệ ShopTech qua chatbox AI, Zalo hoặc Messenger.",
    sections: [
      {
        title: "ShopTech có bán hàng Like New và Old không?",
        items: [
          "Có. Sản phẩm Like New/Old sẽ được ghi rõ tình trạng trên thẻ sản phẩm.",
          "ShopTech kiểm tra ngoại hình, cấu hình, pin, màn hình và linh kiện trước khi bán.",
        ],
      },
      {
        title: "Tôi có thể dùng mã giảm giá ở đâu?",
        items: [
          "Bạn nhập mã giảm giá tại trang thanh toán.",
          "Hệ thống sẽ tự kiểm tra điều kiện áp dụng, thời hạn và lượt sử dụng còn lại.",
        ],
      },
      {
        title: "Làm sao tra cứu đơn hàng?",
        items: [
          "Bạn có thể vào trang đơn hàng nếu đã đăng nhập.",
          "Hoặc hỏi chatbox AI bằng mã đơn hàng và số điện thoại đặt hàng để được tra cứu bảo mật.",
        ],
      },
      {
        title: "Giá hiển thị là giá nào?",
        items: [
          "Nếu sản phẩm có giảm giá, website ưu tiên hiển thị giá sau giảm.",
          "Nếu không có giảm giá, chỉ hiển thị giá bán hiện tại.",
        ],
      },
    ],
  },
  about: {
    icon: Store,
    title: "Thông tin cửa hàng",
    subtitle: "Giới thiệu về ShopTech và cam kết phục vụ khách hàng.",
    intro: "ShopTech là cửa hàng thiết bị công nghệ tập trung vào laptop, màn hình, bàn phím, phụ kiện và các sản phẩm công nghệ phục vụ học tập, làm việc, gaming và sáng tạo.",
    sections: [
      {
        title: "ShopTech cung cấp gì?",
        items: [
          "Laptop mới, Like New, Old với tình trạng được mô tả rõ ràng.",
          "Màn hình, bàn phím, tai nghe, smartphone và phụ kiện công nghệ.",
          "Tư vấn chọn sản phẩm theo ngân sách, nhu cầu và cấu hình thực tế.",
        ],
      },
      {
        title: "Cam kết của cửa hàng",
        items: [
          "Thông tin sản phẩm minh bạch, giá bán rõ ràng.",
          "Hỗ trợ bảo hành, đổi trả và chăm sóc sau bán hàng.",
          "Đội ngũ tư vấn luôn ưu tiên sản phẩm phù hợp thay vì bán bằng mọi giá.",
        ],
      },
      {
        title: "Liên hệ",
        items: [
          "Email: support@shoptech.vn",
          "Hotline: 1800 6789",
          "Khu vực phục vụ chính: Hà Nội và TP. Hồ Chí Minh.",
        ],
      },
    ],
  },
};

function InfoPage({ type }) {
  const page = pageContent[type] || pageContent.about;
  const Icon = page.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-transparent text-slate-900 dark:text-slate-100">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all mb-8 text-sm font-semibold hover:gap-3 group animate-fade-in-up"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Về trang chủ
        </Link>

        <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: "70ms" }}>
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-4 animate-float-slow">
              <Icon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight animate-fade-in-up" style={{ animationDelay: "130ms" }}>{page.title}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400 animate-fade-in-up" style={{ animationDelay: "190ms" }}>{page.subtitle}</p>
            <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300 max-w-3xl animate-fade-in-up" style={{ animationDelay: "250ms" }}>{page.intro}</p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {page.sections.map((section, sectionIndex) => (
              <div
                key={section.title}
                className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-5 hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${320 + sectionIndex * 90}ms` }}
              >
                <h2 className="text-sm font-black text-slate-900 dark:text-white mb-4">{section.title}</h2>
                <div className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={item}
                      className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300 animate-fade-in-up"
                      style={{ animationDelay: `${390 + sectionIndex * 90 + itemIndex * 35}ms` }}
                    >
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 mt-0.5 transition-transform duration-300 hover:scale-125" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-slate-900 dark:bg-slate-900 border border-slate-800 p-6 sm:p-7 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${460 + page.sections.length * 90}ms` }}>
          <div>
            <p className="text-sm font-black">Cần tư vấn thêm?</p>
            <p className="text-xs text-slate-400 mt-1">Chatbox AI, Zalo và Messenger luôn nằm ở góc phải màn hình để hỗ trợ bạn.</p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-black text-blue-300">
            <Truck className="h-4 w-4" />
            Hỗ trợ mua hàng và hậu mãi
          </div>
        </div>
      </section>
    </div>
  );
}

export default InfoPage;
