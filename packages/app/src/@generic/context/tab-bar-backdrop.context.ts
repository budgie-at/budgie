import { createContext } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { TabBarBackdropEnum } from '../enum/tab-bar-backdrop.enum';

import type { Dispatch, SetStateAction } from 'react';

export const TabBarBackdropContext = createContext<Dispatch<SetStateAction<TabBarBackdropEnum>>>(emptyFn);
