import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HouseholdShareSelector } from '../../../household/constant/household-share.selector';

interface Props {
    readonly isBankSynced: boolean;
}

export const HouseholdSharedByOtherAccountSection = ({ isBankSynced }: Props) => {
    const { t } = useLingui();
    const title = isBankSynced ? t`Synced by a family member` : t`Shared by a family member`;

    return (
        <GroupedListSection title={t`Family`} footer={t`Everyone in your family can see and edit it. It isn't counted in your total.`}>
            <GroupedListRow
                left={<GroupedListIcon icon={UserIconNameEnum.Users} />}
                title={title}
                testID={HouseholdShareSelector.AccountRow}
            />
        </GroupedListSection>
    );
};
