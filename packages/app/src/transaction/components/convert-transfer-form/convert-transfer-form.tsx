import { TransactionTypeEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { ScopedVariables, useCSSVariable } from 'uniwind';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useConvertTransferForm } from '../../hook/use-convert-transfer-form.hook';
import { useQuickFormFee } from '../../hook/use-quick-form-fee.hook';
import { ConversionRow } from '../conversion-row/conversion-row';
import { ConvertTransferAccounts } from '../convert-transfer-accounts/convert-transfer-accounts';
import { ConvertTransferSummary } from '../convert-transfer-summary/convert-transfer-summary';
import { QuickFormLayout } from '../quick-form-layout/quick-form-layout';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionAmountDisplay } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFeeFieldIcon } from '../transaction-fee-field-icon/transaction-fee-field-icon';
import { TransactionFieldIcons } from '../transaction-field-icons/transaction-field-icons';
import { TransactionFormActions } from '../transaction-form-actions/transaction-form-actions';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';

interface Props {
    readonly isSubmitting: boolean;
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
}

export const ConvertTransferForm = ({ isSubmitting, onSubmit, onCancel }: Props) => {
    const rowColor = useCSSVariable('--color-grouped-surface-row');
    const rowColors = { ...(isDefined(rowColor) && { '--color-surface-row': rowColor }) };
    const { t } = useLingui();
    const { control } = useFormContext<TransactionCreateInputInterface>();
    const entries = useWatch({ control, name: 'entries' });
    const form = useConvertTransferForm(onSubmit);
    const { feeAmount, handleFeePress } = useQuickFormFee({
        accountFieldName: 'fromAccountId',
        currencySymbol: form.fromAccount?.instrument.symbol ?? '',
        entries,
        transactionType: TransactionTypeEnum.TRANSFER,
        variant: 'default'
    });
    const label = form.originalAccount?.id === form.fromAccount?.id ? t`Receiving` : t`Sending`;
    const confirmLabel = form.isEditing ? t`Done` : t`Convert to Transfer`;
    const isDisabled =
        isSubmitting ||
        form.conversion.isPending ||
        !isDefined(form.originalAccount) ||
        (form.isEditing && !isPositiveNumber(form.keypad.numericValue));
    const displayExchangeRate = isPositiveNumber(form.conversion.exchangeRate) ? 1 / form.conversion.exchangeRate : 0;
    const keypad = form.isEditing ? <TransactionKeypad keypad={form.keypad.handlers} /> : null;
    const amount = form.isEditing ? (
        <TransactionAmountDisplay
            amount={form.keypad.displayValue}
            currencySymbol={form.counterAccount?.instrument.symbol ?? ''}
            variant="primary"
            isEditing
        />
    ) : (
        <ConvertTransferSummary />
    );

    return (
        <QuickFormLayout
            amount={amount}
            keypad={keypad}
            actions={
                <TransactionFormActions
                    label={confirmLabel}
                    isDisabled={isDisabled}
                    onConfirm={form.handleConfirm}
                    onCancel={onCancel}
                    testID={SimpleQuickFormSelector.SubmitButton}
                />
            }
        >
            <ScopedVariables variables={rowColors}>
                <View className="gap-y-[12px]">
                    <ConvertTransferAccounts />
                    {form.conversion.isCrossCurrency ? (
                        <ConversionRow
                            label={label}
                            destinationAmount={form.conversion.destinationAmount}
                            destinationSymbol={form.counterAccount?.instrument.symbol ?? ''}
                            sourceCode={form.originalAccount?.instrument.code ?? ''}
                            destinationCode={form.counterAccount?.instrument.code ?? ''}
                            exchangeRate={displayExchangeRate}
                            isManualRate={form.conversion.isManualRate}
                            onPress={form.handleEdit}
                        />
                    ) : null}
                    {isDefined(form.fromAccount) ? (
                        <TransactionFieldIcons>
                            <TransactionFeeFieldIcon
                                amount={feeAmount}
                                currencySymbol={form.fromAccount.instrument.symbol}
                                instrumentType={form.fromAccount.instrument.type}
                                onPress={handleFeePress}
                            />
                        </TransactionFieldIcons>
                    ) : null}
                </View>
            </ScopedVariables>
        </QuickFormLayout>
    );
};
