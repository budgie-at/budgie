import { createContext, use } from 'react';

export const AnchoredMorphPanelContext = createContext<(() => void) | null>(null);

export const useAnchoredMorphPanelClose = () => use(AnchoredMorphPanelContext);
