import { createContext } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { Dispatch, SetStateAction } from 'react';

export const HostAccessibilityContext = createContext<Dispatch<SetStateAction<number>>>(emptyFn);
