import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/money';
import { 
  MessageCircle, X, Send, Bot, Sparkles,
  ExternalLink, ShoppingBag, 
  Check, Star, Tag
} from 'lucide-react';

const API_BASE_URL = "https://shoptech-backend.onrender.com";

// ---------------------------------------------------------
// MARKDOWN RENDERER ĐƠN GIẢN (BỘ PHÂN TÍCH MARKDOWN NỘI BỘ)
// ---------------------------------------------------------
function renderMarkdown(text) {
  if (!text) return null;

  // Tách các đoạn bởi dòng trống
  const blocks = text.split(/\n{2,}/);

  return blocks.map((block, bi) => {
    const lines = block.split('\n');

    // Kiểm tra nếu block là danh sách gạch đầu dòng
    const isList = lines.every(l => /^[\-\*] /.test(l.trim()) || l.trim() === '');
    const isNumberedList = lines.every(l => /^\d+\. /.test(l.trim()) || l.trim() === '');

    if (isList) {
      return (
        <ul key={bi} className="list-none space-y-1 my-1.5">
          {lines.filter(l => l.trim()).map((l, li) => (
            <li key={li} className="flex gap-2 items-start">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              <span>{inlineMarkdown(l.replace(/^[\-\*] /, ''))}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (isNumberedList) {
      return (
        <ol key={bi} className="list-none space-y-1 my-1.5">
          {lines.filter(l => l.trim()).map((l, li) => {
            const match = l.match(/^(\d+)\. (.*)/);
            if (!match) return null;
            return (
              <li key={li} className="flex gap-2 items-start">
                <span className="font-bold text-blue-500 flex-shrink-0 min-w-[1.1rem]">{match[1]}.</span>
                <span>{inlineMarkdown(match[2])}</span>
              </li>
            );
          })}
        </ol>
      );
    }

    // Render từng dòng thường
    return (
      <p key={bi} className="my-1 leading-relaxed">
        {inlineMarkdown(block)}
      </p>
    );
  });
}

// Xử lý inline markdown: **bold**, *italic*, `code`
function inlineMarkdown(text) {
  if (!text) return null;
  const parts = [];
  // regex: **bold** | *italic* | `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) parts.push(<strong key={match.index} className="font-bold">{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={match.index} className="italic">{match[3]}</em>);
    else if (match[4]) parts.push(<code key={match.index} className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-[11px] font-mono">{match[4]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

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
    setTimeout(() => setAdded(false), 1800);
  };
  
  const getBadgeColor = (badge) => {
    if (!badge) return 'bg-emerald-600 text-white border border-emerald-400';
    const b = badge.toLowerCase().trim();
    if (b.includes('new') || b.includes('mới')) return 'bg-emerald-600 text-white border border-emerald-400';
    if (b.includes('like new') || b.includes('likenew') || b.includes('99')) return 'bg-indigo-600 text-white border border-indigo-400';
    if (b.includes('old') || b.includes('cũ')) return 'bg-slate-500 text-white border border-slate-400';
    return 'bg-blue-600 text-white border border-blue-400';
  };
  
  const imageSrc = product.image && product.image.startsWith('http') 
    ? product.image 
    : `${API_BASE_URL}${product.image}`;

  const hasDiscount = product.discountPercent && product.discountPercent > 0;
  const hasLowerPrice = product.originalPrice && product.price < product.originalPrice;

  return (
    <div className="flex flex-col bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm overflow-hidden my-3 hover:shadow-lg transition-all duration-300 w-full max-w-[260px]">
      {/* Product Image and Badge */}
      <div className="relative h-32 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-center p-2">
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
        {hasDiscount && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Tag size={8} />
            -{product.discountPercent}%
          </span>
        )}
      </div>
      
      {/* Product Details */}
      <div className="p-3 flex flex-col flex-grow">
        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight min-h-[2rem]">
          {product.name}
        </h4>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={8} className={i < Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />
            ))}
            <span className="text-[9px] text-slate-400 ml-0.5">{product.rating.toFixed(1)}</span>
          </div>
        )}
        
        <div className="mt-1.5 flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            {product.category}
          </span>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
              {formatVND(product.price)}
            </span>
            {hasLowerPrice && (
              <span className="text-[10px] text-slate-400 line-through">
                {formatVND(product.originalPrice)}
              </span>
            )}
          </div>
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
            {added ? 'Đã thêm!' : 'Mua ngay'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// BỘ PHÂN TÍCH TIN NHẮN: TEXT + PRODUCT CARDS
// ---------------------------------------------------------
const parseMessageContent = (text, products) => {
  if (!text) return null;
  
  const segments = text.split(/(\[ProductCard:\s*\d+\])/g);
  
  return (
    <div className="space-y-1">
      {segments.map((seg, idx) => {
        const match = seg.match(/\[ProductCard:\s*(\d+)\]/);
        if (match) {
          const productId = parseInt(match[1]);
          const product = products && products.find(p => p.id === productId);
          return product ? <ProductCard key={idx} product={product} /> : null;
        }
        // Render markdown cho text thường
        if (seg.trim()) {
          return (
            <div key={idx} className="text-[12.5px] leading-relaxed">
              {renderMarkdown(seg)}
            </div>
          );
        }
        return null;
      })}
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
      text: 'Dạ, **ShopTech AI** xin chào anh/chị ạ! 🌸\n\nEm là chuyên gia tư vấn công nghệ của shop. Em có thể hỗ trợ anh/chị:\n\n- 💻 **Tư vấn cấu hình** máy tính phù hợp ngân sách và nhu cầu\n- 📦 **Kiểm tra trạng thái đơn hàng** bảo mật (Cần cung cấp Mã đơn + Số điện thoại)\n- 🛡️ **Tra cứu thời hạn bảo hành** qua số Serial (S/N)\n- ❓ **Giải đáp thắc mắc** về hàng **New**, **Like New** hay **Old**\n- 🔧 **Tư vấn nâng cấp & kỹ thuật** phần cứng chuyên sâu\n\nAnh/chị muốn em hỗ trợ gì ạ?',
      products: []
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(false);
  
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Tự động hiện bong bóng chào mừng sau 3 giây
  useEffect(() => {
    const isDismissed = sessionStorage.getItem('dismiss_ai_welcome');
    if (!isDismissed) {
      const timer = setTimeout(() => {
        if (!isOpen) setShowWelcomeBubble(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Cuộn xuống đáy khi có tin nhắn mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  // Focus input khi mở chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

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
    const activeText = (textToSend || message).trim();
    if (!activeText) return;

    if (!textToSend) setMessage('');
    
    const newHistory = [...history, { sender: 'user', text: activeText, products: [] }];
    setHistory(newHistory);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: activeText,
          // Gửi tối đa 10 tin nhắn gần nhất để giữ ngữ cảnh
          history: newHistory.slice(1, -1).slice(-10).map(h => ({
            sender: h.sender,
            text: h.text
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        setHistory(prev => [...prev, {
          sender: 'bot',
          text: data.text || 'Dạ, em chưa hiểu rõ câu hỏi của anh/chị. Anh/chị có thể hỏi lại rõ hơn không ạ?',
          products: data.products || []
        }]);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setHistory(prev => [...prev, {
        sender: 'bot',
        text: 'Dạ, hiện tại kết nối đến máy chủ AI của ShopTech đang bị gián đoạn. Anh/chị có thể thử lại sau giây lát hoặc nhắn trực tiếp cho hotline hỗ trợ nhé ạ! 🥺',
        products: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Các nút gợi ý nhanh
  const quickReplies = [
    { label: '💻 Laptop Gaming', text: 'Tư vấn giúp tôi laptop gaming cấu hình tốt tầm 15 triệu' },
    { label: '📦 Tra đơn hàng', text: 'Tôi muốn kiểm tra trạng thái đơn hàng của mình' },
    { label: '🛡️ Tra bảo hành', text: 'Tra cứu bảo hành cho số Serial S/N: ABC1' },
    { label: '❓ Like New vs Old', text: 'Hàng Like New 99% khác gì hàng Old thế em?' },
    { label: '🔧 Tư vấn nâng cấp RAM', text: 'Muốn nâng cấp RAM laptop lên 16GB, em tư vấn giúp tôi với' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans antialiased">
      
      {/* 1. BONG BÓNG CHÀO MỪNG */}
      {showWelcomeBubble && (
        <div 
          onClick={handleToggleChat}
          className="absolute bottom-[72px] right-2 w-72 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl shadow-xl backdrop-blur-md cursor-pointer animate-bounce hover:scale-102 transition-transform select-none"
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
              <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest">Trợ lý ShopTech AI</p>
              <p className="text-xs font-semibold leading-normal mt-0.5">👋 Tư vấn laptop, check bảo hành/đơn hàng, hỏi kỹ thuật? Nhấn em nhé!</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. NÚT CHAT NỔI */}
      <button
        onClick={handleToggleChat}
        className={`w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br ${
          isOpen 
            ? 'from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700' 
            : 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
        } text-white shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all duration-300 z-50 cursor-pointer`}
        aria-label={isOpen ? 'Đóng chat' : 'Mở chat'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* 3. KHUNG CHAT CHÍNH */}
      {isOpen && (
        <div
          className="absolute bottom-[72px] right-0 w-[420px] h-[580px] bg-white/97 dark:bg-slate-900/97 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden"
          style={{ animation: 'chatFadeIn 0.25s ease-out' }}
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shadow-md flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <Bot size={20} />
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                  ShopTech AI
                  <Sparkles size={10} className="animate-pulse text-blue-300" />
                </h3>
                <p className="text-[10px] text-slate-400">Chuyên gia tư vấn công nghệ 24/7</p>
              </div>
            </div>
            <button
              onClick={handleToggleChat}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>

          {/* Vùng Tin Nhắn */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/40 dark:bg-slate-950/30 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
            {history.map((chat, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${
                  chat.sender === 'user' ? 'ml-auto flex-row-reverse max-w-[80%]' : 'mr-auto max-w-[92%]'
                }`}
              >
                {/* Avatar */}
                {chat.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot size={14} />
                  </div>
                )}
                
                {/* Bubble */}
                <div className="space-y-1 min-w-0">
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      chat.sender === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700/50 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {chat.sender === 'user' ? (
                      <span className="whitespace-pre-line block text-[13px]">{chat.text}</span>
                    ) : (
                      parseMessageContent(chat.text, chat.products)
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
                <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 shadow-sm">
                  <Bot size={14} />
                </div>
                <div className="px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '160ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '320ms' }} />
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Quick Replies */}
          {history.length <= 1 && !loading && (
            <div className="px-4 py-2.5 bg-white/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none flex-shrink-0">
              {quickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qr.text)}
                  className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white hover:border-blue-600 transition-all duration-200 cursor-pointer shadow-xs flex-shrink-0"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 items-end flex-shrink-0"
          >
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi... (Enter để gửi, Shift+Enter xuống dòng)"
              disabled={loading}
              rows={1}
              className="flex-grow px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-[12.5px] bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-70 resize-none overflow-hidden leading-relaxed"
              style={{ maxHeight: '100px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={!message.trim() || loading}
              className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 flex items-center justify-center cursor-pointer shadow-sm shadow-blue-500/20 active:scale-95 flex-shrink-0"
              aria-label="Gửi"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
