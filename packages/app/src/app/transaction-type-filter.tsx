import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { TransactionFiltersSelectors } from '../@e2e/selectors/transaction-filters.selector';
import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet/filter-sheet';
import { FilterSheetApply } from '../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheetDrawer } from '../@generic/component/filter-sheet/filter-sheet-drawer/filter-sheet-drawer';
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

    const buildApplyLabel = () => {
        if (localSelectedCount === 0) {
            return t`Show all types`;
        }
        if (localSelectedCount === 1) {
            return t`Show 1 type`;
        }

        return t`Show ${localSelectedCount} types`;
    };
    const applyLabel = buildApplyLabel();

    return (
        <FilterSheet>
            <View className="-mx-sm flex-1 flex-row flex-wrap content-start gap-y-md px-md pt-2xl">
                {TRANSACTION_TYPES.map(type => (
                    <View className="w-1/2 px-sm" key={type}>
                        <TransactionTypeFilterItem type={type} onSelect={handleSelect} isSelected={localValue?.includes(type) ?? false} />
                    </View>
                ))}
            </View>

            <FilterSheetDrawer>
                <FilterSheetApply onApply={handleApply} label={applyLabel} testID={TransactionFiltersSelectors.TypeApplyButton} />
            </FilterSheetDrawer>
        </FilterSheet>
    );
}
