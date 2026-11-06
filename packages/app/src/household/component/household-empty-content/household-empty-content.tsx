import { useLingui } from '@lingui/react/macro';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HouseholdInviteRow } from '../household-invite-row/household-invite-row';

export const HouseholdEmptyContent = () => {
    const { t } = useLingui();

    return (
        <GroupedListSection
            footer={t`Choose which accounts and budgets to share. Family members can see and edit what you share. Everything else stays private.`}
        >
            <HouseholdInviteRow />
        </GroupedListSection>
    );
};
