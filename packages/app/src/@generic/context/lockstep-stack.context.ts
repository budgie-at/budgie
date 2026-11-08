import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { LockstepStackActionsInterface } from '../interface/lockstep-stack-actions.interface';

export const LockstepStackProvider = createContext<LockstepStackActionsInterface>({ push: emptyFn, pop: emptyFn });

export const LockstepScreenSettledProvider = createContext(true);

export const useLockstepStackActions = () => use(LockstepStackProvider);

export const useLockstepScreenSettled = () => use(LockstepScreenSettledProvider);
