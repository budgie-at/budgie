import { TransactionTypeEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { FilterSheetApply } from '../../../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheetFooter } from '../../../@generic/component/filter-sheet/filter-sheet-footer/filter-sheet-footer';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { toggleFilterSelection } from '../../utils/toggle-filter-selection.util';
import { TransactionFiltersSelector } from '../transaction-filters/transaction-filters.selector';
import { TransactionTypeFilterItem } from '../transaction-type-filter/transaction-type-filter-item';

import type { TransactionTypeFilterResult } from '../../context/transaction-type-filter-modal.context';

const TRANSACTION_TYPE_ROWS = [
    [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME],
    [TransactionTypeEnum.TRANSFER, TransactionTypeEnum.DEBT]
];

interface Props {
    readonly value: TransactionTypeEnum[] | null;
    readonly onCommit: (result: TransactionTypeFilterResult) => void;
}

export const TransactionTypeFilterContent = ({ value, onCommit }: Props) => {
    const { t } = useLingui();
    const [selectedTypes, setSelectedTypes] = useState<TransactionTypeEnum[] | null>(value);
    const commit = useMorphingSheetCommit(onCommit);

    const handleSelect = (selected: TransactionTypeEnum) => void setSelectedTypes(previous => toggleFilterSelection(previous, [selected]));
    const handleApply = () => void commit({ value: selectedTypes });

    const localSelectedCount = selectedTypes?.length ?? 0;
    const applyLabel = t({
        message: plural(localSelectedCount, {
            0: 'Show all types',
            one: 'Show # type',
            other: 'Show # types'
        })
    });

    return (
        <SheetSurface className="flex-none pt-lg" contentClassName="flex-none">
            <View className="gap-y-sm px-xl pt-md pb-[16px]">
                {TRANSACTION_TYPE_ROWS.map(row => (
                    <View className="h-[96px] flex-row gap-x-sm" key={row.join('-')}>
                        {row.map(type => (
                            <View className="flex-1" key={type}>
                                <TransactionTypeFilterItem
                                    type={type}
                                    onSelect={handleSelect}
                                    isSelected={selectedTypes?.includes(type) ?? false}
                                />
                            </View>
                        ))}
                    </View>
                ))}
            </View>

            <FilterSheetFooter>
                <FilterSheetApply onApply={handleApply} label={applyLabel} testID={TransactionFiltersSelector.TypeApplyButton} />
            </FilterSheetFooter>
        </SheetSurface>
    );
};
