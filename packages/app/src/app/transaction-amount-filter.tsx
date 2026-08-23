import { AmountRangeInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { AmountInput } from '../@generic/component/amount-input/amount-input';
import { FilterSheetApply } from '../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet/filter-sheet';
import { FormItem } from '../@generic/component/form-item/form-item';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { useStateRef } from '../@generic/hook/use-state-ref/use-state-ref.hook';
import { TransactionFilterSelectorHeader } from '../transaction/components/transaction-filter-selector-header/transaction-filter-selector-header';
import { TransactionFiltersSelector } from '../transaction/components/transaction-filters/transaction-filters.selector';
import { useTransactionAmountFilterModal } from '../transaction/context/transaction-amount-filter-modal.context';

const CONTENT_TOP_SPACE = 96;
const MIN_BOTTOM_SPACING = 16;
const KEYBOARD_STICKY_OFFSET = { closed: 0, opened: 12 };

export default function TransactionAmountFilterModal() {
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const { backgroundColor } = useFormsheetListStyles();
    const [, resolveTransactionAmountFilter, currentParams] = useTransactionAmountFilterModal();

    const [fromValue, setFromValue, fromValueRef] = useStateRef<number>(() => currentParams?.value?.from ?? 0);
    const [toValue, setToValue, toValueRef] = useStateRef<number>(() => currentParams?.value?.to ?? 0);

    const handleApply = () => {
        const from = isPositiveNumber(fromValueRef.current) ? fromValueRef.current : null;
        const to = isPositiveNumber(toValueRef.current) ? toValueRef.current : null;
        const value: AmountRangeInterface | null = isDefined(from) || isDefined(to) ? { from, to } : null;

        resolveTransactionAmountFilter({ value });
    };

    const handleClose = () => void resolveTransactionAmountFilter(null);

    const hasSelected = isPositiveNumber(fromValue) || isPositiveNumber(toValue);
    const applyLabel = hasSelected ? t`Show selected range` : t`Show all amounts`;
    const contentStyle = { paddingTop: CONTENT_TOP_SPACE };
    const drawerStyle = { backgroundColor, paddingBottom: Math.max(bottom, MIN_BOTTOM_SPACING) };

    return (
        <FilterSheet>
            <TransactionFilterSelectorHeader title={t`Filter by amount`} onClose={handleClose} />

            <View className="flex-1 px-7xl" style={contentStyle}>
                <Text className="text-secondary-foreground text-sm mb-7xl">
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

            <KeyboardStickyView offset={KEYBOARD_STICKY_OFFSET} className="absolute inset-x-0 bottom-0">
                <View className="border-t border-t-secondary-corner px-xl pb-lg pt-lg" style={drawerStyle}>
                    <FilterSheetApply onApply={handleApply} label={applyLabel} testID={TransactionFiltersSelector.AmountApplyButton} />
                </View>
            </KeyboardStickyView>
        </FilterSheet>
    );
}
