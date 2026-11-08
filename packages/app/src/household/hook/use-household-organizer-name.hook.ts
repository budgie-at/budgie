import { ICloudParticipantRole } from '@budgie/cloud-sync';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { isNotEmptyString } from '@rnw-community/shared';

import { householdJoinAtom } from '../constant/household-join-atom.constant';
import { householdOwnerNameAtom } from '../constant/household-owner-name-atom.constant';

import { useHouseholdParticipants } from './use-household-participants.hook';

export const useHouseholdOrganizerName = (): string | null => {
    const joinedOwnerName = useAtomValue(householdJoinAtom, ({ ownerDisplayName }) => ownerDisplayName);
    const storedOwnerName = useAtomValue(householdOwnerNameAtom);
    const { otherParticipants } = useHouseholdParticipants();
    const participantName = otherParticipants.find(participant => participant.role === ICloudParticipantRole.OWNER)?.displayName;

    if (isNotEmptyString(participantName)) {
        return participantName;
    }

    if (isNotEmptyString(joinedOwnerName)) {
        return joinedOwnerName;
    }

    return isNotEmptyString(storedOwnerName) ? storedOwnerName : null;
};
