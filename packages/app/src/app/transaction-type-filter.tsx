import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { TransactionFiltersSelectors } from '../@e2e/selectors/transaction-filters.selector';
import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet/filter-sheet';
import { FilterSheetApply } from '../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheetDrawer } from '../@generic/component/filter-sheet/filter-sheet-drawer/filter-sheet-drawer';
import { FilterSheetList } from '../@generic/component/filter-sheet/filter-sheet-list/filter-sheet-list';
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

    const handleApply = () => {
        resolveTransactionTypeFilter({ value: localValueRef.current });
    };

    const applyLabel =
        localSelectedCount === 0
            ? t`Show all types`
            : localSelectedCount === 1
              ? t`Show 1 type`
              : t`Show ${localSelectedCount} types`;

    return (
        <FilterSheet>
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
                <FilterSheetApply onApply={handleApply} label={applyLabel} testID={TransactionFiltersSelectors.TypeApplyButton} />
            </FilterSheetDrawer>
        </FilterSheet>
    );
}
