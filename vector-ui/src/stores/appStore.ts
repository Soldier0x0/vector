import { create } from 'zustand';
import type { PipelineGraph, PipelineStatus, ValidationError } from '../types/pipeline';

interface AppState {
  sidebarCollapsed: boolean;
  pipelineName: string;
  pipelineStatus: PipelineStatus;
  validationErrors: ValidationError[];
  selectedNodeId: string | null;
  isValidating: boolean;
  isSaving: boolean;
  isReloading: boolean;
  isLoadingPipeline: boolean;
  commandPaletteOpen: boolean;
  pipelineActions: {
    validate?: () => void;
    save?: () => void;
    reload?: () => void;
  };

  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setPipelineMeta: (name: string, status: PipelineStatus) => void;
  setValidationErrors: (errors: ValidationError[]) => void;
  clearValidationErrors: () => void;
  setSelectedNodeId: (id: string | null) => void;
  setIsValidating: (v: boolean) => void;
  setIsSaving: (v: boolean) => void;
  setIsReloading: (v: boolean) => void;
  setIsLoadingPipeline: (v: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setPipelineActions: (actions: AppState['pipelineActions']) => void;
  updateFromPipeline: (graph: PipelineGraph) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  pipelineName: 'default',
  pipelineStatus: 'unknown',
  validationErrors: [],
  selectedNodeId: null,
  isValidating: false,
  isSaving: false,
  isReloading: false,
  isLoadingPipeline: true,
  commandPaletteOpen: false,
  pipelineActions: {},

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setPipelineMeta: (name, status) => set({ pipelineName: name, pipelineStatus: status }),
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  clearValidationErrors: () => set({ validationErrors: [] }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setIsValidating: (v) => set({ isValidating: v }),
  setIsSaving: (v) => set({ isSaving: v }),
  setIsReloading: (v) => set({ isReloading: v }),
  setIsLoadingPipeline: (v) => set({ isLoadingPipeline: v }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setPipelineActions: (actions) => set({ pipelineActions: actions }),
  updateFromPipeline: (graph) =>
    set({
      pipelineName: graph.name,
      pipelineStatus: graph.status,
    }),
}));
