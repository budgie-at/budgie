import { ICloudParticipantAcceptanceStatus, ICloudParticipantRole } from '@budgie/cloud-sync';
import { useLingui } from '@lingui/react/macro';

import { useHouseholdParticipants } from '../../hook/use-household-participants.hook';
import { HouseholdAccountShareList } from '../household-account-share-list/household-account-share-list';
import { HouseholdShareEverythingSection } from '../household-share-everything-section/household-share-everything-section';

export const HouseholdOwnerShareSection = () => {
    const { t } = useLingui();
    const { otherParticipants } = useHouseholdParticipants();

    const hasJoinedMember = otherParticipants.some(
        participant =>
            participant.role !== ICloudParticipantRole.OWNER && participant.acceptanceStatus === ICloudParticipantAcceptanceStatus.ACCEPTED
    );

    if (!hasJoinedMember) {
        return <HouseholdShareEverythingSection />;
    }

    return (
        <HouseholdShareEverythingSection
            title={t`Choose what to share`}
            footer={t`Your family sees shared accounts and their payments. Money moved between shared accounts shows as a transfer.`}
        >
            <HouseholdAccountShareList />
        </HouseholdShareEverythingSection>
    );
};
