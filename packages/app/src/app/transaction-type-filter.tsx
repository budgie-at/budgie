import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { TransactionFiltersSelectors } from '../@e2e/selectors/transaction-filters.selector';
import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet';
import { FilterSheetApply } from '../@generic/component/filter-sheet/filter-sheet-apply';
import { FilterSheetDrawer } from '../@generic/component/filter-sheet/filter-sheet-drawer';
import { FilterSheetHeader } from '../@generic/component/filter-sheet/filter-sheet-header';
import { FilterSheetList } from '../@generic/component/filter-sheet/filter-sheet-list';
import { useStateRef } from '../@generic/hook/use-state-ref/use-state-ref.hook';
import { TransactionTypeFilterItem } from '../transaction/components/transaction-type-filter/transaction-type-filter-item';
import { useTransactionTypeFilterModal } from '../transaction/context/transaction-type-filter-modal.context';

const TRANSACTION_TYPES = [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME, TransactionTypeEnum.TRANSFER, TransactionTypeEnum.DEBT];

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

    const handleClear = () => void setLocalValue(null);

    const handleApply = () => {
        resolveTransactionTypeFilter({ value: localValueRef.current });
    };

    return (
        <FilterSheet>
            <FilterSheetHeader title={t`Transaction Type`} onClear={handleClear} showClear={isPositiveNumber(localSelectedCount)} />

            <FilterSheetList>
                <View className="-mx-sm flex-row flex-wrap gap-y-md">
                    {TRANSACTION_TYPES.map(type => (
                        <View className="w-1/2 px-sm" key={type}>
                            <TransactionTypeFilterItem
                                type={type}
                                onSelect={handleSelect}
                                isSelected={localValue?.includes(type) ?? false}
                            />
                        </View>
                    ))}
                </View>
            </FilterSheetList>

            <FilterSheetDrawer>
                <FilterSheetApply
                    onApply={handleApply}
                    selectedCount={localSelectedCount}
                    testID={TransactionFiltersSelectors.TypeApplyButton}
                />
            </FilterSheetDrawer>
        </FilterSheet>
    );
}
