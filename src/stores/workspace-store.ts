import { create } from "zustand";

type WorkspaceState = {
  isAiPanelOpen: boolean;
  isCommandPaletteOpen: boolean;
  setAiPanelOpen: (isOpen: boolean) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  isAiPanelOpen: true,
  isCommandPaletteOpen: false,
  setAiPanelOpen: (isAiPanelOpen) => set({ isAiPanelOpen }),
  setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
}));
