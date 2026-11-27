import { createContext } from 'react';

import { emptyFn } from '@rnw-community/shared';

export const YieldPayoutsScrollContext = createContext<() => void>(emptyFn);
