import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { DateFilter } from '../../../@generic/component/date-filter/date-filter';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { FILTER_CHIP_CLASS_NAME } from '../../constant/filter-chip-class-name.constant';
import { useTransactionAccountFilterModal } from '../../context/transaction-account-filter-modal.context';
import { useTransactionCategoryFilterModal } from '../../context/transaction-category-filter-modal.context';
import { useTransactionTagFilterModal } from '../../context/transaction-tag-filter-modal.context';
import { TransactionAmountFilter } from '../transaction-amount-filter/transaction-amount-filter';
import { TransactionIdsFilterChip } from '../transaction-ids-filter-chip/transaction-ids-filter-chip';
import { TransactionTypeFilter } from '../transaction-type-filter/transaction-type-filter';

import { TransactionFiltersSelector } from './transaction-filters.selector';

import type { ReactNode } from 'react';

interface Props {
    readonly showTypeFilter?: boolean;
    readonly accountId: number | null;
    readonly hasFiltersSelected: boolean;
    readonly filters: TransactionFilterInterface;
    readonly onChange: (cb: TransactionFilterInterface | ((prev: TransactionFilterInterface) => TransactionFilterInterface)) => void;
    readonly leading?: ReactNode;
}

export const TransactionFilters = ({ filters, onChange, accountId, showTypeFilter = true, hasFiltersSelected, leading }: Props) => {
    const { t } = useLingui();
    const [openTransactionAccountFilter] = useTransactionAccountFilterModal();
    const [openTransactionCategoryFilter] = useTransactionCategoryFilterModal();
    const [openTransactionTagFilter] = useTransactionTagFilterModal();
    const selectedAccountsCount = filters.accountIds?.length ?? 0;
    const selectedCategoriesCount = filters.categoryIds?.length ?? 0;
    const selectedTagsCount = filters.tagIds?.length ?? 0;

    const createFilterHandler =
        <K extends keyof TransactionFilterInterface>(key: K) =>
        (value: TransactionFilterInterface[K]) => {
            onChange(prev => ({ ...prev, [key]: value }));
        };

    const handleClear = () => void onChange({ ...DEFAULT_TRANSACTION_FILTER, accountIds: isDefined(accountId) ? [accountId] : null });

    return (
        <View className="-mx-7xl">
            <ScrollView horizontal contentContainerClassName="flex-row items-center gap-x-md px-7xl" showsHorizontalScrollIndicator={false}>
                {hasFiltersSelected ? (
                    <HapticPressable
                        onPress={handleClear}
                        className={cn(FILTER_CHIP_CLASS_NAME, 'bg-destructive-background border-destructive-corner')}
                        testID={TransactionFiltersSelector.ClearAllButton}
                    >
                        <Icon icon={UserIconNameEnum.X} className="text-destructive-foreground" size={13} />
                        <Text className="text-destructive-foreground text-[13px] font-medium">
                            <Trans>Clear All</Trans>
                        </Text>
                    </HapticPressable>
                ) : null}

                {leading}

                <DateFilter value={filters.date} onChange={createFilterHandler('date')} />
                {showTypeFilter ? <TransactionTypeFilter value={filters.types} onChange={createFilterHandler('types')} /> : null}
                <TransactionAmountFilter value={filters.amount} onChange={createFilterHandler('amount')} />
                <TransactionIdsFilterChip
                    icon={UserIconNameEnum.Tag}
                    label={t`Categories`}
                    activeLabel={t`Categories (${selectedCategoriesCount})`}
                    testID={TransactionFiltersSelector.CategoryChip}
                    value={filters.categoryIds}
                    open={openTransactionCategoryFilter}
                    onChange={createFilterHandler('categoryIds')}
                />
                <TransactionIdsFilterChip
                    icon={UserIconNameEnum.Hash}
                    label={t`Tags`}
                    activeLabel={t`Tags (${selectedTagsCount})`}
                    testID={TransactionFiltersSelector.TagChip}
                    value={filters.tagIds}
                    open={openTransactionTagFilter}
                    onChange={createFilterHandler('tagIds')}
                />

                {isDefined(accountId) ? null : (
                    <TransactionIdsFilterChip
                        icon={UserIconNameEnum.Wallet}
                        label={t`Accounts`}
                        activeLabel={t`Accounts (${selectedAccountsCount})`}
                        testID={TransactionFiltersSelector.AccountChip}
                        activeTestID={TransactionFiltersSelector.AccountChipActive}
                        value={filters.accountIds}
                        open={openTransactionAccountFilter}
                        onChange={createFilterHandler('accountIds')}
                    />
                )}
            </ScrollView>
        </View>
    );
};
