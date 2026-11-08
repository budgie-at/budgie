import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { HouseholdShareSelector } from '../../../household/constant/household-share.selector';

export const HouseholdSharedByOtherAccountRow = () => {
    const { t } = useLingui();

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={UserIconNameEnum.Users} />}
            title={t`Shared by a family member`}
            subtitle={t`Everyone in your family can see and edit it. It isn't counted in your total.`}
            testID={HouseholdShareSelector.AccountRow}
        />
    );
};
