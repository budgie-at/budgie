import { TransactionTypeEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { ScopedVariables, useCSSVariable } from 'uniwind';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useConvertTransferForm } from '../../hook/use-convert-transfer-form.hook';
import { useQuickFormFee } from '../../hook/use-quick-form-fee.hook';
import { ConvertTransferAccounts } from '../convert-transfer-accounts/convert-transfer-accounts';
import { ConvertTransferRateRow } from '../convert-transfer-rate-row/convert-transfer-rate-row';
import { ConvertTransferSummary } from '../convert-transfer-summary/convert-transfer-summary';
import { QuickFormFieldError } from '../quick-form-field-error/quick-form-field-error';
import { QuickFormLayout } from '../quick-form-layout/quick-form-layout';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionAmountDisplay } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFeeFieldIcon } from '../transaction-fee-field-icon/transaction-fee-field-icon';
import { TransactionFormActions } from '../transaction-form-actions/transaction-form-actions';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';

interface Props {
    readonly isSubmitting: boolean;
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
}

const ACCOUNT_FIELDS = ['fromAccountId', 'toAccountId'] as const;

export const ConvertTransferForm = ({ isSubmitting, onSubmit, onCancel }: Props) => {
    const rowColor = useCSSVariable('--color-grouped-surface-row');
    const rowColors = { '--color-surface-disc': 'transparent', ...(isDefined(rowColor) && { '--color-surface-row': rowColor }) };
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
                <GroupedListSection footer={<QuickFormFieldError fields={ACCOUNT_FIELDS} />}>
                    <ConvertTransferAccounts />
                    {form.conversion.isCrossCurrency ? (
                        <LoadingContent isLoading={form.conversion.isPending}>
                            <ConvertTransferRateRow
                                destinationAmount={form.conversion.destinationAmount}
                                destinationSymbol={form.counterAccount?.instrument.symbol ?? ''}
                                destinationInstrumentType={form.counterAccount?.instrument.type}
                                sourceCode={form.originalAccount?.instrument.code ?? ''}
                                destinationCode={form.counterAccount?.instrument.code ?? ''}
                                exchangeRate={displayExchangeRate}
                                isManualRate={form.conversion.isManualRate}
                                onPress={form.handleEdit}
                            />
                        </LoadingContent>
                    ) : null}
                    {isDefined(form.fromAccount) ? (
                        <TransactionFeeFieldIcon
                            amount={feeAmount}
                            currencySymbol={form.fromAccount.instrument.symbol}
                            instrumentType={form.fromAccount.instrument.type}
                            onPress={handleFeePress}
                        />
                    ) : null}
                </GroupedListSection>
            </ScopedVariables>
        </QuickFormLayout>
    );
};
