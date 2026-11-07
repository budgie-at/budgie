import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useHouseholdOrganizerName } from '../../hook/use-household-organizer-name.hook';
import { HouseholdAccountShareList } from '../household-account-share-list/household-account-share-list';
import { HouseholdShareEverythingSection } from '../household-share-everything-section/household-share-everything-section';

export const HouseholdMemberShareSection = () => {
    const { t } = useLingui();
    const organizerName = useHouseholdOrganizerName();

    const title = isDefined(organizerName) ? t`Share your accounts with ${organizerName}` : t`Share your accounts`;
    const footer = isDefined(organizerName)
        ? t`${organizerName} sees shared accounts and their payments. Money moved between shared accounts shows as a transfer.`
        : t`The organizer sees shared accounts and their payments. Money moved between shared accounts shows as a transfer.`;

    return (
        <HouseholdShareEverythingSection title={title} footer={footer}>
            <HouseholdAccountShareList />
        </HouseholdShareEverythingSection>
    );
};
