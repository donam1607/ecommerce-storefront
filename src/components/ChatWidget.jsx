import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/money';
import { 
  MessageCircle, X, Send, Bot, Sparkles, Package, 
  ShieldCheck, Cpu, ExternalLink, ShoppingBag, 
  ChevronRight, Check, Plus, AlertCircle
} from 'lucide-react';

const API_BASE_URL = "https://shoptech-backend.onrender.com";

// ---------------------------------------------------------
// COMPONENT RENDER CARD SẢN PHẨM TƯƠNG TÁC TRONG CHAT
// ---------------------------------------------------------
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      images: [product.image],
      category: product.category,
      badge: product.badge
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  
  const getBadgeColor = (badge) => {
    if (!badge) return 'bg-emerald-600 text-white border border-emerald-400';
    const b = badge.toLowerCase().trim();
    if (b.includes('new') || b.includes('mới')) return 'bg-emerald-600 text-white border border-emerald-400';
    if (b.includes('like new') || b.includes('likenew') || b.includes('99')) return 'bg-indigo-600 text-white border border-indigo-400';
    if (b.includes('old') || b.includes('cũ')) return 'bg-slate-500 text-white border border-slate-400';
    return 'bg-blue-600 text-white border border-blue-400';
  };
  
  const imageSrc = product.image.startsWith('http') 
    ? product.image 
    : `${API_BASE_URL}${product.image}`;

  return (
    <div className="flex flex-col bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm overflow-hidden my-3 hover:shadow-md transition-all duration-300 w-full max-w-[280px]">
      {/* Product Image and Badge */}
      <div className="relative h-28 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-center p-2">
        <img 
          src={imageSrc} 
          alt={product.name} 
          className="h-full object-contain hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/200x200?text=Product';
          }}
        />
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getBadgeColor(product.badge)}`}>
          {product.badge || 'New'}
        </span>
      </div>
      
      {/* Product Details */}
      <div className="p-3 flex flex-col flex-grow">
        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight min-h-[2rem]">
          {product.name}
        </h4>
        
        <div className="mt-1 flex items-baseline justify-between gap-1 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            {product.category}
          </span>
          <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
            {formatVND(product.price)}
          </span>
        </div>
        
        {/* Actions */}
        <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 dark:border-slate-700/50">
          <button
            onClick={() => navigate(`/product/${product.id}`)}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-semibold bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all cursor-pointer"
          >
            <ExternalLink size={10} />
            Chi tiết
          </button>
          
          <button
            onClick={handleAddToCart}
            disabled={added}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-bold text-white transition-all cursor-pointer ${
              added 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/10'
            }`}
          >
            {added ? <Check size={10} /> : <ShoppingBag size={10} />}
            {added ? 'Đã thêm' : 'Mua ngay'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// CHATWIDGET COMPONENT CHÍNH
// ---------------------------------------------------------
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([
    {
      sender: 'bot',
      text: 'Dạ, ShopTech AI xin chào anh/chị ạ! 🌸\nEm là chuyên gia tư vấn công nghệ của shop. Em có thể hỗ trợ anh/chị:\n\n💻 **Tư vấn cấu hình** máy tính phù hợp ngân sách và nhu cầu.\n📦 **Kiểm tra trạng thái đơn hàng** bảo mật (Cần cung cấp Mã đơn + Số điện thoại).\n🛡️ **Tra cứu thời hạn bảo hành** qua số Serial (S/N).\n❓ **Giải đáp thắc mắc** về hàng mới (New), hàng trưng bày (Like New) hay hàng cũ (Old).\n\nAnh/chị muốn em hỗ trợ thông tin gì ạ?',
      products: []
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(false);
  
  const chatEndRef = useRef(null);
  
  // Tự động hiện bong bóng chào mừng sau 3 giây nếu chưa từng mở chat
  useEffect(() => {
    const isDismissed = sessionStorage.getItem('dismiss_ai_welcome');
    if (!isDismissed) {
      const timer = setTimeout(() => {
        if (!isOpen) {
          setShowWelcomeBubble(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Cuộn xuống đáy khi có tin nhắn mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const handleDismissBubble = (e) => {
    e.stopPropagation();
    setShowWelcomeBubble(false);
    sessionStorage.setItem('dismiss_ai_welcome', 'true');
  };

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    setShowWelcomeBubble(false);
    sessionStorage.setItem('dismiss_ai_welcome', 'true');
  };

  // Gửi tin nhắn lên Backend API
  const handleSendMessage = async (textToSend) => {
    const activeText = textToSend || message;
    if (!activeText.trim()) return;

    if (!textToSend) setMessage('');
    
    // Thêm tin nhắn của User vào history
    const newHistory = [...history, { sender: 'user', text: activeText, products: [] }];
    setHistory(newHistory);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: activeText,
          // Rút gọn history gửi lên AI để tránh quá tải token
          history: newHistory.slice(1, -1).map(h => ({
            sender: h.sender,
            text: h.text
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        setHistory(prev => [...prev, {
          sender: 'bot',
          text: data.text,
          products: data.products || []
        }]);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Lỗi kết nối máy chủ.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setHistory(prev => [...prev, {
        sender: 'bot',
        text: 'Dạ, hiện tại kết nối đến máy chủ AI của ShopTech đang bị gián đoạn. Anh/chị có thể thử lại sau giây lát hoặc nhắn trực tiếp cho hotline hỗ trợ nhé ạ! 🥺',
        products: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Các nút gợi ý nhanh
  const quickReplies = [
    { label: '💻 Tư vấn Laptop/PC', text: 'Tư vấn giúp tôi laptop cấu hình tốt tầm 15 triệu để học tập và chơi game mượt' },
    { label: '📦 Kiểm tra đơn hàng', text: 'Tôi muốn kiểm tra trạng thái đơn hàng của mình' },
    { label: '🛡️ Tra cứu bảo hành', text: 'Tra cứu bảo hành giúp tôi cho số Serial S/N: ABC1' },
    { label: '❓ Hàng Like New vs Old', text: 'Hàng Like New 99% khác gì hàng Old thế em?' }
  ];

  // Bộ phân tích chuỗi văn bản và chèn Card Sản phẩm động
  const parseMessageText = (text, products) => {
    if (!text) return null;
    
    const parts = text.split(/(\[ProductCard:\s*\d+\])/g);
    
    return parts.map((part, index) => {
      const match = part.match(/\[ProductCard:\s*(\d+)\]/);
      if (match) {
        const productId = parseInt(match[1]);
        const product = products.find(p => p.id === productId);
        
        if (product) {
          return (
            <ProductCard key={index} product={product} />
          );
        }
        return null;
      }
      
      return (
        <span key={index} className="whitespace-pre-line text-sm leading-relaxed block my-1">
          {part}
        </span>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans antialiased">
      
      {/* 1. BONG BÓNG CHÀO MỪNG (WELCOME BUBBLE) */}
      {showWelcomeBubble && (
        <div 
          onClick={handleToggleChat}
          className="absolute bottom-16 right-2 w-72 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl shadow-xl backdrop-blur-md cursor-pointer animate-bounce hover:scale-102 transition-transform select-none"
        >
          <button 
            onClick={handleDismissBubble}
            className="absolute top-1.5 right-1.5 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={12} />
          </button>
          <div className="flex gap-2.5 items-start pr-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
              <Bot size={16} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest">Trợ lý ShopTech</p>
              <p className="text-xs font-semibold leading-normal mt-0.5">👋 Cần tư vấn laptop, cấu hình, check bảo hành/đơn hàng nhấn em nhé!</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. NÚT CHAT NỔI (FLOATING BUTTON) */}
      <button
        onClick={handleToggleChat}
        className={`w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br ${
          isOpen 
            ? 'from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/25' 
            : 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20'
        } text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all duration-300 z-50 cursor-pointer`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* 3. KHUNG CHAT CHÍNH (CHAT WINDOW) */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[360px] xs:w-[380px] h-[520px] bg-white/95 dark:bg-slate-900/95 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <Bot size={20} />
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950 animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-blue-400 flex items-center gap-1">
                  ShopTech AI
                  <Sparkles size={10} className="animate-pulse" />
                </h3>
                <p className="text-[10px] text-slate-300">Chuyên gia tư vấn công nghệ 24/7</p>
              </div>
            </div>
            <button
              onClick={handleToggleChat}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Vùng Tin Nhắn */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20 scrollbar-thin scrollbar-thumb-slate-200">
            {history.map((chat, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${
                  chat.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                {chat.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <Bot size={14} />
                  </div>
                )}
                
                {/* Bubble */}
                <div className="space-y-1">
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      chat.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                        : 'bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700/40 rounded-tl-none shadow-xs'
                    }`}
                  >
                    {chat.sender === 'user' ? (
                      <span className="whitespace-pre-line block">{chat.text}</span>
                    ) : (
                      parseMessageText(chat.text, chat.products)
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 px-1 block">
                    {chat.sender === 'user' ? 'Bạn' : 'ShopTech AI'}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex gap-2.5 max-w-[80%] mr-auto">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                  <Bot size={14} />
                </div>
                <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700/40 shadow-xs flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Quick Replies (Gợi ý nhanh) */}
          {history.length <= 1 && !loading && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-2.5">
              {quickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qr.text)}
                  className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white hover:border-blue-600 transition-all duration-200 cursor-pointer shadow-xs"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex gap-2 items-center"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={loading}
              className="flex-grow px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-full text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={!message.trim() || loading}
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 flex items-center justify-center cursor-pointer shadow-sm shadow-blue-500/10 active:scale-95"
            >
              <Send size={14} />
            </button>
          </form>
          
        </div>
      )}
    </div>
  );
}
