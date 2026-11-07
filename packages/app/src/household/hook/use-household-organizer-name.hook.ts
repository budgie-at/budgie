import { useAtomValue } from '@effect/atom-react/Hooks';

import { isNotEmptyString } from '@rnw-community/shared';

import { ICloudParticipantRole } from '../../../modules/icloud';
import { householdJoinAtom } from '../constant/household-join-atom.constant';

import { useHouseholdParticipants } from './use-household-participants.hook';

export const useHouseholdOrganizerName = (): string | null => {
    const joinedOwnerName = useAtomValue(householdJoinAtom, ({ ownerDisplayName }) => ownerDisplayName);
    const { otherParticipants } = useHouseholdParticipants();
    const participantName = otherParticipants.find(participant => participant.role === ICloudParticipantRole.OWNER)?.displayName;

    if (isNotEmptyString(participantName)) {
        return participantName;
    }

    return isNotEmptyString(joinedOwnerName) ? joinedOwnerName : null;
};
