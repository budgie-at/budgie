import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
import { SettingsRowIcon } from '../../../settings/components/settings-row-icon/settings-row-icon';
import { useHouseholdAccountsSharing } from '../../hook/use-household-accounts-sharing.hook';

import { HouseholdAccountShareRowSelector } from './household-account-share-row.selector';

import type { HouseholdAccountShareEntryInterface } from '../../interface/household-account-share-entry.interface';

interface Props {
    readonly account: HouseholdAccountShareEntryInterface;
}

export const HouseholdAccountShareRow = ({ account }: Props) => {
    const { setShared, isLoading } = useHouseholdAccountsSharing();

    const handleChange = (next: boolean) => void setShared([account.id], next);

    return (
        <GroupedListSwitchRow
            left={<SettingsRowIcon icon={account.icon} variant="ghost" />}
            title={account.title}
            value={account.isShared}
            isLoading={isLoading}
            testID={HouseholdAccountShareRowSelector.Row}
            switchTestID={HouseholdAccountShareRowSelector.Switch}
            {...(!isLoading && { onChange: handleChange })}
        />
    );
};
