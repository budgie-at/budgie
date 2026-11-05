import { ICloudParticipantRole } from '../../../../modules/icloud';
import { HouseholdParticipantRow } from '../household-participant-row/household-participant-row';
import { HouseholdRemoveButton } from '../household-remove-button/household-remove-button';

import type { ICloudShareParticipant } from '../../../../modules/icloud';

interface Props {
    readonly participant: ICloudShareParticipant;
}

export const HouseholdOwnerParticipantRow = ({ participant }: Props) => {
    const removeButton = participant.role === ICloudParticipantRole.OWNER ? null : <HouseholdRemoveButton participant={participant} />;

    return <HouseholdParticipantRow participant={participant}>{removeButton}</HouseholdParticipantRow>;
};
