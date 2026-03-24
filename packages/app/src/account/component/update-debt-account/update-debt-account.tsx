import { AccountEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { useDebtAccountForm } from '../../hooks/use-debt-account-form.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
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
    const { balance } = useAccountBalanceQuery(account.id);

    const { control, handleSubmit, instrument } = useDebtAccountForm(
        {
            iban: account.iban,
            type: account.type,
            icon: account.icon,
            title: account.title,
            currentBalance: balance,
            debtType: account.debtType,
            deadline: account.deadline,
            contactId: account.contactId,
            instrumentId: account.instrumentId,
            targetBalance: convertFromMicroUnits(account.targetBalance),
            includeInNetWorth: account.includeInNetWorth,
            isActive: account.isActive
        },
        values => accountService.updateDebtById(account.id, values)
    );

    if (!isDefined(instrument)) {
        return <EmptyScreen />;
    }

    return (
        <UpdateAccountScreen instrumentSymbol={instrument.symbol} onSubmit={handleSubmit} account={account} control={control}>
            <AccountTargetBalanceField control={control} />
            <DebtAccountContactField control={control} />
            <AccountFormDateField control={control} variant={ACCOUNT_COLOR.DEBT} />
            <IncludeInNetWorthField control={control} />
        </UpdateAccountScreen>
    );
};
