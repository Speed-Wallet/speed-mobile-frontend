import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';

interface TabBarVisibilityContextType {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  hideTabBar: () => void;
  showTabBar: () => void;
}

const TabBarVisibilityContext = createContext<
  TabBarVisibilityContextType | undefined
>(undefined);

export function TabBarVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(true);

  const hideTabBar = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showTabBar = useCallback(() => {
    setIsVisible(true);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      isVisible,
      setIsVisible,
      hideTabBar,
      showTabBar,
    }),
    [isVisible, hideTabBar, showTabBar],
  );

  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility() {
  const context = useContext(TabBarVisibilityContext);
  if (context === undefined) {
    throw new Error(
      'useTabBarVisibility must be used within a TabBarVisibilityProvider',
    );
  }
  return context;
}
