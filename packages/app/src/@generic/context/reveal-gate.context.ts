import { createContext, use } from 'react';

import { EmptyFn, emptyFn } from '@rnw-community/shared';

export const RevealGateContext = createContext<() => EmptyFn>(() => emptyFn);

export const useRevealGateTrack = () => use(RevealGateContext);
