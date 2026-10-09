import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { Text } from 'react-native';

import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { DepositAccountFormScreen } from '../deposit-account-form-screen/deposit-account-form-screen';
import { StartDepositFormSelector } from '../start-deposit-form/start-deposit-form.selector';
import { StartDepositFundingSummary } from '../start-deposit-funding-summary/start-deposit-funding-summary';

import type { DepositAccountFormValues } from '../../interface/deposit-account-form-values.interface';
import type { TransactionEntryAssociationEnum, TransactionEntryWithRelationsEntityInterface } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';
import type { Control, UseFormSetValue } from 'react-hook-form';

interface Props {
    readonly control: Control<DepositAccountFormValues>;
    readonly setValue: UseFormSetValue<DepositAccountFormValues>;
    readonly sourceEntry: Pick<TransactionEntryWithRelationsEntityInterface, TransactionEntryAssociationEnum.ACCOUNT>;
    readonly sourceAmount: number;
    readonly hasOperationCurrency: boolean;
    readonly onSubmit: EmptyFn;
    readonly isSubmitting: boolean;
}

export const StartDepositFormBody = ({
    control,
    setValue,
    sourceEntry,
    sourceAmount,
    hasOperationCurrency,
    onSubmit,
    isSubmitting
}: Props) => {
    const { t } = useLingui();
    const sourceInstrumentId = sourceEntry.account.instrumentId;
    const instrumentId = useWatch({ control, name: 'instrumentId' });
    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    useEffect(() => {
        if (instrumentId === sourceInstrumentId) {
            setValue('currentBalance', sourceAmount);
        }
    }, [instrumentId, sourceInstrumentId, sourceAmount, setValue]);

    const destinationCode = instrument?.code ?? '';

    return (
        <DepositAccountFormScreen
            title={t`Start Deposit`}
            control={control}
            instrument={instrument}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            balanceFieldLabel={t`Receiving amount`}
        >
            <StartDepositFundingSummary
                control={control}
                sourceAccountTitle={sourceEntry.account.title}
                sourceAmount={sourceAmount}
                sourceSymbol={sourceEntry.account.instrument.symbol}
                sourceCode={sourceEntry.account.instrument.code}
                destinationCode={destinationCode}
            />

            {hasOperationCurrency ? null : (
                <Text className="text-secondary-foreground text-sm mt-md" testID={StartDepositFormSelector.MissingCurrencyHint}>
                    <Trans>The bank did not report the deposit currency. Confirm the currency and the receiving amount.</Trans>
                </Text>
            )}
        </DepositAccountFormScreen>
    );
};
