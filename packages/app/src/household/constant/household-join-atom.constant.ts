import * as Atom from 'effect/reactivity/Atom';

import { HouseholdJoinStatusEnum } from '../enum/household-join-status.enum';

import type { HouseholdJoinInterface } from '../interface/household-join.interface';

export const INITIAL_HOUSEHOLD_JOIN: HouseholdJoinInterface = { status: HouseholdJoinStatusEnum.NONE, ownerDisplayName: null };

export const householdJoinAtom = Atom.keepAlive(Atom.make(INITIAL_HOUSEHOLD_JOIN));
