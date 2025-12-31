import { AccountEntityInterface, AccountTypeEnum } from '@budgie/contracts';
import { useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { useAccountForm } from '../../hooks/use-account-form.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { accountService } from '../../service/account.service';
import { AccountTypeSelectorField } from '../account-type-selector-field/account-type-selector-field';
import { UpdateAccountScreen } from '../create-account-screen/update-account-screen';

interface Props {
    readonly account: AccountEntityInterface;
}

const CHANGEABLE_ACCOUNT_TYPES: AccountTypeEnum[] = [
    AccountTypeEnum.BANK,
    AccountTypeEnum.CASH,
    AccountTypeEnum.SAVINGS,
    AccountTypeEnum.CRYPTO,
    AccountTypeEnum.STOCKS
];

export const UpdateLiabilityAccount = ({ account }: Props) => {
    const { balance } = useAccountBalanceQuery(account.id);

    const { control, handleSubmit, instrument } = useAccountForm(
        {
            type: account.type,
            icon: account.icon,
            title: account.title,
            currentBalance: balance,
            instrumentId: account.instrumentId,
            includeInNetWorth: account.includeInNetWorth
        },
        async values => await accountService.updateById(account.id, values)
    );

    const currentType = useWatch({ control, name: 'type' });
    const canChangeType = CHANGEABLE_ACCOUNT_TYPES.includes(account.type);

    const updatedAccount = { ...account, type: currentType };

    if (!isDefined(instrument)) {
        return <EmptyScreen />;
    }

    return (
        <UpdateAccountScreen instrumentSymbol={instrument.symbol} onSubmit={handleSubmit} account={updatedAccount} control={control}>
            {canChangeType ? <AccountTypeSelectorField control={control} /> : null}
        </UpdateAccountScreen>
    );
};
