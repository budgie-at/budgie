import { useLingui } from '@lingui/react/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { formatKeypadAmount } from '../../utils/format-keypad-amount.util';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionAmountDisplay } from '../transaction-amount-display/transaction-amount-display';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { useAdjustmentInput } from '../../hook/use-adjustment-input.hook';
import type { useTransactionKeypadEditing } from '../../hook/use-transaction-keypad-editing.hook';
import type { AdjustmentTransactionDetailsInterface } from '../../interface/adjustment-transaction-details.interface';
import type { TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';
import type { RefObject } from 'react';

interface Props {
    readonly ref?: RefObject<TransactionAmountDisplayRef | null>;
    readonly details: Pick<AdjustmentTransactionDetailsInterface, 'instrumentSymbol' | 'isReconciliation'>;
    readonly input: Pick<ReturnType<typeof useAdjustmentInput>, 'numericValue' | 'displayValue' | 'isIncrease'>;
    readonly editing: ReturnType<typeof useTransactionKeypadEditing>;
}

export const AdjustmentAmountDisplay = ({ ref, details, input, editing }: Props) => {
    const { t } = useLingui();
    const variant: ColorPaletteVariant = input.isIncrease ? 'positive' : 'primary';
    const display = {
        variant: isPositiveNumber(input.numericValue) ? variant : ('secondary' as const),
        symbol: isPositiveNumber(input.numericValue)
            ? `${input.isIncrease ? '+' : '−'}\u2060${details.instrumentSymbol}`
            : details.instrumentSymbol,
        amount: editing.isEditingAmount ? input.displayValue : formatKeypadAmount(input.displayValue, '.', '', 2)
    };
    const interaction = details.isReconciliation
        ? { accessibilityHint: t`Sync controls this adjustment. Only the note can be edited.` }
        : { onPress: editing.toggleKeypad, accessibilityHint: editing.amountAccessibilityHint };

    return (
        <TransactionAmountDisplay
            ref={ref}
            amount={display.amount}
            currencySymbol={display.symbol}
            variant={display.variant}
            isEditing={editing.isEditingAmount}
            testID={SimpleQuickFormSelector.AmountInput}
            {...interaction}
        />
    );
};
