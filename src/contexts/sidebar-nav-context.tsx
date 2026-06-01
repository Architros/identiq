"use client";

import { createContext, useContext } from "react";

type SidebarNavContextValue = {
  closeMobileNav: () => void;
};

const SidebarNavContext = createContext<SidebarNavContextValue>({
  closeMobileNav: () => {},
});

export function SidebarNavProvider({
  closeMobileNav,
  children,
}: {
  closeMobileNav: () => void;
  children: React.ReactNode;
}) {
  return (
    <SidebarNavContext.Provider value={{ closeMobileNav }}>
      {children}
    </SidebarNavContext.Provider>
  );
}

export function useSidebarNav() {
  return useContext(SidebarNavContext);
}
