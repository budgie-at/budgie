import { AccountEntityInterface } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import * as Effect from 'effect/Effect';
import * as Struct from 'effect/Struct';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { useStickyDefinedValue } from '../../../@generic/hook/use-sticky-defined-value.hook';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { useAccountUpdateBindings } from '../../hooks/use-account-update-bindings.hook';
import { useDepositAccountForm } from '../../hooks/use-deposit-account-form.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { UpdateAccountScreen } from '../create-account-screen/update-account-screen';
import { DepositInterestRateField } from '../deposit-interest-rate-field/deposit-interest-rate-field';
import { DepositMaturityDateField } from '../deposit-maturity-date-field/deposit-maturity-date-field';

interface Props {
    readonly account: AccountEntityInterface;
}

export const UpdateDepositAccount = ({ account }: Props) => {
    const { balance } = useAccountBalanceQuery(account.id);

    const initialValues = {
        ...Struct.pick(account, [
            'iban',
            'type',
            'icon',
            'title',
            'deadline',
            'interestRate',
            'instrumentId',
            'integrationId',
            'includeInNetWorth',
            'isActive'
        ]),
        currentBalance: balance
    };

    const { control, handleSubmit, instrument, isSubmitting } = useDepositAccountForm(initialValues, values =>
        Effect.flatMap(AccountService, accountService =>
            accountService.updateDepositById(
                account.id,
                Struct.pick(values, ['title', 'icon', 'currentBalance', 'interestRate', 'deadline', 'includeInNetWorth', 'isActive'])
            )
        )
    );

    const fields = useAccountUpdateBindings(control, {
        title: 'title',
        icon: 'icon',
        currentBalance: 'currentBalance',
        isActive: 'isActive',
        includeInNetWorth: 'includeInNetWorth'
    });
    const stickyInstrument = useStickyDefinedValue(instrument);

    if (!isDefined(stickyInstrument)) {
        return <EmptyScreen />;
    }

    return (
        <UpdateAccountScreen
            instrumentSymbol={stickyInstrument.symbol}
            onSubmit={handleSubmit}
            fields={fields}
            account={account}
            isSubmitting={isSubmitting}
        >
            <DepositInterestRateField control={control} />
            <DepositMaturityDateField control={control} variant={ACCOUNT_COLOR.DEPOSIT} />
        </UpdateAccountScreen>
    );
};
