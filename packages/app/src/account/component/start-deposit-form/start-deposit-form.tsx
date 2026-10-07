import { AccountTypeEnum } from '@budgie/contracts';
import { TransactionTransferService } from '@budgie/ledger';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { ACCOUNT_ICON } from '../../constant/account-icon.constant';
import { useDepositAccountForm } from '../../hooks/use-deposit-account-form.hook';
import { DepositAccountFormScreen } from '../deposit-account-form-screen/deposit-account-form-screen';
import { StartDepositFundingSummary } from '../start-deposit-funding-summary/start-deposit-funding-summary';

import { StartDepositFormSelector } from './start-deposit-form.selector';

import type { TransactionEntryAssociationEnum, TransactionEntryWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transactionId: number;
    readonly sourceEntry: Pick<
        TransactionEntryWithRelationsEntityInterface,
        'amount' | 'operationInstrumentId' | 'operationAmount' | TransactionEntryAssociationEnum.ACCOUNT
    >;
}

export const StartDepositForm = ({ transactionId, sourceEntry }: Props) => {
    const { t } = useLingui();
    const sourceAmount = convertFromMicroUnits(sourceEntry.amount);
    const { operationInstrumentId, operationAmount } = sourceEntry;
    const hasOperationCurrency = isDefined(operationInstrumentId) && isDefined(operationAmount);
    const receivingAmount = hasOperationCurrency ? convertFromMicroUnits(operationAmount) : sourceAmount;

    const initialValues = {
        iban: null,
        title: t`Deposit`,
        deadline: null,
        interestRate: null,
        currentBalance: receivingAmount,
        icon: ACCOUNT_ICON[AccountTypeEnum.DEPOSIT],
        includeInNetWorth: true,
        type: AccountTypeEnum.DEPOSIT,
        instrumentId: hasOperationCurrency ? operationInstrumentId : sourceEntry.account.instrumentId,
        integrationId: sourceEntry.account.integrationId
    };

    const { control, handleSubmit, instrument, isSubmitting } = useDepositAccountForm(initialValues, values =>
        appRuntime.runPromise(
            Effect.flatMap(TransactionTransferService, transactionTransferService =>
                transactionTransferService.startDepositFromExpense(transactionId, {
                    title: values.title,
                    icon: values.icon,
                    instrumentId: values.instrumentId,
                    interestRate: values.interestRate,
                    deadline: values.deadline,
                    includeInNetWorth: values.includeInNetWorth,
                    receivingAmount: values.currentBalance
                })
            )
        )
    );

    const destinationCode = instrument?.code ?? '';

    return (
        <DepositAccountFormScreen
            title={t`Start Deposit`}
            control={control}
            instrument={instrument}
            onSubmit={handleSubmit}
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
