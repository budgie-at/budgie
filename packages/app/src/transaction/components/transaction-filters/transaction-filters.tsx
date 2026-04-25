import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { DateFilter } from '../../../@generic/component/date-filter/date-filter';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { TransactionAccountFilter } from '../transaction-account-filter/transaction-account-filter';
import { TransactionCategoryFilter } from '../transaction-category-filter/transaction-category-filter';
import { TransactionTagFilter } from '../transaction-tag-filter/transaction-tag-filter';
import { TransactionTypeFilter } from '../transaction-type-filter/transaction-type-filter';

import { TransactionFiltersSelector } from './transaction-filters.selector';

interface Props {
    readonly showTypeFilter?: boolean;
    readonly accountId: number | null;
    readonly hasFiltersSelected: boolean;
    readonly filters: TransactionFilterInterface;
    readonly onChange: (cb: TransactionFilterInterface | ((prev: TransactionFilterInterface) => TransactionFilterInterface)) => void;
}

export const TransactionFilters = ({ filters, onChange, accountId, showTypeFilter = true, hasFiltersSelected }: Props) => {
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
                        className="bg-destructive-background border border-destructive-corner rounded-2xl px-xl py-sm flex-row items-center gap-x-xs"
                        testID={TransactionFiltersSelector.ClearAllButton}
                    >
                        <Icon icon={UserIconNameEnum.X} className="text-destructive-foreground" size={14} />
                        <Text className="text-destructive-foreground text-sm">
                            <Trans>Clear All</Trans>
                        </Text>
                    </HapticPressable>
                ) : null}

                <DateFilter value={filters.date} onChange={createFilterHandler('date')} />
                {showTypeFilter ? <TransactionTypeFilter value={filters.types} onChange={createFilterHandler('types')} /> : null}
                <TransactionCategoryFilter value={filters.categoryIds} onChange={createFilterHandler('categoryIds')} />
                <TransactionTagFilter value={filters.tagIds} onChange={createFilterHandler('tagIds')} />

                {isDefined(accountId) ? null : (
                    <TransactionAccountFilter value={filters.accountIds} onChange={createFilterHandler('accountIds')} />
                )}
            </ScrollView>
        </View>
    );
};
