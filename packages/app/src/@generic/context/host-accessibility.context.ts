import { createContext } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { HostAccessibilityInterface } from '../interface/host-accessibility.interface';

export const HostAccessibilityContext = createContext<HostAccessibilityInterface>({ openCount: 0, setOpenCount: emptyFn });
