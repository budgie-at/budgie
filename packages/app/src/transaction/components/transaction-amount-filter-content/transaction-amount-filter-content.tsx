import { AmountRangeInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { FilterSheetApply } from '../../../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheetFooter } from '../../../@generic/component/filter-sheet/filter-sheet-footer/filter-sheet-footer';
import { FilterSheetHeader } from '../../../@generic/component/filter-sheet/filter-sheet-header/filter-sheet-header';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { TransactionFiltersSelector } from '../transaction-filters/transaction-filters.selector';

import type { TransactionAmountFilterResult } from '../../context/transaction-amount-filter-modal.context';

interface Props {
    readonly value: AmountRangeInterface | null;
    readonly onCommit: (result: TransactionAmountFilterResult) => void;
}

export const TransactionAmountFilterContent = ({ value, onCommit }: Props) => {
    const { t } = useLingui();
    const [fromValue, setFromValue] = useState(value?.from ?? 0);
    const [toValue, setToValue] = useState(value?.to ?? 0);
    const commit = useMorphingSheetCommit(onCommit);

    const handleApply = () => {
        const from = isPositiveNumber(fromValue) ? fromValue : null;
        const to = isPositiveNumber(toValue) ? toValue : null;
        const range: AmountRangeInterface | null = isDefined(from) || isDefined(to) ? { from, to } : null;

        void commit({ value: range });
    };

    const hasSelected = isPositiveNumber(fromValue) || isPositiveNumber(toValue);
    const applyLabel = hasSelected ? t`Show selected range` : t`Show all amounts`;

    return (
        <SheetSurface className="flex-none pt-lg" contentClassName="flex-none" header={<FilterSheetHeader title={t`Filter by amount`} />}>
            <View className="gap-y-4xl px-7xl pt-md pb-[16px]">
                <Text className="text-secondary-foreground text-sm">
                    <Trans>Show transactions when any main amount is inside this range, regardless of currency.</Trans>
                </Text>

                <View className="gap-y-4xl">
                    <FormItem label={t`From`}>
                        <AmountInput
                            size="lg"
                            value={fromValue}
                            onChangeValue={setFromValue}
                            placeholder={t`Minimum amount`}
                            testID={TransactionFiltersSelector.AmountFromInput}
                            autoFocus
                        />
                    </FormItem>

                    <FormItem label={t`To`}>
                        <AmountInput
                            size="lg"
                            value={toValue}
                            onChangeValue={setToValue}
                            placeholder={t`Maximum amount`}
                            testID={TransactionFiltersSelector.AmountToInput}
                        />
                    </FormItem>
                </View>
            </View>

            <FilterSheetFooter>
                <FilterSheetApply onApply={handleApply} label={applyLabel} testID={TransactionFiltersSelector.AmountApplyButton} />
            </FilterSheetFooter>
        </SheetSurface>
    );
};
