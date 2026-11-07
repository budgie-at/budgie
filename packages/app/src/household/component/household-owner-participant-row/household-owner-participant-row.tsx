import { ICloudParticipantRole } from '@budgie/cloud-sync';

import { HouseholdParticipantRow } from '../household-participant-row/household-participant-row';
import { HouseholdRemoveButton } from '../household-remove-button/household-remove-button';

import type { ICloudShareParticipant } from '@budgie/cloud-sync';

interface Props {
    readonly participant: ICloudShareParticipant;
}

export const HouseholdOwnerParticipantRow = ({ participant }: Props) => {
    const participants = [participant];
    const removeButton = participant.role === ICloudParticipantRole.OWNER ? null : <HouseholdRemoveButton participants={participants} />;

    return <HouseholdParticipantRow participant={participant}>{removeButton}</HouseholdParticipantRow>;
};
