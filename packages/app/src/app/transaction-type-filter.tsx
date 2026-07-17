import { TransactionTypeEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { FilterSheetApply } from '../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheetDrawer } from '../@generic/component/filter-sheet/filter-sheet-drawer/filter-sheet-drawer';
import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet/filter-sheet';
import { useStateRef } from '../@generic/hook/use-state-ref/use-state-ref.hook';
import { TransactionFiltersSelector } from '../transaction/components/transaction-filters/transaction-filters.selector';
import { TransactionTypeFilterItem } from '../transaction/components/transaction-type-filter/transaction-type-filter-item';
import { useTransactionTypeFilterModal } from '../transaction/context/transaction-type-filter-modal.context';

const TRANSACTION_TYPE_ROWS = [
    [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME],
    [TransactionTypeEnum.TRANSFER, TransactionTypeEnum.DEBT]
];

export default function TransactionTypeFilterModal() {
    const { t } = useLingui();
    const [, resolveTransactionTypeFilter, currentParams] = useTransactionTypeFilterModal();

    const [localValue, setLocalValue, localValueRef] = useStateRef<TransactionTypeEnum[] | null>(() => currentParams?.value ?? null);

    const localSelectedCount = localValue?.length ?? 0;

    const handleSelect = (selected: TransactionTypeEnum) => {
        setLocalValue(prev => {
            if (!isDefined(prev)) {
                return [selected];
            }

            if (prev.includes(selected)) {
                const newFilters = prev.filter(type => selected !== type);

                return isNotEmptyArray(newFilters) ? newFilters : null;
            }

            return [...prev, selected];
        });
    };

    const handleApply = () => {
        resolveTransactionTypeFilter({ value: localValueRef.current });
    };

    const applyLabel = t({
        message: plural(localSelectedCount, {
            0: 'Show all types',
            one: 'Show # type',
            other: 'Show # types'
        })
    });

    return (
        <FilterSheet>
            <View className="flex-1 justify-end gap-y-sm px-xl pt-lg pb-lg">
                {TRANSACTION_TYPE_ROWS.map(row => (
                    <View className="h-[96px] flex-row gap-x-sm" key={row.join('-')}>
                        {row.map(type => (
                            <View className="flex-1" key={type}>
                                <TransactionTypeFilterItem
                                    type={type}
                                    onSelect={handleSelect}
                                    isSelected={localValue?.includes(type) ?? false}
                                />
                            </View>
                        ))}
                    </View>
                ))}
            </View>

            <FilterSheetDrawer>
                <FilterSheetApply onApply={handleApply} label={applyLabel} testID={TransactionFiltersSelector.TypeApplyButton} />
            </FilterSheetDrawer>
        </FilterSheet>
    );
}
