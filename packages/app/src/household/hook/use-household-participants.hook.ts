import { ICloudParticipantAcceptanceStatus, ICloudParticipantRole } from '@budgie/cloud-sync';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Option from 'effect/Option';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isNotEmptyString } from '@rnw-community/shared';

import { householdParticipantsAtom } from '../constant/household-participants-atom.constant';

import type { ICloudShareParticipant } from '@budgie/cloud-sync';

const NO_PARTICIPANTS: readonly ICloudShareParticipant[] = [];

export const useHouseholdParticipants = () => {
    const result = useAtomValue(householdParticipantsAtom);
    const participants = AsyncResult.getOrElse(result, () => NO_PARTICIPANTS);
    const isKnown = result.pipe(AsyncResult.value, Option.isSome);

    const otherParticipants = participants.filter(participant => !participant.isCurrentUser);
    const members = otherParticipants.filter(participant => participant.role !== ICloudParticipantRole.OWNER);
    const joinedMembers = members.filter(participant => participant.acceptanceStatus === ICloudParticipantAcceptanceStatus.ACCEPTED);
    const pendingInvites = members.filter(
        participant =>
            participant.acceptanceStatus === ICloudParticipantAcceptanceStatus.PENDING && !isNotEmptyString(participant.displayName)
    );
    const identified = otherParticipants.filter(participant => !pendingInvites.includes(participant));

    return {
        otherParticipants,
        members,
        joinedMembers,
        pendingInvites,
        identified,
        isLoading: AsyncResult.isInitial(result) || (result.waiting && !isKnown),
        isKnown
    };
};
