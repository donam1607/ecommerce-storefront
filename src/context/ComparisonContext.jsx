import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from './ToastContext';

const ComparisonContext = createContext(null);

export function ComparisonProvider({ children }) {
  const [comparisonItems, setComparisonItems] = useState([]);
  const { showToast } = useToast();

  const lockedCategory = comparisonItems.length > 0 ? comparisonItems[0].category : null;

  const addToComparison = useCallback((product) => {
    // 1. Check if already compared
    const exists = comparisonItems.some((item) => item.id === product.id);
    if (exists) {
      showToast(`Đã xóa "${product.name}" khỏi danh sách so sánh.`, 'info');
      setComparisonItems((prev) => prev.filter((item) => item.id !== product.id));
      return;
    }

    // 2. Check category lock
    if (comparisonItems.length > 0 && comparisonItems[0].category !== product.category) {
      showToast(
        `Chỉ có thể so sánh sản phẩm cùng danh mục "${comparisonItems[0].category}"!`,
        'warning'
      );
      return;
    }

    // 3. Check max limit of 4
    if (comparisonItems.length >= 4) {
      showToast('Chỉ có thể so sánh tối đa 4 sản phẩm cùng lúc!', 'warning');
      return;
    }

    showToast(`Đã thêm "${product.name}" vào danh sách so sánh.`, 'success');
    setComparisonItems((prev) => [...prev, product]);
  }, [comparisonItems, showToast]);

  const removeFromComparison = useCallback((productId) => {
    const itemToRemove = comparisonItems.find((item) => item.id === productId);
    if (itemToRemove) {
      showToast(`Đã xóa "${itemToRemove.name}" khỏi danh sách so sánh.`, 'info');
      setComparisonItems((prev) => prev.filter((item) => item.id !== productId));
    }
  }, [comparisonItems, showToast]);

  const clearComparison = useCallback(() => {
    setComparisonItems([]);
    showToast('Đã xóa tất cả sản phẩm khỏi danh sách so sánh.', 'info');
  }, [showToast]);

  const isCompared = useCallback((productId) => {
    return comparisonItems.some((item) => item.id === productId);
  }, [comparisonItems]);

  return (
    <ComparisonContext.Provider
      value={{
        comparisonItems,
        lockedCategory,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isCompared,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}
