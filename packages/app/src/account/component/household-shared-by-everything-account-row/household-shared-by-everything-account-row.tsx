import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { HouseholdShareSelector } from '../household-share-account-section/household-share-account-section.selector';

export const HouseholdSharedByEverythingAccountRow = () => {
    const { t } = useLingui();
    const reason = t`Shared because you share everything`;
    const pressableProps = {
        accessible: true,
        accessibilityRole: 'switch' as const,
        accessibilityHint: reason,
        accessibilityState: { checked: true, disabled: true }
    };

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={UserIconNameEnum.Users} />}
            title={t`Share this account`}
            subtitle={reason}
            testID={HouseholdShareSelector.AccountRow}
            pressableProps={pressableProps}
            right={
                <ThemedSwitch
                    value
                    disabled
                    accessibilityLabel={t`Share this account`}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    testID={HouseholdShareSelector.AccountSwitch}
                />
            }
        />
    );
};
