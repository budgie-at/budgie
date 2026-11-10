import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { DateFilter } from '../../../@generic/component/date-filter/date-filter';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { FILTER_CHIP_CLASS_NAME } from '../../constant/filter-chip-class-name.constant';
import { FILTER_CHIP_HIT_SLOP } from '../../constant/filter-chip-hit-slop.constant';
import { TransactionAmountFilter } from '../transaction-amount-filter/transaction-amount-filter';
import { TransactionIdsFilterChip } from '../transaction-ids-filter-chip/transaction-ids-filter-chip';
import { TransactionTypeFilter } from '../transaction-type-filter/transaction-type-filter';

import { TransactionFiltersSelector } from './transaction-filters.selector';

import type { ReactNode } from 'react';

interface Props {
    readonly showTypeFilter?: boolean;
    readonly showDateFilter?: boolean;
    readonly scopeAccountIds: number[] | null;
    readonly isClearAllVisible: boolean;
    readonly filters: TransactionFilterInterface;
    readonly onChange: (cb: TransactionFilterInterface | ((prev: TransactionFilterInterface) => TransactionFilterInterface)) => void;
    readonly leading?: ReactNode;
}

export const TransactionFilters = (props: Props) => {
    const { filters, onChange, scopeAccountIds, showTypeFilter = true, showDateFilter = true, isClearAllVisible, leading } = props;
    const { t } = useLingui();
    const openTransactionAccountFilter = useOpenModal('/transaction-account-filter');
    const openTransactionCategoryFilter = useOpenModal('/transaction-category-filter');
    const openTransactionTagFilter = useOpenModal('/transaction-tag-filter');
    const selectedAccountsCount = filters.accountIds?.length ?? 0;
    const selectedCategoriesCount = filters.categoryIds?.length ?? 0;
    const selectedTagsCount = filters.tagIds?.length ?? 0;

    const createFilterHandler =
        <K extends keyof TransactionFilterInterface>(key: K) =>
        (value: TransactionFilterInterface[K]) => {
            onChange(prev => ({ ...prev, [key]: value }));
        };

    const handleClear = () =>
        void onChange({
            ...DEFAULT_TRANSACTION_FILTER,
            accountIds: scopeAccountIds,
            ...(!showDateFilter && { date: filters.date })
        });

    return (
        <View className="-mx-5xl -my-[6px]">
            <ScrollView
                horizontal
                contentContainerClassName="flex-row items-center gap-x-md px-5xl py-[6px]"
                showsHorizontalScrollIndicator={false}
            >
                {isClearAllVisible ? (
                    <HapticPressable
                        hitSlop={FILTER_CHIP_HIT_SLOP}
                        onPress={handleClear}
                        className={cn(FILTER_CHIP_CLASS_NAME, 'bg-surface-fill')}
                        testID={TransactionFiltersSelector.ClearAllButton}
                    >
                        <Icon icon={UserIconNameEnum.X} className="text-secondary-foreground" size={13} />
                        <Text className="text-primary text-[13px] font-medium">
                            <Trans>Clear All</Trans>
                        </Text>
                    </HapticPressable>
                ) : null}

                {leading}

                {showDateFilter ? <DateFilter value={filters.date} onChange={createFilterHandler('date')} /> : null}
                {showTypeFilter ? <TransactionTypeFilter value={filters.types} onChange={createFilterHandler('types')} /> : null}
                <TransactionAmountFilter value={filters.amount} onChange={createFilterHandler('amount')} />
                <TransactionIdsFilterChip
                    label={t`Categories`}
                    activeLabel={t`Categories (${selectedCategoriesCount})`}
                    testID={TransactionFiltersSelector.CategoryChip}
                    value={filters.categoryIds}
                    open={openTransactionCategoryFilter}
                    onChange={createFilterHandler('categoryIds')}
                />
                <TransactionIdsFilterChip
                    label={t`Tags`}
                    activeLabel={t`Tags (${selectedTagsCount})`}
                    testID={TransactionFiltersSelector.TagChip}
                    value={filters.tagIds}
                    open={openTransactionTagFilter}
                    onChange={createFilterHandler('tagIds')}
                />

                {isDefined(scopeAccountIds) ? null : (
                    <TransactionIdsFilterChip
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
            <View
                className="absolute inset-y-[6px] right-0 w-[32px] bg-linear-to-r from-surface/0 via-surface/80 to-surface"
                pointerEvents="none"
            />
        </View>
    );
};
