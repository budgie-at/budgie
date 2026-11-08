import { createContext, use } from 'react';

export const AnchoredMorphPanelSettledContext = createContext(true);

export const useAnchoredMorphPanelSettled = () => use(AnchoredMorphPanelSettledContext);
