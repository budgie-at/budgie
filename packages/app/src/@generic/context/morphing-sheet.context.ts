import { router } from 'expo-router';
import { createContext, use } from 'react';

export const MorphingSheetDismissContext = createContext<() => void>(() => void router.back());

export const useMorphingSheetDismiss = () => use(MorphingSheetDismissContext);
