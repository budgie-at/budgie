/* jscpd:ignore-start */
import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isEmptyArray, isEmptyString, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../@generic/component/button/button';
import { Footer } from '../@generic/component/footer/footer';
import { HapticPressable } from '../@generic/component/haptic-pressable/haptic-pressable';
import { Input } from '../@generic/component/input/input';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
/* jscpd:ignore-end */
import { AccountsGroup } from '../account/component/accounts-group/accounts-group';
import { useSearchAccountsGroupedQuery } from '../account/query/use-search-accounts-grouped.query';
import { TransactionFilterEmptyState } from '../transaction/components/transaction-filter-empty-state/transaction-filter-empty-state';
import { TransactionFilterHeader } from '../transaction/components/transaction-filter-header/transaction-filter-header';
import { useTransactionAccountFilterModal } from '../transaction/context/transaction-account-filter-modal.context';
import { toggleFilterSelection } from '../transaction/utils/toggle-filter-selection.util';

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export default function TransactionAccountFilterModal() {
    const { t } = useLingui();
    const router = useRouter();
    /* jscpd:ignore-start */
    const { currentParams, resolveTransactionAccountFilter } = useTransactionAccountFilterModal();
    const { backgroundColor } = useFormsheetListStyles();

    const [localValue, setLocalValue] = useState<number[] | null>(() => currentParams?.value ?? null);
    const [search, setSearch] = useState('');

    const { accountsGrouped, accounts, total } = useSearchAccountsGroupedQuery(search);

    const localSelectedCount = localValue?.length ?? 0;
    const buttonText = isPositiveNumber(localSelectedCount) ? t`Apply Filter (${localSelectedCount})` : t`Apply Filter`;
    const containerStyle = { flex: 1, backgroundColor };
    const showControls = !(isEmptyArray(accounts) && isEmptyString(search));
    const showEmptySearch = isNotEmptyString(search) && isPositiveNumber(total);
    const selectedIds = localValue ?? [];
    /* jscpd:ignore-end */

    const handleSelect = (...accountIds: number[]) => {
        setLocalValue(prev => toggleFilterSelection(prev, accountIds));
    };

    const handleSelectAll = () => void setLocalValue(accounts.map(account => account.id));
    const handleDeselectAll = () => void setLocalValue(null);
    const handleClear = () => void setLocalValue(null);

    const handleApply = () => {
        resolveTransactionAccountFilter({ value: localValue });
    };

    const handleNavigateToCreate = () => {
        resolveTransactionAccountFilter(null);
        router.push('/create-account');
    };

    return (
        <View style={containerStyle}>
            <TransactionFilterHeader
                title={t`Accounts`}
                icon={UserIconNameEnum.Wallet}
                onClear={handleClear}
                showClear={isPositiveNumber(localSelectedCount)}
            />

            <ScrollView contentContainerClassName="py-[40px] px-7xl gap-y-3xl">
                {/* jscpd:ignore-start */}
                {showControls ? (
                    <View className="gap-y-3xl">
                        <Input placeholder={t`Search accounts...`} value={search} onChangeText={setSearch} />

                        <View className="flex-row gap-x-md">
                            <HapticPressable className="py-md px-xl rounded-3xl bg-secondary-background" onPress={handleSelectAll}>
                                <Text className="text-secondary-foreground text-xs font-medium">
                                    <Trans>Select All</Trans>
                                </Text>
                            </HapticPressable>
                            <HapticPressable className="py-md px-xl rounded-3xl bg-secondary-background" onPress={handleDeselectAll}>
                                <Text className="text-secondary-foreground text-xs font-medium">
                                    <Trans>Deselect All</Trans>
                                </Text>
                            </HapticPressable>
                        </View>
                    </View>
                ) : null}
                {/* jscpd:ignore-end */}

                {isNotEmptyArray(accounts) ? (
                    <View className="gap-y-lg">
                        {isNotEmptyArray(accountsGrouped.BANK) ? (
                            <AccountsGroup
                                onSelect={handleSelect}
                                type={AccountTypeEnum.BANK}
                                accounts={accountsGrouped.BANK}
                                selectedAccountIds={selectedIds}
                            />
                        ) : null}

                        {isNotEmptyArray(accountsGrouped.CASH) ? (
                            <AccountsGroup
                                onSelect={handleSelect}
                                type={AccountTypeEnum.CASH}
                                accounts={accountsGrouped.CASH}
                                selectedAccountIds={selectedIds}
                            />
                        ) : null}
                    </View>
                ) : null}

                {/* jscpd:ignore-start */}
                {isEmptyArray(accounts) && showEmptySearch ? (
                    <View className="items-center border border-secondary-corner rounded-5xl bg-secondary-background px-xl py-[30px]">
                        <Text className="text-secondary-foreground text-sm">
                            <Trans>No accounts found</Trans>
                        </Text>
                    </View>
                ) : null}

                {isEmptyArray(accounts) && !showEmptySearch ? (
                    <TransactionFilterEmptyState
                        icon={UserIconNameEnum.Wallet}
                        title={t`No Accounts Yet`}
                        buttonText={t`Create Accounts`}
                        onCreate={handleNavigateToCreate}
                        description={t`Create your first account to start tracking your finances`}
                    />
                ) : null}
            </ScrollView>

            <Footer>
                <Button variant="ghost" onPress={handleApply} content={buttonText} />
            </Footer>
            {/* jscpd:ignore-end */}
        </View>
    );
}
