import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { ComparisonProvider } from './context/ComparisonContext';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import InfoPage from './pages/InfoPage';
import ChatWidget from './components/ChatWidget';
import CosmicBackground from './components/CosmicBackground';
import ComparisonBar from './components/ComparisonBar';
import ComparisonModal from './components/ComparisonModal';
import NebulaTrail from './components/NebulaTrail';
import { useVisitorTrack } from './hooks/useVisitorTrack';

function AnalyticsTracker() {
  useVisitorTrack();
  return null;
}

function App() {
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  return (
    <CartProvider>
      <ToastProvider>
        <ComparisonProvider>
          <Router>
            <ScrollToTop />
            <AnalyticsTracker />
            {/* Global cosmic starfield — fixed behind all pages, only visible in dark mode */}
            <CosmicBackground />
            {/* Nebula particle trail follows the mouse cursor on desktop */}
            <NebulaTrail />
            <div className="flex flex-col min-h-screen relative z-10 bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-100 transition-colors duration-300">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/warranty-policy" element={<InfoPage type="warranty" />} />
                  <Route path="/buying-guide" element={<InfoPage type="buyingGuide" />} />
                  <Route path="/return-policy" element={<InfoPage type="returns" />} />
                  <Route path="/faq" element={<InfoPage type="faq" />} />
                  <Route path="/about" element={<InfoPage type="about" />} />
                </Routes>
              </main>
              <Footer />
              <ChatWidget />
              
              {/* Product Comparison Bar & Modal */}
              <ComparisonBar onOpenCompareModal={() => setIsCompareOpen(true)} />
              <ComparisonModal isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} />
            </div>
          </Router>
        </ComparisonProvider>
      </ToastProvider>
    </CartProvider>
  );
}

export default App;

