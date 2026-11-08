import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export const MorphingSheetDismissContext = createContext<() => void>(emptyFn);

export const useMorphingSheetDismiss = () => use(MorphingSheetDismissContext);
