import { AccountEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useAccountForm } from '../../hooks/use-account-form.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { accountService } from '../../service/account.service';
import { UpdateAccountScreen } from '../create-account-screen/update-account-screen';

interface Props {
    readonly account: AccountEntityInterface;
}

export const UpdateLiabilityAccount = ({ account }: Props) => {
    const { balance } = useAccountBalanceQuery(account.id);

    const { control, handleSubmit, instrument } = useAccountForm(
        {
            type: account.type,
            icon: account.icon,
            title: account.title,
            instrumentId: account.instrumentId,
            includeInNetWorth: account.includeInNetWorth,
            currentBalance: convertFromMicroUnits(balance)
        },
        async values => await accountService.updateById(account.id, values)
    );

    if (!isDefined(instrument)) {
        return <EmptyScreen />;
    }

    return <UpdateAccountScreen instrumentSymbol={instrument.symbol} onSubmit={handleSubmit} account={account} control={control} />;
};
