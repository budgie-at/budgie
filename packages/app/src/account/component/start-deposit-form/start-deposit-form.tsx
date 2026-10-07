import { AccountTypeEnum } from '@budgie/contracts';
import { TransactionTransferService } from '@budgie/ledger';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { router } from 'expo-router';
import { FieldErrors, useForm } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useShowError } from '../../../@generic/hook/use-show-error.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { ACCOUNT_ICON } from '../../constant/account-icon.constant';
import { StartDepositFormSchema } from '../../constant/start-deposit-form-schema.constant';
import { StartDepositFormBody } from '../start-deposit-form-body/start-deposit-form-body';

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
    const { operationInstrumentId, operationAmount } = sourceEntry;
    const hasOperationCurrency = isDefined(operationInstrumentId) && isDefined(operationAmount);

    const form = useForm<DepositAccountFormValues>({
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(StartDepositFormSchema)),
        mode: 'onSubmit',
        defaultValues: {
            iban: null,
            title: t`Deposit`,
            deadline: null,
            interestRate: null,
            currentBalance: hasOperationCurrency ? convertFromMicroUnits(operationAmount) : sourceAmount,
            icon: ACCOUNT_ICON[AccountTypeEnum.DEPOSIT],
            includeInNetWorth: true,
            type: AccountTypeEnum.DEPOSIT,
            instrumentId: hasOperationCurrency ? operationInstrumentId : sourceEntry.account.instrumentId,
            integrationId: sourceEntry.account.integrationId
        }
    });
    const openCreatedDeposit = (depositAccount: AccountEntityInterface) =>
        void router.replace({ pathname: '/account/[id]/details', params: { id: String(depositAccount.id) } });

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
            .then(openCreatedDeposit, showError);

    const handleInvalid = (errors: FieldErrors<DepositAccountFormValues>) => {
        const message = isDefined(errors.currentBalance)
            ? t`Receiving amount must be greater than zero`
            : t`Please check the account details`;

        showError(new Error(message));
    };

    const handleSubmit = form.handleSubmit(startDeposit, handleInvalid);

    return (
        <StartDepositFormBody
            control={form.control}
            setValue={form.setValue}
            sourceEntry={sourceEntry}
            sourceAmount={sourceAmount}
            hasOperationCurrency={hasOperationCurrency}
            onSubmit={handleSubmit}
            isSubmitting={form.formState.isSubmitting}
        />
    );
};
