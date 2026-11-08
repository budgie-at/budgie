import { createContext, use } from 'react';

export const AnchoredMorphOriginOffsetContext = createContext(0);

export const useAnchoredMorphOriginOffset = () => use(AnchoredMorphOriginOffsetContext);
