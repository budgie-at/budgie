import { AccountTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { TransactionTransferService } from '@budgie/ledger';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { router } from 'expo-router';
import { FieldErrors, useForm, useWatch } from 'react-hook-form';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useShowError } from '../../../@generic/hook/use-show-error.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { ACCOUNT_ICON } from '../../constant/account-icon.constant';
import { StartDepositFormSchema } from '../../constant/start-deposit-form-schema.constant';
import { DepositAccountFormScreen } from '../deposit-account-form-screen/deposit-account-form-screen';
import { StartDepositFundingSummary } from '../start-deposit-funding-summary/start-deposit-funding-summary';

import { StartDepositFormSelector } from './start-deposit-form.selector';

import type { DepositAccountFormValues } from '../../interface/deposit-account-form-values.interface';
import type {
    AccountEntityInterface,
    TransactionEntryAssociationEnum,
    TransactionEntryWithRelationsEntityInterface
} from '@budgie/contracts';

interface Props {
    readonly transactionId: number;
    readonly sourceEntry: Pick<
        TransactionEntryWithRelationsEntityInterface,
        'amount' | 'operationInstrumentId' | 'operationAmount' | TransactionEntryAssociationEnum.ACCOUNT
    >;
}

export const StartDepositForm = ({ transactionId, sourceEntry }: Props) => {
    const { t } = useLingui();
    const showError = useShowError();
    const sourceAmount = convertFromMicroUnits(sourceEntry.amount);
    const { operationInstrumentId, operationAmount, account } = sourceEntry;
    const hasOperationCurrency = isDefined(operationInstrumentId) && isDefined(operationAmount);
    const hasForeignOperationCurrency = hasOperationCurrency && operationInstrumentId !== account.instrumentId;

    const form = useForm<DepositAccountFormValues>({
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(StartDepositFormSchema)),
        mode: 'onSubmit',
        defaultValues: {
            iban: null,
            title: t`Deposit`,
            deadline: null,
            interestRate: null,
            currentBalance: hasForeignOperationCurrency ? convertFromMicroUnits(operationAmount) : sourceAmount,
            icon: ACCOUNT_ICON[AccountTypeEnum.DEPOSIT],
            includeInNetWorth: true,
            type: AccountTypeEnum.DEPOSIT,
            instrumentId: hasOperationCurrency ? operationInstrumentId : account.instrumentId,
            integrationId: account.integrationId
        }
    });
    const startDeposit = (values: DepositAccountFormValues) =>
        appRuntime
            .runPromise(
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
            .then(
                (depositAccount: AccountEntityInterface) =>
                    void router.replace({ pathname: '/account/[id]/details', params: { id: String(depositAccount.id) } }),
                showError
            );

    const handleInvalid = (errors: FieldErrors<DepositAccountFormValues>) => {
        const message = isDefined(errors.currentBalance)
            ? t`Receiving amount must be greater than zero`
            : t`Please check the account details`;

        showError(new Error(message));
    };

    const handleSubmit = form.handleSubmit(startDeposit, handleInvalid);

    const instrumentId = useWatch({ control: form.control, name: 'instrumentId' });
    const { instrument } = useGetInstrumentByIdQuery(instrumentId);
    const handleInstrumentChange = (nextInstrumentId: number) => {
        if (nextInstrumentId === account.instrumentId && nextInstrumentId !== instrumentId) {
            form.setValue('currentBalance', sourceAmount);
        }
    };

    const destinationCode = instrument?.code ?? '';

    return (
        <DepositAccountFormScreen
            title={t`Start Deposit`}
            control={form.control}
            instrument={instrument}
            onSubmit={handleSubmit}
            isSubmitting={form.formState.isSubmitting}
            balanceFieldLabel={t`Receiving amount`}
            onInstrumentChange={handleInstrumentChange}
        >
            <StartDepositFundingSummary
                control={form.control}
                sourceAccountTitle={account.title}
                sourceAmount={sourceAmount}
                sourceSymbol={account.instrument.symbol}
                sourceCode={account.instrument.code}
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
