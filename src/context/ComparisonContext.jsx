import React, { createContext, useCallback, useContext, useState } from 'react';

const ComparisonContext = createContext(null);

export function ComparisonProvider({ children }) {
  const [comparisonItems, setComparisonItems] = useState([]);

  const lockedCategory = comparisonItems.length > 0 ? comparisonItems[0].category : null;

  const addToComparison = useCallback((product) => {
    const exists = comparisonItems.some((item) => item.id === product.id);
    if (exists) {
      setComparisonItems((prev) => prev.filter((item) => item.id !== product.id));
      return;
    }

    if (comparisonItems.length > 0 && comparisonItems[0].category !== product.category) {
      return;
    }

    if (comparisonItems.length >= 4) {
      return;
    }

    setComparisonItems((prev) => [...prev, product]);
  }, [comparisonItems]);

  const removeFromComparison = useCallback((productId) => {
    setComparisonItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonItems([]);
  }, []);

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
