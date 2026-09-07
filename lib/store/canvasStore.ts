import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Node, Edge } from '@xyflow/react';
import { getLayoutedElements } from '@/lib/spatialLayout';

export interface CanvasSessionState {
  sessionId: string;
  prompt: string;
  widgets: any[];
  nodes: Node[];
  edges: Edge[];
  direction: 'TB' | 'LR';
  isSaving: boolean;
  lastSaved: string | null;

  // Actions
  setSessionId: (id: string) => void;
  setPrompt: (prompt: string) => void;
  setWidgets: (widgets: any[]) => void;
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  updateWidgetData: (id: string, partialData: Record<string, any>) => void;
  applyLayout: (direction?: 'TB' | 'LR') => void;
  saveSession: () => Promise<boolean>;
}

// Debounce helper for external cloud persistence
let autosaveTimeout: NodeJS.Timeout | null = null;

export const useCanvasStore = create<CanvasSessionState>()(
  persist(
    (set, get) => ({
      sessionId: 'sess_initial',
      prompt: '',
      widgets: [],
      nodes: [],
      edges: [],
      direction: 'TB',
      isSaving: false,
      lastSaved: null,

      setSessionId: (sessionId) => set({ sessionId }),
      setPrompt: (prompt) => set({ prompt }),

      setWidgets: (widgets) => {
        set({ widgets });
        get().saveSession();
      },

      setNodes: (nodesOrUpdater) => {
        set((state) => ({
          nodes: typeof nodesOrUpdater === 'function' ? nodesOrUpdater(state.nodes) : nodesOrUpdater,
        }));
      },

      setEdges: (edgesOrUpdater) => {
        set((state) => ({
          edges: typeof edgesOrUpdater === 'function' ? edgesOrUpdater(state.edges) : edgesOrUpdater,
        }));
      },

      updateWidgetData: (id, partialData) => {
        set((state) => {
          // 1. Update in widgets array
          const updatedWidgets = state.widgets.map((w, index) => {
            const widgetId = w.id || ('widget-' + index);
            if (widgetId === id || String(index) === id) {
              return { ...w, data: { ...(w.data || w), ...partialData } };
            }
            return w;
          });

          // 2. Update in React Flow nodes
          const updatedNodes = state.nodes.map((node) => {
            if (node.id === id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  ...partialData,
                },
              };
            }
            return node;
          });

          return { widgets: updatedWidgets, nodes: updatedNodes };
        });

        // Trigger debounced autosave
        get().saveSession();
      },

      applyLayout: (direction) => {
        const currentDirection = direction || get().direction;
        const { nodes, edges } = getLayoutedElements(get().nodes, get().edges, currentDirection);
        set({ nodes: [...nodes], edges: [...edges], direction: currentDirection });
      },

      saveSession: async () => {
        const state = get();
        if (!state.prompt && state.widgets.length === 0) return false;

        // Local state update
        set({ isSaving: true });

        return new Promise<boolean>((resolve) => {
          if (autosaveTimeout) clearTimeout(autosaveTimeout);

          autosaveTimeout = setTimeout(async () => {
            try {
              const res = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: state.prompt || 'Untitled Canvas Session',
                  widgets: state.widgets,
                }),
              });

              if (res.ok) {
                set({ isSaving: false, lastSaved: new Date().toISOString() });
                resolve(true);
              } else {
                set({ isSaving: false });
                resolve(false);
              }
            } catch (err) {
              console.warn('[CanvasStore] Cloud autosave failed, cached in localStorage:', err);
              set({ isSaving: false });
              resolve(false);
            }
          }, 800); // 800ms debounce
        });
      },
    }),
    {
      name: 'morphui-canvas-session',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : (null as any))),
      partialize: (state) => ({
        sessionId: state.sessionId,
        prompt: state.prompt,
        widgets: state.widgets,
        direction: state.direction,
      }),
    }
  )
);
