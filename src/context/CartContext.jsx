import React, { createContext, useContext, useState } from 'react';
import { toVndInt } from '../utils/money';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      
      // Determine the actual purchase price (with custom or percentage discount if applicable)
      let actualPrice = toVndInt(product.price);
      if (product.discountedPrice !== null && product.discountedPrice !== undefined) {
        actualPrice = toVndInt(product.discountedPrice);
      } else if (product.discount > 0) {
        actualPrice = Math.floor(toVndInt(product.price) * (1 - product.discount / 100));
      }
      
      return [...prev, { ...product, price: actualPrice, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
