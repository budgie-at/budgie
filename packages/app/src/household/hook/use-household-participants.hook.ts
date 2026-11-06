import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Option from 'effect/Option';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { householdParticipantsAtom } from '../constant/household-participants-atom.constant';

import type { ICloudShareParticipant } from '../../../modules/icloud';

const NO_PARTICIPANTS: readonly ICloudShareParticipant[] = [];

export const useHouseholdParticipants = () => {
    const result = useAtomValue(householdParticipantsAtom);
    const participants = AsyncResult.getOrElse(result, () => NO_PARTICIPANTS);

    return {
        otherParticipants: participants.filter(participant => !participant.isCurrentUser),
        isLoading: AsyncResult.isInitial(result) || result.waiting,
        isKnown: Option.isSome(AsyncResult.value(result))
    };
};
