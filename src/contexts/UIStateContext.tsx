
import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Types
export interface UIState {
  expandedBlocks: {
    block1: boolean;
    block2: boolean;
    block3: boolean;
    block4: boolean;
  };
  previewMode: boolean;
  progress: {
    current: number;
    total: number;
    message: string;
  };
}

type UIStateAction =
  | { type: 'TOGGLE_BLOCK'; payload: keyof UIState['expandedBlocks'] }
  | { type: 'SET_PREVIEW_MODE'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: Partial<UIState['progress']> }
  | { type: 'RESET' };

const initialState: UIState = {
  expandedBlocks: {
    block1: false,
    block2: false,
    block3: false,
    block4: false
  },
  previewMode: false,
  progress: {
    current: 0,
    total: 4,
    message: ''
  }
};

function uiStateReducer(state: UIState, action: UIStateAction): UIState {
  switch (action.type) {
    case 'TOGGLE_BLOCK':
      return {
        ...state,
        expandedBlocks: {
          ...state.expandedBlocks,
          [action.payload]: !state.expandedBlocks[action.payload]
        }
      };
    case 'SET_PREVIEW_MODE':
      return { ...state, previewMode: action.payload };
    case 'SET_PROGRESS':
      return {
        ...state,
        progress: { ...state.progress, ...action.payload }
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface UIStateContextType {
  state: UIState;
  actions: {
    toggleBlock: (block: keyof UIState['expandedBlocks']) => void;
    setPreviewMode: (mode: boolean) => void;
    setProgress: (progress: Partial<UIState['progress']>) => void;
    reset: () => void;
  };
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(uiStateReducer, initialState);

  const toggleBlock = useCallback((block: keyof UIState['expandedBlocks']) => {
    dispatch({ type: 'TOGGLE_BLOCK', payload: block });
  }, []);

  const setPreviewMode = useCallback((mode: boolean) => {
    dispatch({ type: 'SET_PREVIEW_MODE', payload: mode });
  }, []);

  const setProgress = useCallback((progress: Partial<UIState['progress']>) => {
    dispatch({ type: 'SET_PROGRESS', payload: progress });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const contextValue: UIStateContextType = {
    state,
    actions: {
      toggleBlock,
      setPreviewMode,
      setProgress,
      reset
    }
  };

  return (
    <UIStateContext.Provider value={contextValue}>
      {children}
    </UIStateContext.Provider>
  );
};

export const useUIState = () => {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
};
