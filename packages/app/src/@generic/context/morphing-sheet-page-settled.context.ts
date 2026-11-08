import { createContext, use } from 'react';

export const MorphingSheetPageSettledProvider = createContext(true);

export const useMorphingSheetPageSettled = () => use(MorphingSheetPageSettledProvider);
