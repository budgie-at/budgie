import { useLingui } from '@lingui/react/macro';
import { ScrollView, useWindowDimensions } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { TRANSFER_ACCOUNT_FIELDS } from '../../constant/transfer-account-fields.constant';
import { TransactionKeypadContext } from '../../context/transaction-keypad.context';
import { useConvertTransferForm } from '../../hook/use-convert-transfer-form.hook';
import { ConversionRow } from '../conversion-row/conversion-row';
import { ConvertToTransferHeader } from '../convert-to-transfer-header/convert-to-transfer-header';
import { ConvertTransferAccounts } from '../convert-transfer-accounts/convert-transfer-accounts';
import { ConvertTransferFee } from '../convert-transfer-fee/convert-transfer-fee';
import { ConvertTransferFooter } from '../convert-transfer-footer/convert-transfer-footer';
import { ConvertTransferSummary } from '../convert-transfer-summary/convert-transfer-summary';
import { QuickFormFieldError } from '../quick-form-field-error/quick-form-field-error';
import { TransactionAmountDisplay } from '../transaction-amount-display/transaction-amount-display';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';

interface Props {
    readonly isSubmitting: boolean;
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
}

const KEYPAD_CONTENT_HEIGHT_RATIO = 0.4;

export const ConvertTransferForm = ({ isSubmitting, onSubmit, onCancel }: Props) => {
    const { height } = useWindowDimensions();
    const { t } = useLingui();
    const form = useConvertTransferForm(onSubmit);
    const confirmLabel = form.isEditing ? t`Done` : t`Convert to Transfer`;
    const isDisabled =
        isSubmitting ||
        form.conversion.isPending ||
        !isDefined(form.originalAccount) ||
        (form.isEditing && !isPositiveNumber(form.keypad.numericValue));
    const displayExchangeRate = isPositiveNumber(form.conversion.exchangeRate) ? 1 / form.conversion.exchangeRate : 0;
    const rate = {
        sourceCode: form.originalAccount?.instrument.code ?? '',
        destinationCode: form.counterAccount?.instrument.code ?? '',
        exchangeRate: displayExchangeRate
    };
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

    const scrollStyle = { maxHeight: height * (form.isEditing ? KEYPAD_CONTENT_HEIGHT_RATIO : 0.6), flexGrow: 0 };
    const keypadContext = { dismiss: form.handleConfirm };

    return (
        <TransactionKeypadContext value={keypadContext}>
            <SheetSurface
                className="flex-none"
                contentClassName="flex-none"
                header={
                    <ConvertToTransferHeader
                        isLoading={isSubmitting}
                        onCancel={onCancel}
                        onConfirm={form.handleConfirm}
                        disabled={isDisabled}
                    />
                }
                footer={
                    <ConvertTransferFooter label={confirmLabel} isDisabled={isDisabled} onConfirm={form.handleConfirm}>
                        {keypad}
                    </ConvertTransferFooter>
                }
            >
                <ScrollView style={scrollStyle} contentContainerClassName="px-xl pt-sm pb-[48px]" showsVerticalScrollIndicator={false}>
                    {amount}
                    <GroupedListSection footer={<QuickFormFieldError fields={TRANSFER_ACCOUNT_FIELDS} />}>
                        <ConvertTransferAccounts />
                        {form.conversion.isCrossCurrency ? (
                            <LoadingContent isLoading={form.conversion.isPending}>
                                <ConversionRow
                                    label={form.conversionLabel}
                                    destinationAmount={form.conversion.destinationAmount}
                                    destinationSymbol={form.counterAccount?.instrument.symbol ?? ''}
                                    destinationInstrumentType={form.counterAccount?.instrument.type}
                                    rate={rate}
                                    isManualRate={form.conversion.isManualRate}
                                    onPress={form.handleEdit}
                                />
                            </LoadingContent>
                        ) : null}
                        <ConvertTransferFee />
                    </GroupedListSection>
                </ScrollView>
            </SheetSurface>
        </TransactionKeypadContext>
    );
};
