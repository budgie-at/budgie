import { AccountDebtTypeEnum, AccountEntityInterface } from '@budgie/contracts';
import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { useStickyDefinedValue } from '../../../@generic/hook/use-sticky-defined-value.hook';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { useDebtAccountForm } from '../../hooks/use-debt-account-form.hook';
import { useDebtAccountProgressSummaryQuery } from '../../query/use-debt-account-progress-summary.query';
import { accountService } from '../../service/account.service';
import { AccountFormDateField } from '../account-form-date-field/account-form-date-field';
import { AccountTargetBalanceField } from '../account-target-balance-field.tsx/account-target-balance-field';
import { UpdateAccountScreen } from '../create-account-screen/update-account-screen';
import { DebtAccountContactField } from '../debt-account-contact-field/debt-account-contact-field';
import { IncludeInNetWorthField } from '../include-in-net-worth-field/include-in-net-worth-field';

interface Props {
    readonly account: AccountEntityInterface;
}

export const UpdateDebtAccount = ({ account }: Props) => {
    const debtProgressSummary = useDebtAccountProgressSummaryQuery(account.id);
    const targetBalance = convertFromMicroUnits(account.targetBalance);
    const currentBalance =
        account.debtType === AccountDebtTypeEnum.BORROW ? debtProgressSummary.outstandingAmount : debtProgressSummary.paidAmount;
    const initialValues = useMemo(
        () => ({
            iban: account.iban,
            type: account.type,
            icon: account.icon,
            title: account.title,
            currentBalance,
            debtType: account.debtType,
            deadline: account.deadline,
            contactId: account.contactId,
            instrumentId: account.instrumentId,
            targetBalance,
            includeInNetWorth: account.includeInNetWorth,
            isActive: account.isActive
        }),
        [
            account.contactId,
            account.deadline,
            account.debtType,
            account.iban,
            account.icon,
            account.includeInNetWorth,
            account.instrumentId,
            account.isActive,
            account.title,
            account.type,
            currentBalance,
            targetBalance
        ]
    );

    const { control, handleSubmit, instrument, isSubmitting } = useDebtAccountForm(
        initialValues,
        values => accountService.updateDebtById(account.id, values),
        true
    );

    const stickyInstrument = useStickyDefinedValue(instrument);

    if (!isDefined(stickyInstrument)) {
        return <EmptyScreen />;
    }

    const instrumentSymbol = stickyInstrument.symbol;

    return (
        <UpdateAccountScreen
            instrumentSymbol={instrumentSymbol}
            onSubmit={handleSubmit}
            account={account}
            control={control}
            isSubmitting={isSubmitting}
        >
            <AccountTargetBalanceField control={control} instrumentSymbol={instrumentSymbol} />
            <DebtAccountContactField control={control} />
            <AccountFormDateField control={control} variant={ACCOUNT_COLOR.DEBT} />
            <IncludeInNetWorthField control={control} />
        </UpdateAccountScreen>
    );
};
