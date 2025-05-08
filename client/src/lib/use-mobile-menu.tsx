import { create } from "zustand";

interface MobileMenuState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const useMobileMenu = create<MobileMenuState>((set) => ({
  activeTab: "home",
  setActiveTab: (tab: string) => set({ activeTab: tab }),
}));

export default useMobileMenu;
