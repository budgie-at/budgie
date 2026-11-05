import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { HouseholdService } from '../service/household.service';

import { householdRefreshAtom } from './household-refresh-atom.constant';

import type { ICloudShareParticipant } from '../../../modules/icloud';

const NO_PARTICIPANTS: readonly ICloudShareParticipant[] = [];

export const householdParticipantsAtom = appAtomRuntime.atom(get => {
    get(householdRefreshAtom);

    return Effect.flatMap(
        Effect.serviceOption(HouseholdService),
        Option.match({
            onNone: () => Effect.succeed(NO_PARTICIPANTS),
            onSome: householdService => householdService.participants().pipe(Effect.catch(() => Effect.succeed(NO_PARTICIPANTS)))
        })
    );
});
