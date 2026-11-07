import { HouseholdRoleEnum } from '@budgie/cloud-sync';
import * as Atom from 'effect/reactivity/Atom';

import type { HouseholdStateInterface } from '../interface/household-state.interface';

const INITIAL_HOUSEHOLD_STATE: HouseholdStateInterface = { role: HouseholdRoleEnum.NONE, isReady: false };

export const householdStateAtom = Atom.keepAlive(Atom.make(INITIAL_HOUSEHOLD_STATE));
