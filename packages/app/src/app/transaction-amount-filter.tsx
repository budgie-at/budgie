import { AmountRangeInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { AmountInput } from '../@generic/component/amount-input/amount-input';
import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet/filter-sheet';
import { FilterSheetApply } from '../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheetDrawer } from '../@generic/component/filter-sheet/filter-sheet-drawer/filter-sheet-drawer';
import { FormItem } from '../@generic/component/form-item/form-item';
import { FormLayoutGroup } from '../@generic/component/form-layout-group/form-layout-group';
import { useStateRef } from '../@generic/hook/use-state-ref/use-state-ref.hook';
import { useSettingsContext } from '../settings/context/settings.context';
import { TransactionFiltersSelector } from '../transaction/components/transaction-filters/transaction-filters.selector';
import { useTransactionAmountFilterModal } from '../transaction/context/transaction-amount-filter-modal.context';

export default function TransactionAmountFilterModal() {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const [, resolveTransactionAmountFilter, currentParams] = useTransactionAmountFilterModal();

    const [fromValue, setFromValue, fromValueRef] = useStateRef<number>(() => currentParams?.value?.from ?? 0);
    const [toValue, setToValue, toValueRef] = useStateRef<number>(() => currentParams?.value?.to ?? 0);

    const handleApply = () => {
        const from = isPositiveNumber(fromValueRef.current) ? fromValueRef.current : null;
        const to = isPositiveNumber(toValueRef.current) ? toValueRef.current : null;
        const value: AmountRangeInterface | null = isDefined(from) || isDefined(to) ? { from, to } : null;

        resolveTransactionAmountFilter({ value });
    };

    const hasSelected = isPositiveNumber(fromValue) || isPositiveNumber(toValue);
    const applyLabel = hasSelected ? t`Show selected range` : t`Show all amounts`;

    return (
        <FilterSheet>
            <FormLayoutGroup className="flex-1 px-xl pt-7xl">
                <FormItem label={t`From`}>
                    <AmountInput
                        value={fromValue}
                        onChangeValue={setFromValue}
                        valuePrefix={defaultInstrument.symbol}
                        placeholder={t`Minimum amount`}
                        testID={TransactionFiltersSelector.AmountFromInput}
                        autoFocus
                    />
                </FormItem>

                <FormItem label={t`To`}>
                    <AmountInput
                        value={toValue}
                        onChangeValue={setToValue}
                        valuePrefix={defaultInstrument.symbol}
                        placeholder={t`Maximum amount`}
                        testID={TransactionFiltersSelector.AmountToInput}
                    />
                </FormItem>
            </FormLayoutGroup>

            <FilterSheetDrawer>
                <FilterSheetApply onApply={handleApply} label={applyLabel} testID={TransactionFiltersSelector.AmountApplyButton} />
            </FilterSheetDrawer>
        </FilterSheet>
    );
}
