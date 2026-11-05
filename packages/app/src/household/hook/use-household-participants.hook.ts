import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { householdParticipantsAtom } from '../constant/household-participants-atom.constant';
import { ICloudParticipantRole } from '../../../modules/icloud';

import type { ICloudShareParticipant } from '../../../modules/icloud';

const NO_PARTICIPANTS: readonly ICloudShareParticipant[] = [];

export const useHouseholdParticipants = () => {
    const result = useAtomValue(householdParticipantsAtom);
    const participants = AsyncResult.getOrElse(result, () => NO_PARTICIPANTS);
    const owner = participants.find(participant => participant.role === ICloudParticipantRole.OWNER);

    return {
        participants,
        ownerName: owner?.displayName ?? null,
        isLoading: AsyncResult.isInitial(result) || result.waiting
    };
};
