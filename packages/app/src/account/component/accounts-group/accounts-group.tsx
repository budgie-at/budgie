import { AccountTypeEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FilterSheetCheckbox } from '../../../@generic/component/filter-sheet/filter-sheet-checkbox/filter-sheet-checkbox';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { TransactionFiltersSelector } from '../../../transaction/components/transaction-filters/transaction-filters.selector';
import { ACCOUNT_ICON } from '../../constant/account-icon.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { AccountFilterCard } from '../account-filter-card/account-filter-card';

interface Props {
    readonly type: AccountTypeEnum;
    readonly selectedAccountIds: number[];
    readonly onSelect: (...accountIds: number[]) => void;
    readonly accounts: AccountWithInstrumentEntityInterface[];
}

export const AccountsGroup = ({ type, accounts, selectedAccountIds, onSelect }: Props) => {
    const { t } = useLingui();

    const accountIds = accounts.map(account => account.id);
    const accountsCount = accountIds.length;
    const selectedInGroupCount = accountIds.filter(accountId => selectedAccountIds.includes(accountId)).length;
    const isAllSelected = selectedInGroupCount === accountsCount;
    const isPartiallySelected = isPositiveNumber(selectedInGroupCount) && !isAllSelected;

    const handleSelectGroup = () => void onSelect(...accountIds);
    const handleSelectSingle = (accountId: number) => void onSelect(accountId);

    const accountsCountLabel = t({
        message: plural(accountsCount, {
            one: '# account',
            other: '# accounts'
        })
    });
    const subtitle = isPartiallySelected ? t`${selectedInGroupCount} of ${accountsCount} selected` : accountsCountLabel;
    const accessibilityState = { checked: isPartiallySelected ? ('mixed' as const) : isAllSelected };

    if (isEmptyArray(accounts)) {
        return null;
    }

    return (
        <View className="rounded-5xl border border-secondary-corner bg-secondary-background overflow-hidden">
            <HapticPressable
                onPress={handleSelectGroup}
                className="flex-row items-center gap-x-xl px-xl py-lg"
                accessibilityRole="checkbox"
                accessibilityState={accessibilityState}
                testID={TransactionFiltersSelector.AccountGroupSelectAll(type)}
            >
                <CircleIcon icon={ACCOUNT_ICON[type]} variant="secondary" size={38} iconSize={18} border={false} />

                <View className="flex-1 gap-y-xxs">
                    <Text className="text-xs uppercase font-semibold text-secondary-foreground">{t(ACCOUNT_TYPE[type])}</Text>
                    <Text className="text-sm text-secondary-foreground">{subtitle}</Text>
                </View>

                <FilterSheetCheckbox isSelected={isAllSelected} isPartiallySelected={isPartiallySelected} />
            </HapticPressable>

            {accounts.map(account => (
                <AccountFilterCard
                    key={account.id}
                    account={account}
                    isSelected={selectedAccountIds.includes(account.id)}
                    onSelect={handleSelectSingle}
                />
            ))}
        </View>
    );
};
