import { AccountEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { useStickyDefinedValue } from '../../../@generic/hook/use-sticky-defined-value.hook';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { useDepositAccountForm } from '../../hooks/use-deposit-account-form.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { accountService } from '../../service/account.service';
import { UpdateAccountScreen } from '../create-account-screen/update-account-screen';
import { DepositInterestRateField } from '../deposit-interest-rate-field/deposit-interest-rate-field';
import { DepositMaturityDateField } from '../deposit-maturity-date-field/deposit-maturity-date-field';
import { IncludeInNetWorthField } from '../include-in-net-worth-field/include-in-net-worth-field';

interface Props {
    readonly account: AccountEntityInterface;
}

export const UpdateDepositAccount = ({ account }: Props) => {
    const { balance } = useAccountBalanceQuery(account.id);

    const initialValues = {
        iban: account.iban,
        type: account.type,
        icon: account.icon,
        title: account.title,
        deadline: account.deadline,
        currentBalance: balance,
        interestRate: account.interestRate,
        instrumentId: account.instrumentId,
        integrationId: account.integrationId,
        includeInNetWorth: account.includeInNetWorth,
        isActive: account.isActive
    };

    const { control, handleSubmit, instrument, isSubmitting } = useDepositAccountForm(
        initialValues,
        values =>
            accountService.updateDepositById(account.id, {
                title: values.title,
                icon: values.icon,
                currentBalance: values.currentBalance,
                interestRate: values.interestRate,
                deadline: values.deadline,
                includeInNetWorth: values.includeInNetWorth,
                isActive: values.isActive
            }),
        true
    );

    const stickyInstrument = useStickyDefinedValue(instrument);

    if (!isDefined(stickyInstrument)) {
        return <EmptyScreen />;
    }

    return (
        <UpdateAccountScreen
            instrumentSymbol={stickyInstrument.symbol}
            onSubmit={handleSubmit}
            control={control}
            account={account}
            isSubmitting={isSubmitting}
        >
            <DepositInterestRateField control={control} />
            <DepositMaturityDateField control={control} variant={ACCOUNT_COLOR.DEPOSIT} />
            <IncludeInNetWorthField control={control} />
        </UpdateAccountScreen>
    );
};
