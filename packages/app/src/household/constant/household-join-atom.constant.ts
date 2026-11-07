import { HouseholdJoinStatusEnum } from '@budgie/cloud-sync';
import * as Atom from 'effect/reactivity/Atom';

import type { HouseholdJoinInterface } from '../interface/household-join.interface';

const INITIAL_HOUSEHOLD_JOIN: HouseholdJoinInterface = { status: HouseholdJoinStatusEnum.NONE, ownerDisplayName: null };

export const householdJoinAtom = Atom.keepAlive(Atom.make(INITIAL_HOUSEHOLD_JOIN));
